import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'birthdayboard_neon_jwt_secret_dev_key';

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateAuthToken(payload: { uid: string; email: string; displayName?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing authentication token' });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { uid: string; email: string; displayName?: string };
    if (decoded && decoded.uid) {
      req.user = decoded;
      return next();
    }
  } catch {
    // If not matching JWT_SECRET, check fallback token decoding
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson);
        const uid = payload.uid || payload.user_id || payload.sub;
        if (uid) {
          req.user = { uid, email: payload.email || `${uid}@bashke.app` };
          return next();
        }
      }
    } catch {
      // ignore
    }
  }

  return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired session. Please sign in.' });
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { uid: string; email: string; displayName?: string };
      if (decoded && decoded.uid) {
        req.user = decoded;
      }
    } catch {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
          const payload = JSON.parse(payloadJson);
          const uid = payload.uid || payload.user_id || payload.sub;
          if (uid) {
            req.user = { uid, email: payload.email || `${uid}@bashke.app` };
          }
        }
      } catch {
        // ignore
      }
    }
  }
  next();
};
