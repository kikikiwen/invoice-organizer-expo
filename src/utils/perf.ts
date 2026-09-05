export async function measureAsync<T>(
  label: string,
  action: () => Promise<T>,
): Promise<T> {
  if (!__DEV__) {
    return action();
  }

  const startedAt = Date.now();
  try {
    return await action();
  } finally {
    console.log(`[perf] ${label}: ${Date.now() - startedAt}ms`);
  }
}
