export const MIN_SPLASH_DURATION_MS = 1000;

let appLaunchedAt = Date.now();

export function markAppLaunched(): void {
  appLaunchedAt = Date.now();
}

export function getRemainingSplashMs(
  minMs: number = MIN_SPLASH_DURATION_MS,
): number {
  return Math.max(0, minMs - (Date.now() - appLaunchedAt));
}

export async function waitForMinSplashDuration(
  minMs: number = MIN_SPLASH_DURATION_MS,
): Promise<void> {
  const remaining = getRemainingSplashMs(minMs);
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}
