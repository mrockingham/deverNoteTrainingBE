import { z } from "zod";
import { sandpackFilesSchema } from "./sandpackSchemas.js";
export const dependencyMapSchema = z.record(z.string(), z.string());
export const aiSourceSnippetSchema = z.object({
    files: sandpackFilesSchema.optional(),
    javascript: z.string().optional(),
    css: z.string().optional(),
    html: z.string().optional(),
    note: z.string().optional(),
});
export const generateAiLessonRequestSchema = z.object({
    title: z.string().max(120).optional(),
    topic: z.string().min(1).max(160),
    level: z.string().min(1).max(60),
    framework: z.string().min(1).max(100),
    focus: z.string().max(250).optional(),
    notes: z.string().max(4000).optional(),
    description: z.string().max(4000).optional(),
    sandpackTemplate: z.string().max(100).optional(),
    dependencies: dependencyMapSchema.optional(),
    sourceSnippet: aiSourceSnippetSchema.optional(),
});
export const aiGeneratedLessonStepSchema = z.object({
    orderIndex: z.number().int().min(0),
    phaseTitle: z.string().max(120).optional(),
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(2000),
    instructions: z.array(z.string()).min(1),
    hints: z.array(z.string()).optional(),
    scaffoldFiles: sandpackFilesSchema.optional(),
    starterFiles: sandpackFilesSchema.optional(),
    solutionFiles: sandpackFilesSchema,
    verificationRules: z.record(z.string(), z.unknown()).optional(),
    snippetExports: z.record(z.string(), z.unknown()).optional(),
});
export const aiGeneratedLessonPlanSchema = z.object({
    title: z.string().min(1).max(120),
    topic: z.string().min(1).max(160),
    level: z.string().min(1).max(60),
    framework: z.string().min(1).max(100),
    focus: z.string().max(250).optional(),
    notes: z.string().max(4000).optional(),
    description: z.string().max(4000).optional(),
    aiSummary: z.string().max(6000).optional(),
    sandpackTemplate: z.string().max(100).optional(),
    dependencies: dependencyMapSchema.optional(),
});
export const aiGeneratedLessonDraftSchema = z.object({
    lessonPlan: aiGeneratedLessonPlanSchema,
    lessonSteps: z.array(aiGeneratedLessonStepSchema).min(1),
});
