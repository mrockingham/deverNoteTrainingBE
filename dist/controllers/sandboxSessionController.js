import prisma from "../prisma.js";
import { createSandboxSessionSchema, updateSandboxSessionSchema, } from "../schemas/sandboxSessionSchemas.js";
import { normalizeSandpackFiles } from "../utils/normalizeSandpackFiles.js";
export const createSandboxSession = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const parsed = createSandboxSessionSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "Invalid sandbox session payload",
                details: parsed.error.flatten(),
            });
            return;
        }
        const data = parsed.data;
        const existingLinkedSandbox = data.sourceType === "practice" &&
            data.practiceSessionId &&
            data.lessonStepId
            ? await prisma.sandboxSession.findFirst({
                where: {
                    userId,
                    sourceType: "practice",
                    practiceSessionId: data.practiceSessionId,
                    lessonStepId: data.lessonStepId,
                    status: "active",
                },
                orderBy: {
                    updatedAt: "desc",
                },
            })
            : null;
        if (existingLinkedSandbox) {
            res.status(200).json(existingLinkedSandbox);
            return;
        }
        const sandboxSession = await prisma.sandboxSession.create({
            data: {
                userId,
                title: data.title,
                description: data.description,
                sandpackTemplate: data.sandpackTemplate,
                dependencies: data.dependencies,
                files: normalizeSandpackFiles(data.files),
                sourceType: data.sourceType ?? "manual",
                status: data.status ?? "active",
                lessonPlanId: data.lessonPlanId,
                lessonStepId: data.lessonStepId,
                practiceSessionId: data.practiceSessionId,
            },
        });
        res.status(201).json(sandboxSession);
    }
    catch (error) {
        console.error("Error creating sandbox session:", error);
        res.status(500).json({ error: "Failed to create sandbox session" });
    }
};
export const updateSandboxSession = async (req, res) => {
    try {
        const userId = req.user?.id;
        const sandboxSessionId = typeof req.params.id === "string" ? req.params.id : undefined;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!sandboxSessionId) {
            res.status(400).json({ error: "Sandbox session id is required" });
            return;
        }
        const existingSession = await prisma.sandboxSession.findUnique({
            where: { id: sandboxSessionId },
        });
        if (!existingSession) {
            res.status(404).json({ error: "Sandbox session not found" });
            return;
        }
        if (existingSession.userId !== userId) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        const parsed = updateSandboxSessionSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "Invalid sandbox session update payload",
                details: parsed.error.flatten(),
            });
            return;
        }
        const data = parsed.data;
        const updatedSession = await prisma.sandboxSession.update({
            where: { id: sandboxSessionId },
            data: {
                ...(data.title !== undefined ? { title: data.title } : {}),
                ...(data.description !== undefined
                    ? { description: data.description }
                    : {}),
                ...(data.sandpackTemplate !== undefined
                    ? { sandpackTemplate: data.sandpackTemplate }
                    : {}),
                ...(data.dependencies !== undefined
                    ? {
                        dependencies: data.dependencies,
                    }
                    : {}),
                ...(data.files !== undefined
                    ? { files: normalizeSandpackFiles(data.files) }
                    : {}),
                ...(data.sourceType !== undefined ? { sourceType: data.sourceType } : {}),
                ...(data.status !== undefined ? { status: data.status } : {}),
                ...(data.lessonPlanId !== undefined
                    ? { lessonPlanId: data.lessonPlanId }
                    : {}),
                ...(data.lessonStepId !== undefined
                    ? { lessonStepId: data.lessonStepId }
                    : {}),
                ...(data.practiceSessionId !== undefined
                    ? { practiceSessionId: data.practiceSessionId }
                    : {}),
            },
        });
        res.status(200).json(updatedSession);
    }
    catch (error) {
        console.error("Error updating sandbox session:", error);
        res.status(500).json({ error: "Failed to update sandbox session" });
    }
};
export const getSandboxSessions = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const sessions = await prisma.sandboxSession.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
        });
        res.status(200).json(sessions);
    }
    catch (error) {
        console.error("Error fetching sandbox sessions:", error);
        res.status(500).json({ error: "Failed to fetch sandbox sessions" });
    }
};
export const getSandboxSessionById = async (req, res) => {
    try {
        const userId = req.user?.id;
        const sandboxSessionId = typeof req.params.id === "string" ? req.params.id : undefined;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!sandboxSessionId) {
            res.status(400).json({ error: "Sandbox session id is required" });
            return;
        }
        const session = await prisma.sandboxSession.findUnique({
            where: { id: sandboxSessionId },
        });
        if (!session) {
            res.status(404).json({ error: "Sandbox session not found" });
            return;
        }
        if (session.userId !== userId) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        res.status(200).json(session);
    }
    catch (error) {
        console.error("Error fetching sandbox session:", error);
        res.status(500).json({ error: "Failed to fetch sandbox session" });
    }
};
export const deleteSandboxSession = async (req, res) => {
    try {
        const userId = req.user?.id;
        const sandboxSessionId = typeof req.params.id === "string" ? req.params.id : undefined;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!sandboxSessionId) {
            res.status(400).json({ error: "Sandbox session id is required" });
            return;
        }
        const existingSession = await prisma.sandboxSession.findUnique({
            where: { id: sandboxSessionId },
        });
        if (!existingSession) {
            res.status(404).json({ error: "Sandbox session not found" });
            return;
        }
        if (existingSession.userId !== userId) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        await prisma.sandboxSession.delete({
            where: { id: sandboxSessionId },
        });
        res.status(200).json({
            message: "Sandbox session deleted successfully",
            id: sandboxSessionId,
        });
    }
    catch (error) {
        console.error("Error deleting sandbox session:", error);
        res.status(500).json({ error: "Failed to delete sandbox session" });
    }
};
export const deleteAllSandboxSessions = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const result = await prisma.sandboxSession.deleteMany({
            where: {
                userId,
            },
        });
        res.status(200).json({
            message: "All sandbox sessions deleted successfully",
            deletedCount: result.count,
        });
    }
    catch (error) {
        console.error("Error deleting all sandbox sessions:", error);
        res.status(500).json({ error: "Failed to delete all sandbox sessions" });
    }
};
