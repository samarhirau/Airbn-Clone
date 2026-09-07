import { Types } from 'mongoose';
import { Wishlist } from '../models/Wishlist';
import { Property } from '../models/Property';
import { AppError, ErrorCodes } from '../utils/errors';
import { getSkip } from '../utils/pagination';

const PROPERTY_CARD_FIELDS =
  'title location.city pricePerNight images ratingAvg ratingCount isActive';

export interface WishlistEntry {
  _id: Types.ObjectId;
  customer: Types.ObjectId;
  property: {
    _id: Types.ObjectId;
    title: string;
    location: { city: string };
    pricePerNight: number;
    images: { url: string; publicId?: string }[];
    ratingAvg: number;
    ratingCount: number;
    isActive: boolean;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getWishlist(
  customerId: string,
  page: number,
  limit: number,
): Promise<{ items: WishlistEntry[]; total: number }> {
  const filter = { customer: new Types.ObjectId(customerId) };
  const [items, total] = await Promise.all([
    Wishlist.find(filter)
      .sort({ createdAt: -1 })
      .skip(getSkip(page, limit))
      .limit(limit)
      .populate('property', PROPERTY_CARD_FIELDS)
      .lean<WishlistEntry[]>(),
    Wishlist.countDocuments(filter),
  ]);
  return { items, total };
}

export async function addToWishlist(customerId: string, propertyId: string) {
  const propertyExists = await Property.exists({ _id: propertyId });
  if (!propertyExists) {
    throw AppError.notFound('Property not found.');
  }

  const customer = new Types.ObjectId(customerId);
  const property = new Types.ObjectId(propertyId);

  const already = await Wishlist.exists({ customer, property });
  if (already) {
    throw AppError.conflict('Property is already in your wishlist.', ErrorCodes.WISHLIST_DUPLICATE);
  }

  return Wishlist.create({ customer, property });
}

export async function removeFromWishlist(
  customerId: string,
  propertyId: string,
): Promise<{ propertyId: string; removed: true }> {
  const { deletedCount } = await Wishlist.deleteOne({
    customer: new Types.ObjectId(customerId),
    property: new Types.ObjectId(propertyId),
  });
  if (!deletedCount) {
    throw AppError.notFound('Wishlist entry not found.');
  }
  return { propertyId, removed: true };
}

export async function getWishlistIds(customerId: string): Promise<string[]> {
  const docs = await Wishlist.find({ customer: new Types.ObjectId(customerId) })
    .sort({ createdAt: -1 })
    .select('property')
    .lean<{ property: Types.ObjectId }[]>();
  return docs.map((d) => String(d.property));
}
