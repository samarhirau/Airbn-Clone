import type { NextFunction, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError, ErrorCodes } from '../utils/errors';
import { verifyAccessToken } from '../utils/jwt';
import { getAuthUser } from '../cache/userCache';

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length ? token : null;
}

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractBearer(req);
  if (!token) throw AppError.unauthorized('Authentication required.');

  // jwt.verify throws JsonWebTokenError/TokenExpiredError → mapped to 401 centrally.
  const payload = verifyAccessToken(token);

  const user = await getAuthUser(payload.sub);
  if (!user || !user.isActive) {
    throw AppError.unauthorized('Account not found or deactivated.');
  }
  if (user.tokenVersion !== payload.tv) {
    throw AppError.unauthorized('Session is no longer valid. Please log in again.', ErrorCodes.TOKEN_INVALID);
  }

  req.user = {
    id: user.id,
    role: user.role,
    tokenVersion: user.tokenVersion,
    email: user.email,
    name: user.name,
  };
  next();
});

/**
 * Populate `req.user` if a valid token is present, but never reject. Useful for
 * endpoints whose response is enriched for authenticated users.
 */
export const optionalAuthenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractBearer(req);
    if (!token) return next();
    try {
      const payload = verifyAccessToken(token);
      const user = await getAuthUser(payload.sub);
      if (user && user.isActive && user.tokenVersion === payload.tv) {
        req.user = {
          id: user.id,
          role: user.role,
          tokenVersion: user.tokenVersion,
          email: user.email,
          name: user.name,
        };
      }
    } catch {
      // Ignore invalid tokens for optional auth.
    }
    next();
  },
);
