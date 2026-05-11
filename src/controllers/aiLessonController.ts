import { Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../prisma.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import {
  generateAiLessonRequestSchema,
} from "../schemas/aiLessonSchemas.js";
import { generateAiLessonDraft } from "../services/aiLessonService.js";
import { normalizeSandpackFiles } from "../utils/normalizeSandpackFiles.js";
import {
  ensureSufficientAiCredits,
  consumeAiCredits,
} from "../services/aiUsageService.js";

export const generateAiLesson = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await ensureSufficientAiCredits(userId, "generate");

    const parsed = generateAiLessonRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid AI lesson request payload",
        details: parsed.error.flatten(),
      });
      return;
    }

    const draft = await generateAiLessonDraft(parsed.data);
    const aiCreditsRemaining = await consumeAiCredits(userId, "generate");

    res.status(200).json({
      ...draft,
      aiCreditsRemaining,
    });
  } catch (error) {
    console.error("Error generating AI lesson draft:", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate AI lesson draft",
    });
  }
};

export const generateAndSaveAiLesson = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    await ensureSufficientAiCredits(userId, "generateAndSave");

    const parsed = generateAiLessonRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid AI lesson request payload",
        details: parsed.error.flatten(),
      });
      return;
    }

    const draft = await generateAiLessonDraft(parsed.data);
    const aiCreditsRemaining = await consumeAiCredits(userId, "generateAndSave");

    const lessonPlan = await prisma.lessonPlan.create({
      data: {
        creatorId: userId,
        title: draft.lessonPlan.title,
        topic: draft.lessonPlan.topic,
        level: draft.lessonPlan.level,
        framework: draft.lessonPlan.framework,
        focus: draft.lessonPlan.focus,
        notes: draft.lessonPlan.notes,
        description: draft.lessonPlan.description,
        aiSummary: draft.lessonPlan.aiSummary,
        status: "draft",
        isPublic: false,
        sandpackTemplate: draft.lessonPlan.sandpackTemplate,
        dependencies:
          draft.lessonPlan.dependencies as Prisma.InputJsonValue | undefined,
      },
    });

    const savedSteps = [];

    for (const step of draft.lessonSteps) {
      const savedStep = await prisma.lessonStep.create({
        data: {
          lessonPlanId: lessonPlan.id,
          orderIndex: step.orderIndex,
          phaseTitle: step.phaseTitle,
          title: step.title,
          description: step.description,
          instructions: step.instructions as Prisma.InputJsonValue,
          hints: step.hints as Prisma.InputJsonValue | undefined,
          scaffoldFiles: step.scaffoldFiles
            ? normalizeSandpackFiles(step.scaffoldFiles)
            : undefined,
          starterFiles: step.starterFiles
            ? normalizeSandpackFiles(step.starterFiles)
            : undefined,
          solutionFiles: normalizeSandpackFiles(step.solutionFiles),
          verificationRules: step.verificationRules as
            | Prisma.InputJsonValue
            | undefined,
          snippetExports: step.snippetExports as
            | Prisma.InputJsonValue
            | undefined,
        },
      });

      savedSteps.push(savedStep);
    }

  res.status(201).json({
  lessonPlan,
  lessonSteps: savedSteps,
  aiCreditsRemaining,
});
  } catch (error) {
    console.error("Error generating and saving AI lesson:", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate and save AI lesson",
    });
  }
};