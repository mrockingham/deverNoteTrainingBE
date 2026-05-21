import { z } from "zod";
import { sandpackFilesSchema } from "./sandpackSchemas.js";
export const dependencyMapSchema = z.record(z.string(), z.string());
export const createSandboxSessionSchema = z.object({
    title: z.string().max(120).optional(),
    description: z.string().max(2000).optional(),
    sandpackTemplate: z.string().max(100).optional(),
    dependencies: dependencyMapSchema.optional(),
    files: sandpackFilesSchema,
    sourceType: z.enum(["manual", "lesson", "practice"]).optional(),
    status: z.enum(["active", "archived", "completed"]).optional(),
    lessonPlanId: z.string().optional(),
    lessonStepId: z.string().optional(),
    practiceSessionId: z.string().optional(),
});
export const updateSandboxSessionSchema = z.object({
    title: z.string().max(120).optional(),
    description: z.string().max(2000).optional(),
    sandpackTemplate: z.string().max(100).optional(),
    dependencies: dependencyMapSchema.optional(),
    files: sandpackFilesSchema.optional(),
    sourceType: z.enum(["manual", "lesson", "practice"]).optional(),
    status: z.enum(["active", "archived", "completed"]).optional(),
    lessonPlanId: z.string().optional(),
    lessonStepId: z.string().optional(),
    practiceSessionId: z.string().optional(),
});
