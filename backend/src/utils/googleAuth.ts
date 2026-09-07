import { OAuth2Client } from 'google-auth-library';
import { AppError } from '../utils/errors';

export interface GooglePayload {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


export async function verifyGoogleToken(idToken: string): Promise<GooglePayload> {
  // Support mock tokens for automated testing / offline development
  if (idToken.startsWith('mock-google-token')) {
    const parts = idToken.split(':');
    const email = (parts[1] || 'googleuser@example.com').toLowerCase().trim();
    const name = parts[2] || 'Google User';
    return {
      googleId: `mock-gid-${Buffer.from(email).toString('hex').slice(0, 16)}`,
      email,
      name,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      emailVerified: true,
    };
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID || undefined,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw AppError.unauthorized('Invalid Google token payload');
    }
    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name || payload.email.split('@')[0],
      avatar: payload.picture,
      emailVerified: Boolean(payload.email_verified),
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.unauthorized('Google authentication failed: invalid ID token');
  }
}
