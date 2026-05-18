import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authorized, no token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Not authorized, no token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true },
    });

    if (!user) {
      res.status(401).json({ error: "Not authorized, user not found" });
      return;
    }

    req.user = user;
    next();
    return;
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ error: "Not authorized, token failed" });
    return;
  }
};