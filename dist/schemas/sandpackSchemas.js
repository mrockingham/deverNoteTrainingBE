import { z } from "zod";
export const sandpackFileSchema = z.object({
    code: z.string(),
    active: z.boolean().optional(),
    hidden: z.boolean().optional(),
    readOnly: z.boolean().optional(),
});
export const sandpackFilesSchema = z.record(z.string().refine((path) => path.startsWith("/"), {
    message: "Sandpack file paths must start with '/'",
}), z.union([z.string(), sandpackFileSchema]));
