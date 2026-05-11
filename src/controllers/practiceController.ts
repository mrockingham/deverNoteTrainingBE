import { Response } from "express";
import prisma from "../prisma.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import {
  createPracticeSessionSchema,
  submitStepAttemptSchema,
  updatePracticeSessionSchema,
} from "../schemas/practiceSchemas.js";
import { normalizeSandpackFiles } from "../utils/normalizeSandpackFiles.js";
import { parseSandpackFiles } from "../utils/parseSandpackFiles.js";
import { verifySubmission } from "../services/verificationService.js";

export const createPracticeSession = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = createPracticeSessionSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid practice session payload",
        details: parsed.error.flatten(),
      });
      return;
    }

    const { lessonPlanId } = parsed.data;

    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: { id: lessonPlanId },
    });

    if (!lessonPlan) {
      res.status(404).json({ error: "Lesson plan not found" });
      return;
    }

    if (lessonPlan.creatorId !== userId && !lessonPlan.isPublic) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const session = await prisma.practiceSession.create({
      data: {
        userId,
        lessonPlanId,
        currentStep: 0,
        currentRep: 1,
        bestRep: 0,
        totalReps: 0,
        status: "active",
      },
    });

    res.status(201).json(session);
  } catch (error) {
    console.error("Error creating practice session:", error);
    res.status(500).json({ error: "Failed to create practice session" });
  }
};

export const getPracticeSessionById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const sessionId =
      typeof req.params.id === "string" ? req.params.id : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ error: "Practice session id is required" });
      return;
    }

    const session = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
      include: {
        lessonPlan: {
          include: {
            steps: {
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        attempts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!session) {
      res.status(404).json({ error: "Practice session not found" });
      return;
    }

    if (session.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.status(200).json(session);
  } catch (error) {
    console.error("Error fetching practice session:", error);
    res.status(500).json({ error: "Failed to fetch practice session" });
  }
};

export const updatePracticeSession = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const sessionId =
      typeof req.params.id === "string" ? req.params.id : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ error: "Practice session id is required" });
      return;
    }

    const existingSession = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      res.status(404).json({ error: "Practice session not found" });
      return;
    }

    if (existingSession.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const parsed = updatePracticeSessionSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid practice session update payload",
        details: parsed.error.flatten(),
      });
      return;
    }

    const data = parsed.data;

    const updatedSession = await prisma.practiceSession.update({
      where: { id: sessionId },
      data: {
        ...(data.currentStep !== undefined ? { currentStep: data.currentStep } : {}),
        ...(data.currentRep !== undefined ? { currentRep: data.currentRep } : {}),
        ...(data.bestRep !== undefined ? { bestRep: data.bestRep } : {}),
        ...(data.totalReps !== undefined ? { totalReps: data.totalReps } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.completedAt !== undefined
          ? { completedAt: new Date(data.completedAt) }
          : {}),
      },
    });

    res.status(200).json(updatedSession);
  } catch (error) {
    console.error("Error updating practice session:", error);
    res.status(500).json({ error: "Failed to update practice session" });
  }
};

export const submitStepAttempt = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const sessionId =
      typeof req.params.id === "string" ? req.params.id : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ error: "Practice session id is required" });
      return;
    }

    const existingSession = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      res.status(404).json({ error: "Practice session not found" });
      return;
    }

    if (existingSession.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const parsed = submitStepAttemptSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid step attempt payload",
        details: parsed.error.flatten(),
      });
      return;
    }

    const data = parsed.data;

    const lessonStep = await prisma.lessonStep.findUnique({
      where: { id: data.lessonStepId },
    });

    if (!lessonStep) {
      res.status(404).json({ error: "Lesson step not found" });
      return;
    }

const parsedSubmittedFiles = parseSandpackFiles(data.submittedFiles);

const normalizedSubmittedFiles = normalizeSandpackFiles(data.submittedFiles);
const normalizedFiles = data.normalizedFiles
  ? normalizeSandpackFiles(data.normalizedFiles)
  : undefined;

const verification = verifySubmission(
  parsedSubmittedFiles,
  lessonStep.verificationRules
);

    const attempt = await prisma.stepAttempt.create({
      data: {
        userId,
        lessonStepId: data.lessonStepId,
        practiceSessionId: sessionId,
        repNumber: data.repNumber,
        submittedFiles: normalizedSubmittedFiles,
        normalizedFiles,
        passed: verification.passed,
        score: verification.score,
        feedback: verification.feedback,
        aiDiffUsed: data.aiDiffUsed ?? false,
        hintsUsed: data.hintsUsed ?? 0,
        submittedAt: new Date(),
      },
    });

    const totalReps = existingSession.totalReps + 1;
    const bestRep = Math.max(existingSession.bestRep, data.repNumber);

    await prisma.practiceSession.update({
      where: { id: sessionId },
      data: {
        totalReps,
        bestRep,
        currentRep: data.repNumber,
      },
    });

    res.status(201).json(attempt);
  } catch (error) {
    console.error("Error submitting step attempt:", error);
    res.status(500).json({ error: "Failed to submit step attempt" });
  }
};