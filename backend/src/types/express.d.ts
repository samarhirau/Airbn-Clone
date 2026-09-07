import type { UserRole } from '../models/User';


declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id: string;
      user?: {
        id: string;
        role: UserRole;
        tokenVersion: number;
        email: string;
        name: string;
      };
    }
  }
}

export {};
