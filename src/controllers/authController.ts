import { Request, Response } from "express";
import bcrypt from "bcrypt";

import prisma from "../prisma.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { OAuth2Client } from "google-auth-library";
import { generateToken } from "../utils/generateToken.js";

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

const token = generateToken(newUser.id);

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

    if (!user.password) {
      res.status(400).json({
        error: "This account uses Google sign in. Please continue with Google.",
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    const token = generateToken(user.id);

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



const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({ error: "Google credential is required" });
      return;
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      res.status(500).json({ error: "Google client id is not configured" });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      res.status(400).json({ error: "Google account email not found" });
      return;
    }

    const email = payload.email;
    const name = payload.name ?? email.split("@")[0];

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: null,
          hasProvider: true,
          provider: "google",
          providerId: payload.sub,
          userImage: payload.picture ?? null,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          hasProvider: true,
          provider: "google",
          providerId: user.providerId ?? payload.sub,
          userImage: user.userImage ?? payload.picture ?? null,
        },
      });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      message: "Logged in with Google successfully",
      token,
      user: buildSafeUser(user),
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Failed to sign in with Google" });
  }
};