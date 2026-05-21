import { sandpackFilesSchema } from "../schemas/sandpackSchemas.js";

export type ParsedSandpackFiles = Record<string, string>;

export const parseSandpackFiles = (input: unknown): ParsedSandpackFiles => {
  const parsed = sandpackFilesSchema.parse(input);

  return Object.fromEntries(
    Object.entries(parsed).map(([path, value]) => {
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;

      return [
        normalizedPath,
        typeof value === "string" ? value : value.code ?? "",
      ];
    }),
  );
};