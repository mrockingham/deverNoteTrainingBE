import type { AiGeneratedLessonDraft } from "../schemas/aiLessonSchemas.js";

type SandpackFileValue =
  | string
  | {
      code: string;
      active?: boolean;
      hidden?: boolean;
      readOnly?: boolean;
    };

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isValidSandpackFileValue = (
  value: unknown,
): value is SandpackFileValue => {
  if (typeof value === "string") return true;

  if (!isRecord(value)) return false;

  return typeof value.code === "string";
};

const normalizeFilePath = (path: string) => {
  return path.startsWith("/") ? path : `/${path}`;
};

const looksLikeRealFilePath = (path: string) => {
  const normalizedPath = normalizeFilePath(path);

  return /\.(tsx|ts|jsx|js|css|html|json|md|mdx|txt)$/.test(normalizedPath);
};

const normalizeFileMapKeys = (
  fileMap: Record<string, unknown> | undefined,
): Record<string, SandpackFileValue> | undefined => {
  if (!fileMap || typeof fileMap !== "object" || Array.isArray(fileMap)) {
    return undefined;
  }

  const entries = Object.entries(fileMap)
    .map(([path, value]) => {
      const normalizedPath = normalizeFilePath(path);

      return [normalizedPath, value] as const;
    })
    .filter(([path, value]) => {
      return looksLikeRealFilePath(path) && isValidSandpackFileValue(value);
    });

  if (!entries.length) return undefined;

  return Object.fromEntries(entries) as Record<string, SandpackFileValue>;
};

const normalizeArrayField = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeNumberField = (value: unknown, fallback: number): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

export const normalizeAiLessonDraft = (draft: unknown): unknown => {
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
    return draft;
  }

  const typedDraft = draft as {
    lessonPlan?: unknown;
    lessonSteps?: unknown;
  };

  if (!Array.isArray(typedDraft.lessonSteps)) {
    return draft;
  }

  return {
    ...typedDraft,
    lessonSteps: typedDraft.lessonSteps.map((step, index) => {
      if (!step || typeof step !== "object" || Array.isArray(step)) {
        return step;
      }

      const typedStep = step as Record<string, unknown>;

      return {
        ...typedStep,

        orderIndex: normalizeNumberField(typedStep.orderIndex, index),

        instructions: normalizeArrayField(typedStep.instructions),

        hints: normalizeArrayField(typedStep.hints),

        scaffoldFiles: normalizeFileMapKeys(
          typedStep.scaffoldFiles as Record<string, unknown> | undefined,
        ),

        starterFiles: normalizeFileMapKeys(
          typedStep.starterFiles as Record<string, unknown> | undefined,
        ),

        solutionFiles: normalizeFileMapKeys(
          typedStep.solutionFiles as Record<string, unknown> | undefined,
        ),
      };
    }),
  };
};