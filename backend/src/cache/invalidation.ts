import { cacheDel, cacheIncr } from './cache';
import { cacheKeys } from './keys';


// Cache invalidation strategy.

/** Invalidate all property listing caches by advancing the version counter. */
export async function bumpPropertyListVersion(): Promise<void> {
  await cacheIncr(cacheKeys.propertyListVersion());
}

/** A property was created/updated/deleted or its rating changed. */
export async function invalidateProperty(propertyId: string, ownerId?: string): Promise<void> {
  await Promise.all([
    cacheDel(cacheKeys.propertyDetail(propertyId)),
    bumpPropertyListVersion(),
    cacheDel(cacheKeys.adminDashboard()),
    ownerId ? cacheDel(cacheKeys.ownerDashboard(ownerId)) : Promise.resolve(),
  ]);
}

/** Reviews changed for a property: bump its reviews version and refresh its detail (rating). */
export async function invalidatePropertyReviews(propertyId: string): Promise<void> {
  await Promise.all([
    cacheIncr(cacheKeys.propertyReviewsVersion(propertyId)),
    cacheDel(cacheKeys.propertyDetail(propertyId)),
    bumpPropertyListVersion(),
  ]);
}

/** A booking was created/cancelled/completed: dashboards' occupancy/counts changed. */
export async function invalidateBookingDashboards(ownerId?: string): Promise<void> {
  await Promise.all([
    cacheDel(cacheKeys.adminDashboard()),
    ownerId ? cacheDel(cacheKeys.ownerDashboard(ownerId)) : Promise.resolve(),
  ]);
}

/** A user was created or had their role/active status changed: admin user tallies changed. */
export async function invalidateAdminDashboard(): Promise<void> {
  await cacheDel(cacheKeys.adminDashboard());
}
