import { z } from "zod";
import { sandpackFilesSchema } from "./sandpackSchemas.js";

export const createLessonStepSchema = z.object({
  lessonPlanId: z.string().min(1),
  orderIndex: z.number().int().min(0),
  phaseTitle: z.string().max(120).optional(),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  instructions: z.array(z.string()).min(1),
  hints: z.array(z.string()).optional(),
  scaffoldFiles: sandpackFilesSchema.optional(),
  starterFiles: sandpackFilesSchema.optional(),
  solutionFiles: sandpackFilesSchema,
  verificationRules: z.record(z.string(), z.any()).optional(),
  snippetExports: z.record(z.string(), z.any()).optional(),
});

export const updateLessonStepSchema = z.object({
  orderIndex: z.number().int().min(0).optional(),
  phaseTitle: z.string().max(120).optional(),
  title: z.string().min(1).max(120).optional(),
  description: z.string().min(1).max(2000).optional(),
  instructions: z.array(z.string()).min(1).optional(),
  hints: z.array(z.string()).optional(),
  scaffoldFiles: sandpackFilesSchema.optional(),
  starterFiles: sandpackFilesSchema.optional(),
  solutionFiles: sandpackFilesSchema.optional(),
  verificationRules: z.record(z.string(), z.any()).optional(),
  snippetExports: z.record(z.string(), z.any()).optional(),
});