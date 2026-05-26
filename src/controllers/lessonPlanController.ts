import { Response } from "express";
import prisma from "../prisma.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import {
  createLessonPlanSchema,
  updateLessonPlanSchema,
} from "../schemas/lessonPlanSchemas.js";

export const createLessonPlan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = createLessonPlanSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid lesson plan payload",
        details: parsed.error.flatten(),
      });
      return;
    }

    const data = parsed.data;

    const lessonPlan = await prisma.lessonPlan.create({
      data: {
        creatorId: userId,
        title: data.title,
        topic: data.topic,
        level: data.level,
        framework: data.framework,
        focus: data.focus,
        notes: data.notes,
        description: data.description,
        sourcePrompt: data.sourcePrompt,
        aiSummary: data.aiSummary,
        status: data.status ?? "draft",
        isPublic: data.isPublic ?? false,
        sandpackTemplate: data.sandpackTemplate,
        dependencies: data.dependencies,
      },
    });

    res.status(201).json(lessonPlan);
  } catch (error) {
    console.error("Error creating lesson plan:", error);
    res.status(500).json({ error: "Failed to create lesson plan" });
  }
};

export const updateLessonPlan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const lessonPlanId =
      typeof req.params.id === "string" ? req.params.id : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!lessonPlanId) {
      res.status(400).json({ error: "Lesson plan id is required" });
      return;
    }

    const existingLessonPlan = await prisma.lessonPlan.findUnique({
      where: { id: lessonPlanId },
    });

    if (!existingLessonPlan) {
      res.status(404).json({ error: "Lesson plan not found" });
      return;
    }

    if (existingLessonPlan.creatorId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const parsed = updateLessonPlanSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid lesson plan update payload",
        details: parsed.error.flatten(),
      });
      return;
    }

    const data = parsed.data;

    const updatedLessonPlan = await prisma.lessonPlan.update({
      where: { id: lessonPlanId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.topic !== undefined ? { topic: data.topic } : {}),
        ...(data.level !== undefined ? { level: data.level } : {}),
        ...(data.framework !== undefined ? { framework: data.framework } : {}),
        ...(data.focus !== undefined ? { focus: data.focus } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.sourcePrompt !== undefined ? { sourcePrompt: data.sourcePrompt } : {}),
        ...(data.aiSummary !== undefined ? { aiSummary: data.aiSummary } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.isPublic !== undefined ? { isPublic: data.isPublic } : {}),
        ...(data.sandpackTemplate !== undefined
          ? { sandpackTemplate: data.sandpackTemplate }
          : {}),
        ...(data.dependencies !== undefined
          ? { dependencies: data.dependencies }
          : {}),
      },
    });

    res.status(200).json(updatedLessonPlan);
  } catch (error) {
    console.error("Error updating lesson plan:", error);
    res.status(500).json({ error: "Failed to update lesson plan" });
  }
};

export const getLessonPlans = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const lessonPlans = await prisma.lessonPlan.findMany({
      where: { creatorId: userId },
      orderBy: { updatedAt: "desc" },
    });

    res.status(200).json(lessonPlans);
  } catch (error) {
    console.error("Error fetching lesson plans:", error);
    res.status(500).json({ error: "Failed to fetch lesson plans" });
  }
};

export const getLessonPlanById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const lessonPlanId =
      typeof req.params.id === "string" ? req.params.id : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!lessonPlanId) {
      res.status(400).json({ error: "Lesson plan id is required" });
      return;
    }

    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: { id: lessonPlanId },
      include: {
        steps: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!lessonPlan) {
      res.status(404).json({ error: "Lesson plan not found" });
      return;
    }

    if (lessonPlan.creatorId !== userId && !lessonPlan.isPublic) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.status(200).json(lessonPlan);
  } catch (error) {
    console.error("Error fetching lesson plan:", error);
    res.status(500).json({ error: "Failed to fetch lesson plan" });
  }
};


export const getLessonLibrary = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const lessonPlans = await prisma.lessonPlan.findMany({
      where: { creatorId: userId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            steps: true,
          },
        },
        steps: {
          orderBy: {
            orderIndex: "asc",
          },
          select: {
            id: true,
            orderIndex: true,
            phaseTitle: true,
            title: true,
          },
        },
      },
    });

    const lessonPlanIds = lessonPlans.map((lesson) => lesson.id);

    if (lessonPlanIds.length === 0) {
      res.status(200).json({
        summary: {
          savedCount: 0,
          completedCount: 0,
          totalReps: 0,
        },
        lessonPlans: [],
      });
      return;
    }

    const sessions = await prisma.practiceSession.findMany({
      where: {
        userId,
        lessonPlanId: {
          in: lessonPlanIds,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        attempts: {
          select: {
            id: true,
            lessonStepId: true,
            passed: true,
            score: true,
            createdAt: true,
            submittedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    const latestSessionByLessonPlanId = new Map<
      string,
      (typeof sessions)[number]
    >();

    for (const session of sessions) {
      if (!latestSessionByLessonPlanId.has(session.lessonPlanId)) {
        latestSessionByLessonPlanId.set(session.lessonPlanId, session);
      }
    }

    const completedLessonPlanIds = new Set(
      sessions
        .filter((session) => session.status === "completed")
        .map((session) => session.lessonPlanId),
    );

    const totalReps = sessions.reduce((sum, session) => {
      return sum + session.totalReps;
    }, 0);

    const lessonPlansWithProgress = lessonPlans.map((lesson) => {
      const latestSession = latestSessionByLessonPlanId.get(lesson.id);

      const passedStepIds = new Set(
        latestSession?.attempts
          .filter((attempt) => attempt.passed)
          .map((attempt) => attempt.lessonStepId) ?? [],
      );

      const currentStepIndex = latestSession?.currentStep ?? null;

      const currentStep =
        currentStepIndex !== null
          ? lesson.steps.find((step) => step.orderIndex === currentStepIndex) ??
            lesson.steps[currentStepIndex] ??
            null
          : null;

      const latestAttempt = latestSession?.attempts?.[0] ?? null;

      return {
        ...lesson,

        progress: {
          stepCount: lesson._count.steps,
          passedStepCount: passedStepIds.size,
          hasSession: Boolean(latestSession),
          isCompleted: latestSession?.status === "completed",

          currentStepIndex,
          currentStepTitle: currentStep?.title ?? null,
          currentPhaseTitle: currentStep?.phaseTitle ?? null,

          lastPracticedAt: latestSession?.updatedAt ?? null,
          lastAttemptAt: latestAttempt?.submittedAt ?? latestAttempt?.createdAt ?? null,

          latestSession: latestSession
            ? {
                id: latestSession.id,
                status: latestSession.status,
                currentStep: latestSession.currentStep,
                currentRep: latestSession.currentRep,
                bestRep: latestSession.bestRep,
                totalReps: latestSession.totalReps,
                startedAt: latestSession.startedAt,
                updatedAt: latestSession.updatedAt,
                completedAt: latestSession.completedAt,
              }
            : null,
        },
      };
    });

    res.status(200).json({
      summary: {
        savedCount: lessonPlans.length,
        completedCount: completedLessonPlanIds.size,
        totalReps,
      },
      lessonPlans: lessonPlansWithProgress,
    });
  } catch (error) {
    console.error("Error fetching lesson library:", error);
    res.status(500).json({ error: "Failed to fetch lesson library" });
  }
};