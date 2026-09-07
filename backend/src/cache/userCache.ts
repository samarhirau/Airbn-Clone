import { User, type UserRole } from '../models/User';
import { cacheAside, cacheDel } from './cache';
import { cacheKeys, TTL } from './keys';

export interface AuthUser {
  id: string;
  role: UserRole;
  tokenVersion: number;
  email: string;
  name: string;
  isActive: boolean;
}


// Load the minimal user record needed for authentication, cached briefly in Redis.
export async function getAuthUser(id: string): Promise<AuthUser | null> {
  return cacheAside<AuthUser | null>(cacheKeys.userAuth(id), TTL.userAuth, async () => {
    const user = await User.findById(id).select('role tokenVersion email name isActive').lean();
    if (!user) return null;
    return {
      id: String(user._id),
      role: user.role as UserRole,
      tokenVersion: user.tokenVersion ?? 0,
      email: user.email,
      name: user.name,
      isActive: user.isActive ?? true,
    };
  });
}

export async function invalidateAuthUser(id: string): Promise<void> {
  await cacheDel(cacheKeys.userAuth(id));
}
