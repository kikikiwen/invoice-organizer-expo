/** Store product ids. Create the same ids in App Store Connect and Google Play. */
export const PHOTO_PACK_30_ID = "photos_30";
export const PHOTO_PACK_100_ID = "photos_100";
export const UNLIMITED_MONTHLY_ID = "unlimited_monthly";

export const FREE_SAVE_CREDITS = 20;

export const PACK_CREDITS: Record<string, number> = {
  [PHOTO_PACK_30_ID]: 30,
  [PHOTO_PACK_100_ID]: 100,
};

export const ANDROID_PACKAGE = "com.kikiwen.invoiceorganizer";

/** Used only when the store says the subscription is active but gives no expiry. */
export const SUBSCRIPTION_OFFLINE_WINDOW_MS = 24 * 60 * 60 * 1000;

export const CONSUMABLE_IDS = [PHOTO_PACK_30_ID, PHOTO_PACK_100_ID] as const;
