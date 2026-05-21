import { sandpackFilesSchema } from "../schemas/sandpackSchemas.js";
export const normalizeSandpackFiles = (input) => {
    const parsed = sandpackFilesSchema.parse(input);
    const normalized = Object.fromEntries(Object.entries(parsed).map(([path, value]) => [
        path,
        typeof value === "string" ? { code: value } : value,
    ]));
    return normalized;
};
