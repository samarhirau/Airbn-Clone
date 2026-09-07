import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { UserRole } from '../models/User';

// JWT utilities.

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  tv: number;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  family: string;
}

const getAccessSecret = (): string => process.env.JWT_ACCESS_SECRET || 'default_jwt_access_secret_key_12345678';
const getRefreshSecret = (): string => process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret_key_1234567';

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as any,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, getAccessSecret()) as unknown as AccessTokenPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any,
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload & { exp: number } {
  return jwt.verify(token, getRefreshSecret()) as unknown as RefreshTokenPayload & { exp: number };
}

export function newJti(): string {
  return crypto.randomUUID();
}

export function newFamily(): string {
  return crypto.randomUUID();
}
