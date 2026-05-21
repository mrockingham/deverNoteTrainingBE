import prisma from "../prisma.js";
import { createLessonPlanSchema, updateLessonPlanSchema, } from "../schemas/lessonPlanSchemas.js";
export const createLessonPlan = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error creating lesson plan:", error);
        res.status(500).json({ error: "Failed to create lesson plan" });
    }
};
export const updateLessonPlan = async (req, res) => {
    try {
        const userId = req.user?.id;
        const lessonPlanId = typeof req.params.id === "string" ? req.params.id : undefined;
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
    }
    catch (error) {
        console.error("Error updating lesson plan:", error);
        res.status(500).json({ error: "Failed to update lesson plan" });
    }
};
export const getLessonPlans = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error fetching lesson plans:", error);
        res.status(500).json({ error: "Failed to fetch lesson plans" });
    }
};
export const getLessonPlanById = async (req, res) => {
    try {
        const userId = req.user?.id;
        const lessonPlanId = typeof req.params.id === "string" ? req.params.id : undefined;
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
    }
    catch (error) {
        console.error("Error fetching lesson plan:", error);
        res.status(500).json({ error: "Failed to fetch lesson plan" });
    }
};
