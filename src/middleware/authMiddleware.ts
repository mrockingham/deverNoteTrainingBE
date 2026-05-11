import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Extend the Express Request type to include our user object
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  // Check if the authorization header exists and starts with "Bearer"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get the token from the header (Format: "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

      // Fetch the user from the database and attach it to the request
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true } // We only need id and email
      });

      if (!user) {
        res.status(401).json({ error: 'Not authorized, user not found' });
        return;
      }

      req.user = user;
      next(); // Move on to the actual controller
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

if (!token) {
  res.status(401).json({ error: "Not authorized, no token provided" });
  return;
}
};