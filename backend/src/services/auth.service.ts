import { User, type UserDocument, type UserRole } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { hashPassword, verifyPassword } from '../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  newJti,
  newFamily,
} from '../utils/jwt';
import { AppError, ErrorCodes } from '../utils/errors';
import { invalidateAuthUser } from '../cache/userCache';
import { invalidateAdminDashboard } from '../cache/invalidation';
import type { RegisterInput, LoginInput, UpdateProfileInput, GoogleAuthInput } from '../validators/auth.validator';

interface GoogleTokenPayload {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

async function verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload> {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );
  if (!response.ok) {
    throw AppError.unauthorized('Invalid Google sign-in token.', ErrorCodes.INVALID_CREDENTIALS);
  }

  const token = (await response.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
    aud?: string;
  };
  if (
    !token.sub ||
    !token.email ||
    !token.name ||
    (process.env.GOOGLE_CLIENT_ID && token.aud !== process.env.GOOGLE_CLIENT_ID)
  ) {
    throw AppError.unauthorized('Invalid Google sign-in token.', ErrorCodes.INVALID_CREDENTIALS);
  }

  return {
    googleId: token.sub,
    email: token.email,
    name: token.name,
    avatar: token.picture,
  };
}

//  Authentication service

const REFRESH_REPLAY_GRACE_MS = 10_000;

const DUMMY_PASSWORD_HASH = hashPassword('stayhub::login::timing::equalizer');

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  isActive: boolean;
  isGoogleAuth?: boolean;
  createdAt?: Date;
}

export interface AuthContext {
  userAgent?: string;
  ip?: string;
}

export interface SessionResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

function toSafeUser(u: UserDocument): SafeUser {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role as UserRole,
    phone: u.phone ?? null,
    avatar: u.avatar ?? null,
    bio: u.bio ?? null,
    isActive: u.isActive ?? true,
    isGoogleAuth: Boolean(u.isGoogleAuth),
    createdAt: (u as unknown as { createdAt?: Date }).createdAt,
  };
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

/** Persist a refresh-token record and return the signed token + its expiry. */
async function persistRefresh(
  user: UserDocument,
  family: string,
  jti: string,
  ctx: AuthContext,
): Promise<{ refreshToken: string; refreshExpiresAt: Date }> {
  const refreshToken = signRefreshToken({ sub: String(user._id), jti, family });
  const { exp } = verifyRefreshToken(refreshToken);
  const refreshExpiresAt = new Date(exp * 1000);
  await RefreshToken.create({
    user: user._id,
    jti,
    family,
    expiresAt: refreshExpiresAt,
    userAgent: ctx.userAgent,
    ip: ctx.ip,
  });
  return { refreshToken, refreshExpiresAt };
}

/** Start a brand-new session (fresh family) for a user. */
async function startSession(user: UserDocument, ctx: AuthContext): Promise<SessionResult> {
  const family = newFamily();
  const jti = newJti();
  const { refreshToken, refreshExpiresAt } = await persistRefresh(user, family, jti, ctx);
  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role as UserRole,
    tv: user.tokenVersion ?? 0,
  });
  return { user: toSafeUser(user), accessToken, refreshToken, refreshExpiresAt };
}

/** Revoke every live token in a family and invalidate the user's access tokens. */
async function revokeFamily(family: string, userId: string): Promise<void> {
  await RefreshToken.updateMany({ family, revokedAt: null }, { revokedAt: new Date() });
  // Token reuse implies possible theft — bump tokenVersion so outstanding access
  // tokens are immediately rejected too.
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
  await invalidateAuthUser(userId);
}

export async function register(input: RegisterInput, ctx: AuthContext): Promise<SessionResult> {
  const passwordHash = await hashPassword(input.password);
  let user: UserDocument;
  try {
    user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role ?? 'customer',
      phone: input.phone,
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw AppError.conflict('This email is already registered.', ErrorCodes.EMAIL_TAKEN);
    }
    throw err;
  }
  await invalidateAdminDashboard();
  return startSession(user, ctx);
}

export async function login(input: LoginInput, ctx: AuthContext): Promise<SessionResult> {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user) {
    await verifyPassword(input.password, await DUMMY_PASSWORD_HASH);
    throw AppError.unauthorized('Invalid email or password.', ErrorCodes.INVALID_CREDENTIALS);
  }
  if (!user.passwordHash) {
    throw AppError.badRequest(
      'This account was registered using Google Sign-In. Please sign in with Google.',
      ErrorCodes.INVALID_CREDENTIALS,
    );
  }
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw AppError.unauthorized('Invalid email or password.', ErrorCodes.INVALID_CREDENTIALS);
  }
  if (!user.isActive) {
    throw AppError.forbidden('This account has been deactivated.');
  }
  return startSession(user, ctx);
}

