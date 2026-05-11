import { z } from "zod";

export const dependenciesSchema = z.record(z.string(), z.string());

export const createLessonPlanSchema = z.object({
  title: z.string().min(1).max(120),
  topic: z.string().min(1).max(120),
  level: z.string().min(1).max(50),
  framework: z.string().min(1).max(100),
  focus: z.string().max(250).optional(),
  notes: z.string().max(2000).optional(),
  description: z.string().max(2000).optional(),
  sourcePrompt: z.string().max(10000).optional(),
  aiSummary: z.string().max(5000).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  isPublic: z.boolean().optional(),
  sandpackTemplate: z.string().max(100).optional(),
  dependencies: dependenciesSchema.optional(),
});

export const updateLessonPlanSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  topic: z.string().min(1).max(120).optional(),
  level: z.string().min(1).max(50).optional(),
  framework: z.string().min(1).max(100).optional(),
  focus: z.string().max(250).optional(),
  notes: z.string().max(2000).optional(),
  description: z.string().max(2000).optional(),
  sourcePrompt: z.string().max(10000).optional(),
  aiSummary: z.string().max(5000).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  isPublic: z.boolean().optional(),
  sandpackTemplate: z.string().max(100).optional(),
  dependencies: dependenciesSchema.optional(),
});