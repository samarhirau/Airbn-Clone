import { Types, type HydratedDocument } from 'mongoose';
import { Booking } from '../models/Booking';
import { Property } from '../models/Property';
import { Review, type ReviewAttrs } from '../models/Review';
import { AppError, ErrorCodes } from '../utils/errors';
import { getSkip } from '../utils/pagination';
import { cacheAside, cacheGetNumber } from '../cache/cache';
import { cacheKeys, TTL } from '../cache/keys';
import { invalidatePropertyReviews } from '../cache/invalidation';

const MESSAGES = {
  bookingNotFound: 'Booking not found.',
  notOwner: 'You can only review your own bookings.',
  notCompleted: 'You can only review a stay after it has been completed.',
  duplicate: 'You have already reviewed this booking.',
} as const;

export interface CreateReviewData {
  bookingId: string;
  rating: number;
  comment: string;
}

export interface PropertyReviewItem {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  customer: { id: string; name: string } | null;
}

export interface PropertyReviewsResult {
  items: PropertyReviewItem[];
  total: number;
  ratingAvg: number;
  ratingCount: number;
}

export interface MyReviewItem {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  property: { id: string; title: string } | null;
}

export interface MyReviewsResult {
  items: MyReviewItem[];
  total: number;
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

export interface RatingAggregate {
  ratingAvg: number;
  ratingCount: number;
}

interface PropertyReviewLean {
  _id: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  customer: { _id: Types.ObjectId; name: string } | null;
}

interface MyReviewLean {
  _id: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  property: { _id: Types.ObjectId; title: string } | null;
}

interface RatingGroup {
  _id: Types.ObjectId;
  avg: number;
  count: number;
}

export async function recomputePropertyRating(
  propertyId: Types.ObjectId | string,
): Promise<RatingAggregate> {
  const _id = new Types.ObjectId(propertyId);
  const [group] = await Review.aggregate<RatingGroup>([
    { $match: { property: _id } },
    { $group: { _id: '$property', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const ratingCount = group ? group.count : 0;
  const ratingAvg = group ? Math.round(group.avg * 10) / 10 : 0;

  await Property.updateOne({ _id }, { $set: { ratingAvg, ratingCount } });
  return { ratingAvg, ratingCount };
}

export async function createReview(
  customerId: string,
  data: CreateReviewData,
): Promise<HydratedDocument<ReviewAttrs>> {
  const booking = await Booking.findById(data.bookingId);
  if (!booking) throw AppError.notFound(MESSAGES.bookingNotFound);

  if (String(booking.customer) !== customerId) throw AppError.forbidden(MESSAGES.notOwner);

  if (booking.status !== 'completed') {
    throw AppError.conflict(MESSAGES.notCompleted, ErrorCodes.REVIEW_NOT_ELIGIBLE);
  }

  const already = await Review.exists({ booking: booking._id });
  if (already) throw AppError.conflict(MESSAGES.duplicate, ErrorCodes.REVIEW_DUPLICATE);

  const review = await Review.create({
    customer: new Types.ObjectId(customerId),
    property: booking.property,
    owner: booking.owner,
    booking: booking._id,
    rating: data.rating,
    comment: data.comment,
  });

  await recomputePropertyRating(booking.property);
  await invalidatePropertyReviews(String(booking.property));

  return review;
}

export async function listPropertyReviews(
  propertyId: string,
  page: number,
  limit: number,
): Promise<PropertyReviewsResult> {
  const version = await cacheGetNumber(cacheKeys.propertyReviewsVersion(propertyId));
  const key = cacheKeys.propertyReviews(propertyId, version, page, limit);

  return cacheAside<PropertyReviewsResult>(key, TTL.propertyReviews, async () => {
    const [docs, total, property] = await Promise.all([
      Review.find({ property: propertyId })
        .sort({ createdAt: -1 })
        .skip(getSkip(page, limit))
        .limit(limit)
        .populate('customer', 'name')
        .lean<PropertyReviewLean[]>(),
      Review.countDocuments({ property: propertyId }),
      Property.findById(propertyId).select('ratingAvg ratingCount').lean<{
        ratingAvg: number;
        ratingCount: number;
      } | null>(),
    ]);

    const items: PropertyReviewItem[] = docs.map((d) => ({
      id: String(d._id),
      rating: d.rating,
      comment: d.comment,
      createdAt: d.createdAt,
      customer: d.customer ? { id: String(d.customer._id), name: d.customer.name } : null,
    }));

    return {
      items,
      total,
      ratingAvg: property?.ratingAvg ?? 0,
      ratingCount: property?.ratingCount ?? 0,
    };
  });
}

export async function listMyReviews(
  customerId: string,
  page: number,
  limit: number,
): Promise<MyReviewsResult> {
  const [docs, total] = await Promise.all([
    Review.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .skip(getSkip(page, limit))
      .limit(limit)
      .populate('property', 'title')
      .lean<MyReviewLean[]>(),
    Review.countDocuments({ customer: customerId }),
  ]);

  const items: MyReviewItem[] = docs.map((d) => ({
    id: String(d._id),
    rating: d.rating,
    comment: d.comment,
    createdAt: d.createdAt,
    property: d.property ? { id: String(d.property._id), title: d.property.title } : null,
  }));

  return { items, total };
}

export async function checkEligibility(
  customerId: string,
  bookingId: string,
): Promise<EligibilityResult> {
  const booking = await Booking.findById(bookingId).select('customer status').lean<{
    _id: Types.ObjectId;
    customer: Types.ObjectId;
    status: string;
  } | null>();
  if (!booking) throw AppError.notFound(MESSAGES.bookingNotFound);

  if (String(booking.customer) !== customerId) {
    throw AppError.forbidden(MESSAGES.notOwner);
  }
  if (booking.status !== 'completed') {
    return { eligible: false, reason: MESSAGES.notCompleted };
  }
  const already = await Review.exists({ booking: booking._id });
  if (already) {
    return { eligible: false, reason: MESSAGES.duplicate };
  }
  return { eligible: true };
}
