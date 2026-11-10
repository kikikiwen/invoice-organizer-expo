/** Store product ids. Create both as consumables in App Store Connect and Google Play. */
export const PHOTO_PACK_30_ID = "photos_30";
export const PHOTO_PACK_LARGE_ID = "photos_100000000";

export const FREE_SAVE_CREDITS = 20;

export const PACK_CREDITS: Record<string, number> = {
  [PHOTO_PACK_30_ID]: 30,
  [PHOTO_PACK_LARGE_ID]: 100_000_000,
};

export const CONSUMABLE_IDS = [PHOTO_PACK_30_ID, PHOTO_PACK_LARGE_ID] as const;
