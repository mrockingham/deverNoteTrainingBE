import { z } from "zod";
import { sandpackFilesSchema } from "./sandpackSchemas.js";

export const createPracticeSessionSchema = z.object({
  lessonPlanId: z.string().min(1),
});

export const submitStepAttemptSchema = z.object({
  lessonStepId: z.string().min(1),
  repNumber: z.number().int().min(1),
  submittedFiles: sandpackFilesSchema,
  normalizedFiles: sandpackFilesSchema.optional(),
  aiDiffUsed: z.boolean().optional(),
  hintsUsed: z.number().int().min(0).optional(),
});

export const updatePracticeSessionSchema = z.object({
  currentStep: z.number().int().min(0).optional(),
  currentRep: z.number().int().min(1).optional(),
  bestRep: z.number().int().min(0).optional(),
  totalReps: z.number().int().min(0).optional(),
  status: z.enum(["active", "paused", "completed", "abandoned"]).optional(),
  completedAt: z.string().datetime().optional(),
});