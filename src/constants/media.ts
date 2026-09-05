export const SAVE_JPEG_QUALITY = 0.96;

/** Target max file size per photo embedded in PDF (500 KB). */
export const PDF_IMAGE_MAX_BYTES = 500 * 1024;

/** Longest edge after resize — enough for invoice text on A4 (~200 DPI). */
export const PDF_MAX_LONG_EDGE = 2048;

/** Fallback long edge if quality floor still exceeds size budget. */
export const PDF_FALLBACK_LONG_EDGE = 1600;

export const PDF_QUALITY_MIN = 0.55;
export const PDF_QUALITY_MAX = 0.92;
export const PDF_QUALITY_PRECISION = 0.04;

export const PHOTO_EXTENSIONS = new Set(["jpg", "jpeg", "heic", "png"]);
export const PDF_EXTENSIONS = new Set(["pdf"]);
