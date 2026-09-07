import { z } from 'zod';
import { objectId, paginationQuery } from './common';

export const addWishlistBody = z.object({
  propertyId: objectId,
});

export const wishlistIdParams = z.object({
  propertyId: objectId,
});

export const listWishlistQuery = paginationQuery;

export type AddWishlistInput = z.infer<typeof addWishlistBody>;
export type WishlistIdParams = z.infer<typeof wishlistIdParams>;
export type ListWishlistQuery = z.infer<typeof listWishlistQuery>;
