import { sandpackFilesSchema } from "../schemas/sandpackSchemas.js";
import type { SandpackFiles } from "../types/sandpack.js";

export const parseSandpackFiles = (input: unknown): SandpackFiles => {
  const parsed = sandpackFilesSchema.parse(input);

  const normalized: SandpackFiles = Object.fromEntries(
    Object.entries(parsed).map(([path, value]) => [
      path,
      typeof value === "string" ? { code: value } : value,
    ])
  );

  return normalized;
};