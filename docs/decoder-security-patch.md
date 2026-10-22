# URL decoder security backport

Advisory: CVE-2026-45822 / GHSA-vcc3-ghjq-m6fr.

Upstream fix (MIT):
https://github.com/SamVerschueren/decode-uri-component/commit/fa479dafeede7bedf04e5c89aa78f2a78c664005

Only the UTF-8 scanner and its helpers are backported into decode-uri-component
0.2.2. The recursive decoder and its matcher are removed. The CommonJS export,
input validation, native decode fast path, and legacy `+`-to-space conversion
remain unchanged. Malformed sequences use the upstream security fix's behavior;
this intentionally includes its regression fix for percent-byte recombination.
Normal, valid URL decoding is unchanged.

The repository currently uses Expo SDK 57.0.20 / Router 57.0.19, not SDK 54.
Registry checks on 2026-10-22 found Router 57.0.0–57.0.29 and the SDK 54
Router 6.0.0–6.0.24 series still depend on query-string ^7.1.3, which requires
decode-uri-component ^0.2.2. No SDK or Router upgrade is included here.

`patch-package` is a production dependency so production-only npm installs can
apply the patch. `postinstall` applies it with `--error-on-fail`, then verifies
the exact LF-normalized source hash resolved through Router -> query-string.
The standard EAS iOS/Android post-install hook repeats that verification before
building. Commit package.json, package-lock.json, patches/, and scripts/ together.
Do not use --ignore-scripts; custom build pipelines must also run the verifier.
The patch is not ignored by .gitignore and must be included in build uploads.

Run `npm run test:decoder` for the upstream fixture suite (MIT license included),
legacy API behavior, valid Unicode, real Router query parsing, callback/deep-link
parameter cases, and timeout-bounded malicious / oversized URL tests. The
upstream fixture adapter escapes literal plus signs because upstream 0.5 changed
that API behavior; separate tests ensure this backport preserves 0.2.2 behavior.
The app has no login flow; callback parsing is tested with representative inputs,
not a live identity provider.

npm audit is version-based: it will still report 0.2.2 even when this patched
implementation is installed. Do not suppress the advisory globally or claim the
remaining unrelated dependency findings are fixed. The verifier detects lost
patches or changed resolution instead of relying on the audit version result.

Audit on 2026-10-22 reports 28 package entries (6 moderate, 21 high, 1 critical).
The extra two entries versus the prior 26 are patch-package and
find-yarn-workspace-root, propagated from the existing micromatch/braces
advisory. These installation tools are not imported by the app's runtime;
the underlying advisory remains open and is not fixed by this decoder patch.

This is JavaScript-only and does not change native dependencies or runtimeVersion.
A compatible EAS Update can deliver the fix to existing installations; old
installed bundles remain vulnerable until updated. Future store binaries should
be rebuilt with this patch. Native signing/build success and device-level deep
links require iOS/Android device/build verification in addition to JS tests.

## Validation completed (2026-10-22)

- Before installation: 135 upstream cases and 10,000 valid-input comparisons
  passed against an in-memory backport; 300,000 malformed characters completed.
- Clean `npm ci` applied the patch and passed the runtime-resolution verifier.
- All decoder tests, TypeScript, and the three existing regression suites passed.
- Production Hermes export for both iOS and Android succeeded. Both source maps
  contain exactly the verified decoder hash; neither includes patch-package.
- Negative control: reversing the patch caused verification to fail and the
  bounded malicious-input test to fail. A normal `npm install --offline` then
  reapplied the patch automatically and passed verification.
- No pre-existing package versions changed. No SDK upgrade, force audit fix,
  native build submission, commit, push, or OTA publication was performed.
