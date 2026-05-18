import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

const buildSafeUser = (user: {
  id: string;
  name: string;
  userName: string | null;
  email: string;
  theme: string;
  hasProvider: boolean;
  provider: string | null;
  userImage: string | null;
  userImageId: string | null;
  bio: string | null;
  aiCreditsRemaining: number;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: user.id,
  name: user.name,
  userName: user.userName,
  email: user.email,
  theme: user.theme,
  hasProvider: user.hasProvider,
  provider: user.provider,
  userImage: user.userImage,
  userImageId: user.userImageId,
  bio: user.bio,
  aiCreditsRemaining: user.aiCreditsRemaining,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: "User already exists with this email" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: buildSafeUser(newUser),
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Internal server error during registration" });
  }
};

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Logged in successfully",
      token,
      user: buildSafeUser(user),
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
};

export const logout = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ error: "Internal server error during logout" });
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { userName, bio, theme, userImage, userImageId, name } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(userName !== undefined ? { userName } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(theme !== undefined ? { theme } : {}),
        ...(userImage !== undefined ? { userImage } : {}),
        ...(userImageId !== undefined ? { userImageId } : {}),
      },
    });

    res.status(200).json(buildSafeUser(updatedUser));
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(buildSafeUser(user));
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};