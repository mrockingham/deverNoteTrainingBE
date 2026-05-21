import { z } from "zod";
import { sandpackFilesSchema } from "./sandpackSchemas.js";
export const createProjectSchema = z.object({
    title: z.string().min(1, "Title is required").max(120),
    description: z.string().max(1000).optional(),
    files: sandpackFilesSchema,
    tags: z.array(z.string()).default([]),
    isPublic: z.boolean().optional(),
});
export const updateProjectSchema = z.object({
    title: z.string().min(1).max(120).optional(),
    description: z.string().max(1000).optional(),
    files: sandpackFilesSchema.optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
});
