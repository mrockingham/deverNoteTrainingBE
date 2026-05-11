import { Response } from "express";
import prisma from "../prisma.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import {
  createLessonStepSchema,
  updateLessonStepSchema,
} from "../schemas/lessonStepSchemas.js";
import { normalizeSandpackFiles } from "../utils/normalizeSandpackFiles.js";

export const createLessonStep = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = createLessonStepSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid lesson step payload",
        details: parsed.error.flatten(),
      });
      return;
    }

    const data = parsed.data;

    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: { id: data.lessonPlanId },
    });

    if (!lessonPlan) {
      res.status(404).json({ error: "Lesson plan not found" });
      return;
    }

    if (lessonPlan.creatorId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const lessonStep = await prisma.lessonStep.create({
      data: {
        lessonPlanId: data.lessonPlanId,
        orderIndex: data.orderIndex,
        phaseTitle: data.phaseTitle,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        hints: data.hints,
        scaffoldFiles: data.scaffoldFiles
          ? normalizeSandpackFiles(data.scaffoldFiles)
          : undefined,
        starterFiles: data.starterFiles
          ? normalizeSandpackFiles(data.starterFiles)
          : undefined,
        solutionFiles: normalizeSandpackFiles(data.solutionFiles),
        verificationRules: data.verificationRules,
        snippetExports: data.snippetExports,
      },
    });

    res.status(201).json(lessonStep);
  } catch (error) {
    console.error("Error creating lesson step:", error);
    res.status(500).json({ error: "Failed to create lesson step" });
  }
};

export const updateLessonStep = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const lessonStepId =
      typeof req.params.id === "string" ? req.params.id : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!lessonStepId) {
      res.status(400).json({ error: "Lesson step id is required" });
      return;
    }

    const existingLessonStep = await prisma.lessonStep.findUnique({
      where: { id: lessonStepId },
      include: { lessonPlan: true },
    });

    if (!existingLessonStep) {
      res.status(404).json({ error: "Lesson step not found" });
      return;
    }

    if (existingLessonStep.lessonPlan.creatorId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const parsed = updateLessonStepSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid lesson step update payload",
        details: parsed.error.flatten(),
      });
      return;
    }

    const data = parsed.data;

    const updatedLessonStep = await prisma.lessonStep.update({
      where: { id: lessonStepId },
      data: {
        ...(data.orderIndex !== undefined ? { orderIndex: data.orderIndex } : {}),
        ...(data.phaseTitle !== undefined ? { phaseTitle: data.phaseTitle } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.instructions !== undefined ? { instructions: data.instructions } : {}),
        ...(data.hints !== undefined ? { hints: data.hints } : {}),
        ...(data.scaffoldFiles !== undefined
          ? { scaffoldFiles: normalizeSandpackFiles(data.scaffoldFiles) }
          : {}),
        ...(data.starterFiles !== undefined
          ? { starterFiles: normalizeSandpackFiles(data.starterFiles) }
          : {}),
        ...(data.solutionFiles !== undefined
          ? { solutionFiles: normalizeSandpackFiles(data.solutionFiles) }
          : {}),
        ...(data.verificationRules !== undefined
          ? { verificationRules: data.verificationRules }
          : {}),
        ...(data.snippetExports !== undefined
          ? { snippetExports: data.snippetExports }
          : {}),
      },
    });

    res.status(200).json(updatedLessonStep);
  } catch (error) {
    console.error("Error updating lesson step:", error);
    res.status(500).json({ error: "Failed to update lesson step" });
  }
};

export const getLessonStepsByPlan = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const lessonPlanId =
      typeof req.params.lessonPlanId === "string"
        ? req.params.lessonPlanId
        : undefined;

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
    });

    if (!lessonPlan) {
      res.status(404).json({ error: "Lesson plan not found" });
      return;
    }

    if (lessonPlan.creatorId !== userId && !lessonPlan.isPublic) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const lessonSteps = await prisma.lessonStep.findMany({
      where: { lessonPlanId },
      orderBy: { orderIndex: "asc" },
    });

    res.status(200).json(lessonSteps);
  } catch (error) {
    console.error("Error fetching lesson steps:", error);
    res.status(500).json({ error: "Failed to fetch lesson steps" });
  }
};