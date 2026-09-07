/** Pagination helpers shared across list endpoints. */
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export function getSkip(page: number, limit: number): number {
  return (Math.max(1, page) - 1) * limit;
}

export function resolveSort<T extends Record<string, Record<string, 1 | -1>>>(
  token: string | undefined,
  allowed: T,
  fallbackKey: keyof T,
): Record<string, 1 | -1> {
  if (token && token in allowed) return allowed[token];
  return allowed[fallbackKey];
}
