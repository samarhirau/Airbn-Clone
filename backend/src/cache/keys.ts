import crypto from 'node:crypto';

/** Cache TTLs (seconds), tuned per data volatility. */
export const TTL = {
  userAuth: 60,
  propertyDetail: 300,
  propertyList: 60,
  propertyReviews: 120,
  dashboard: 30,
  analytics: 60,
} as const;

export const cacheKeys = {
  userAuth: (id: string) => `user:auth:${id}`,
  propertyDetail: (id: string) => `property:${id}`,
  /** Per-property reviews version; bumping invalidates all cached review pages for that property. */
  propertyReviewsVersion: (id: string) => `property:${id}:reviewsVersion`,
  propertyReviews: (id: string, version: number, page: number, limit: number) =>
    `property:${id}:reviews:v${version}:p${page}:l${limit}`,
  /** Monotonic version counter; bumping it invalidates *all* listing cache entries. */
  propertyListVersion: () => `props:listVersion`,
  propertyList: (version: number, hash: string) => `props:list:v${version}:${hash}`,
  adminDashboard: () => `admin:dashboard`,
  ownerDashboard: (ownerId: string) => `owner:${ownerId}:dashboard`,
  ownerAnalytics: (ownerId: string, months: number) => `owner:${ownerId}:analytics:${months}`,
  adminAnalytics: (months: number) => `admin:analytics:${months}`,
};


export function hashQuery(query: Record<string, unknown>): string {
  const normalized = Object.keys(query)
    .filter((k) => query[k] !== undefined && query[k] !== '')
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = query[k];
      return acc;
    }, {});
  return crypto.createHash('sha1').update(JSON.stringify(normalized)).digest('hex');
}
