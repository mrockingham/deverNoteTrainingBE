import { Prisma } from "@prisma/client";
import { sandpackFilesSchema } from "../schemas/sandpackSchemas.js";
import type { SandpackFiles } from "../types/sandpack.js";

export const normalizeSandpackFiles = (
  input: unknown
): Prisma.InputJsonValue => {
  const parsed = sandpackFilesSchema.parse(input);

  const normalized: SandpackFiles = Object.fromEntries(
    Object.entries(parsed).map(([path, value]) => [
      path,
      typeof value === "string" ? { code: value } : value,
    ])
  );

  return normalized as unknown as Prisma.InputJsonValue;
};