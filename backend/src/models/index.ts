/** Central export point for all Mongoose models (also ensures registration). */
export { User, UserRoles, type UserRole, type UserDocument, type UserAttrs } from './User';
export { RefreshToken, type RefreshTokenAttrs } from './RefreshToken';
export {
  Property,
  PropertyTypes,
  type PropertyType,
  type PropertyAttrs,
} from './Property';
export {
  Booking,
  BookingStatuses,
  ACTIVE_BOOKING_STATUSES,
  type BookingStatus,
  type BookingAttrs,
} from './Booking';
export { Review, type ReviewAttrs } from './Review';
export { Wishlist, type WishlistAttrs } from './Wishlist';
export { Coupon, type CouponAttrs, type CouponDocument, type DiscountType } from './Coupon';
export {
  Payment,
  type PaymentAttrs,
  type PaymentDocument,
  type PaymentStatus,
  type PaymentMethod,
} from './Payment';