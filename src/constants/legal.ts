import type { AppLocale } from "../i18n/types";

export const PRIVACY_POLICY_BASE_URL =
  "https://kikikiwen.github.io/invoice-organizer-expo";

const PRIVACY_POLICY_PATH: Record<AppLocale, string> = {
  en: "privacy-policy-en.html",
  fr: "privacy-policy-fr.html",
  zh: "privacy-policy.html",
};

export function getPrivacyPolicyUrl(locale: AppLocale): string {
  return `${PRIVACY_POLICY_BASE_URL}/${PRIVACY_POLICY_PATH[locale]}`;
}
