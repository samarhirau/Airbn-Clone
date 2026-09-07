import type { CookieOptions, Request } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError, ErrorCodes } from '../utils/errors';
import * as authService from '../services/auth.service';

/**
 * The refresh token lives in an httpOnly cookie (never readable by JS, mitigating XSS
 * token theft). It is scoped to the auth path so it is only sent to refresh/logout.
 */
const REFRESH_COOKIE = 'refreshToken';

function refreshCookieOptions(expiresAt?: Date): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SECURE === 'true' ? 'none' : 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/api/auth',
    ...(expiresAt ? { expires: expiresAt } : {}),
  };
}

function contextFrom(req: Request): authService.AuthContext {
  return { userAgent: req.headers['user-agent'], ip: req.ip };
}

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, contextFrom(req));
  res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions(result.refreshExpiresAt));
  return sendSuccess(res, { user: result.user, accessToken: result.accessToken }, 201);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, contextFrom(req));
  res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions(result.refreshExpiresAt));
  return sendSuccess(res, { user: result.user, accessToken: result.accessToken }, 200);
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!token) {
    throw AppError.unauthorized('No active session. Please log in.', ErrorCodes.TOKEN_INVALID);
  }
  const result = await authService.refresh(token, contextFrom(req));
  res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions(result.refreshExpiresAt));
  return sendSuccess(res, { user: result.user, accessToken: result.accessToken }, 200);
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
  return sendSuccess(res, { loggedOut: true }, 200);
});

export const me = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw AppError.unauthorized();
  const user = await authService.getProfile(userId);
  return sendSuccess(res, { user }, 200);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw AppError.unauthorized();
  const user = await authService.updateProfile(userId, req.body);
  return sendSuccess(res, { user }, 200);
});
