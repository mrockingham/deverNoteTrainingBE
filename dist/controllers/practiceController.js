import prisma from "../prisma.js";
import { createPracticeSessionSchema, submitStepAttemptSchema, updatePracticeSessionSchema, } from "../schemas/practiceSchemas.js";
import { normalizeSandpackFiles } from "../utils/normalizeSandpackFiles.js";
import { parseSandpackFiles } from "../utils/parseSandpackFiles.js";
import { verifySubmission } from "../services/verificationService.js";
export const createPracticeSession = async (req, res) => {
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
        const { lessonPlanId, startNew } = parsed.data;
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
        if (!startNew) {
            const existingActiveSession = await prisma.practiceSession.findFirst({
                where: {
                    userId,
                    lessonPlanId,
                    status: "active",
                },
                orderBy: {
                    updatedAt: "desc",
                },
            });
            if (existingActiveSession) {
                res.status(200).json(existingActiveSession);
                return;
            }
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
    }
    catch (error) {
        console.error("Error creating practice session:", error);
        res.status(500).json({ error: "Failed to create practice session" });
    }
};
export const getPracticeSessions = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const lessonPlanId = typeof req.query.lessonPlanId === "string"
            ? req.query.lessonPlanId
            : undefined;
        const status = typeof req.query.status === "string" ? req.query.status : undefined;
        const sessions = await prisma.practiceSession.findMany({
            where: {
                userId,
                ...(lessonPlanId ? { lessonPlanId } : {}),
                ...(status ? { status } : {}),
            },
            orderBy: {
                updatedAt: "desc",
            },
            select: {
                id: true,
                userId: true,
                lessonPlanId: true,
                currentStep: true,
                currentRep: true,
                bestRep: true,
                totalReps: true,
                status: true,
                startedAt: true,
                updatedAt: true,
                completedAt: true,
                lessonPlan: {
                    select: {
                        id: true,
                        title: true,
                        topic: true,
                        level: true,
                        framework: true,
                        focus: true,
                        description: true,
                        status: true,
                        isPublic: true,
                        sandpackTemplate: true,
                        _count: {
                            select: {
                                steps: true,
                            },
                        },
                    },
                },
                attempts: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    select: {
                        id: true,
                        lessonStepId: true,
                        repNumber: true,
                        passed: true,
                        score: true,
                        createdAt: true,
                        submittedAt: true,
                    },
                },
            },
        });
        res.status(200).json(sessions);
    }
    catch (error) {
        console.error("Error fetching practice sessions:", error);
        res.status(500).json({ error: "Failed to fetch practice sessions" });
    }
};
export const getPracticeSessionById = async (req, res) => {
    try {
        const userId = req.user?.id;
        const sessionId = typeof req.params.id === "string" ? req.params.id : undefined;
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
    }
    catch (error) {
        console.error("Error fetching practice session:", error);
        res.status(500).json({ error: "Failed to fetch practice session" });
    }
};
export const updatePracticeSession = async (req, res) => {
    try {
        const userId = req.user?.id;
        const sessionId = typeof req.params.id === "string" ? req.params.id : undefined;
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
    }
    catch (error) {
        console.error("Error updating practice session:", error);
        res.status(500).json({ error: "Failed to update practice session" });
    }
};
export const submitStepAttempt = async (req, res) => {
    try {
        const userId = req.user?.id;
        const sessionId = typeof req.params.id === "string" ? req.params.id : undefined;
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
        const verification = verifySubmission(parsedSubmittedFiles, lessonStep.verificationRules);
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
        const lessonSteps = await prisma.lessonStep.findMany({
            where: {
                lessonPlanId: existingSession.lessonPlanId,
            },
            orderBy: {
                orderIndex: "asc",
            },
        });
        const submittedStepIndex = lessonSteps.findIndex((step) => step.id === data.lessonStepId);
        if (submittedStepIndex === -1) {
            res.status(400).json({
                error: "Lesson step does not belong to this practice session lesson plan",
            });
            return;
        }
        const isLastStep = submittedStepIndex >= lessonSteps.length - 1;
        // const nextCurrentStep =
        //   verification.passed && !isLastStep
        //     ? submittedStepIndex + 1
        //     : existingSession.currentStep;
        // const shouldCompleteSession = verification.passed && isLastStep;
        // await prisma.practiceSession.update({
        //   where: { id: sessionId },
        //   data: {
        //     totalReps,
        //     bestRep,
        //     // If they passed, reset reps for the next step.
        //     // If they failed, move to next rep attempt.
        //     currentRep: verification.passed ? 1 : data.repNumber + 1,
        //     currentStep: nextCurrentStep,
        //     ...(shouldCompleteSession
        //       ? {
        //           status: "completed",
        //           completedAt: new Date(),
        //         }
        //       : {}),
        //   },
        // });
        const updatedSession = await prisma.practiceSession.update({
            where: { id: sessionId },
            data: {
                totalReps,
                bestRep,
                // Failed attempts move to next rep.
                // Passed attempts stay here until user clicks Next Step.
                currentRep: verification.passed
                    ? data.repNumber
                    : data.repNumber + 1,
            },
        });
        res.status(201).json({
            attempt,
            session: updatedSession,
            nextStepIndex: verification.passed && !isLastStep
                ? submittedStepIndex + 1
                : null,
            isLastStep,
        });
    }
    catch (error) {
        console.error("Error submitting step attempt:", error);
        res.status(500).json({ error: "Failed to submit step attempt" });
    }
};
export const resetLessonPractice = async (req, res) => {
    try {
        const userId = req.user?.id;
        const lessonPlanId = typeof req.params.lessonPlanId === "string"
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
        const practiceSessions = await prisma.practiceSession.findMany({
            where: {
                userId,
                lessonPlanId,
            },
            select: {
                id: true,
            },
        });
        const practiceSessionIds = practiceSessions.map((session) => session.id);
        if (practiceSessionIds.length === 0) {
            res.status(200).json({
                message: "No practice progress found for this lesson.",
                deletedPracticeSessions: 0,
                deletedAttempts: 0,
                deletedSandboxSessions: 0,
            });
            return;
        }
        const result = await prisma.$transaction(async (tx) => {
            const deletedSandboxSessions = await tx.sandboxSession.deleteMany({
                where: {
                    userId,
                    lessonPlanId,
                    practiceSessionId: {
                        in: practiceSessionIds,
                    },
                },
            });
            const deletedAttempts = await tx.stepAttempt.deleteMany({
                where: {
                    userId,
                    practiceSessionId: {
                        in: practiceSessionIds,
                    },
                },
            });
            const deletedPracticeSessions = await tx.practiceSession.deleteMany({
                where: {
                    userId,
                    lessonPlanId,
                    id: {
                        in: practiceSessionIds,
                    },
                },
            });
            return {
                deletedSandboxSessions: deletedSandboxSessions.count,
                deletedAttempts: deletedAttempts.count,
                deletedPracticeSessions: deletedPracticeSessions.count,
            };
        });
        res.status(200).json({
            message: "Lesson practice progress reset successfully.",
            ...result,
        });
    }
    catch (error) {
        console.error("Error resetting lesson practice:", error);
        res.status(500).json({ error: "Failed to reset lesson practice" });
    }
};
