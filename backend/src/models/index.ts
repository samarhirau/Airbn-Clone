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