export async function refresh(rawToken: string, ctx: AuthContext): Promise<SessionResult> {
  let payload: { sub: string; jti: string; family: string };
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw AppError.unauthorized('Invalid or expired session. Please log in again.', ErrorCodes.TOKEN_INVALID);
  }
  const { sub, jti, family } = payload;

  const successorJti = newJti();
  const consumed = await RefreshToken.findOneAndUpdate(
    { jti, revokedAt: null },
    { revokedAt: new Date(), replacedByJti: successorJti },
    { new: false },
  );

  if (!consumed) {
    const existing = await RefreshToken.findOne({ jti });
    if (existing?.replacedByJti) {
      const successor = await RefreshToken.findOne({ jti: existing.replacedByJti });
      const successorCreatedAt = (successor as unknown as { createdAt?: Date } | null)?.createdAt;
      const withinGrace =
        successorCreatedAt !== undefined &&
        Date.now() - successorCreatedAt.getTime() < REFRESH_REPLAY_GRACE_MS;
      if (successor && !successor.revokedAt && successor.expiresAt.getTime() > Date.now() && withinGrace) {
        throw AppError.unauthorized('Stale session token, please retry.', ErrorCodes.TOKEN_INVALID);
      }
    }
    await revokeFamily(family, sub);
    throw AppError.unauthorized('Session reuse detected. Please log in again.', ErrorCodes.TOKEN_INVALID);
  }

  if (consumed.expiresAt.getTime() <= Date.now()) {
    throw AppError.unauthorized('Session expired. Please log in again.', ErrorCodes.TOKEN_EXPIRED);
  }

  const user = await User.findById(sub);
  if (!user || !user.isActive) {
    await revokeFamily(family, sub);
    throw AppError.unauthorized('Account not found or deactivated.', ErrorCodes.TOKEN_INVALID);
  }

  const { refreshToken, refreshExpiresAt } = await persistRefresh(user, family, successorJti, ctx);
  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role as UserRole,
    tv: user.tokenVersion ?? 0,
  });
  return { user: toSafeUser(user), accessToken, refreshToken, refreshExpiresAt };
}

export async function logout(rawToken?: string): Promise<void> {
  if (!rawToken) return;
  try {
    const { family } = verifyRefreshToken(rawToken);
    await RefreshToken.updateMany({ family, revokedAt: null }, { revokedAt: new Date() });
  } catch {
    // Idempotent: ignore invalid tokens on logout
  }
}

export async function getProfile(userId: string): Promise<SafeUser> {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found.');
  return toSafeUser(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<SafeUser> {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found.');
  if (input.name !== undefined) user.name = input.name;
  if (input.phone !== undefined) user.phone = input.phone;
  if (input.avatar !== undefined) user.avatar = input.avatar;
  if (input.bio !== undefined) user.bio = input.bio;
  await user.save();
  await invalidateAuthUser(userId);
  return toSafeUser(user);
}



/** Google OAuth sign-in / registration via frontend ID token. */
export async function googleAuth(input: GoogleAuthInput, ctx: AuthContext): Promise<SessionResult> {
  const payload = await verifyGoogleToken(input.idToken);

  let user = await User.findOne({
    $or: [{ googleId: payload.googleId }, { email: payload.email }],
  });

  if (user) {
    let modified = false;
    if (!user.googleId) {
      user.googleId = payload.googleId;
      modified = true;
    }
    if (!user.isGoogleAuth) {
      user.isGoogleAuth = true;
      modified = true;
    }
    if (!user.avatar && payload.avatar) {
      user.avatar = payload.avatar;
      modified = true;
    }
    if (modified) {
      await user.save();
    }
  } else {
    user = await User.create({
      name: payload.name,
      email: payload.email,
      googleId: payload.googleId,
      isGoogleAuth: true,
      role: input.role ?? 'customer',
      avatar: payload.avatar,
      isActive: true,
    });
    await invalidateAdminDashboard();
  }

  if (!user.isActive) {
    throw AppError.forbidden('This account has been deactivated.');
  }

  return startSession(user, ctx);
}
