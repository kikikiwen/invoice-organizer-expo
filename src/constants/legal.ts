import type { AppLocale } from "../i18n/types";

export const PRIVACY_POLICY_BASE_URL =
  "https://kikikiwen.github.io/invoice-organizer-expo";

const PRIVACY_POLICY_HASH: Record<AppLocale, string> = {
  en: "en",
  fr: "fr",
  zh: "zh",
};

export function getPrivacyPolicyUrl(locale: AppLocale): string {
  return `${PRIVACY_POLICY_BASE_URL}/privacy-policy.html#${PRIVACY_POLICY_HASH[locale]}`;
}
