import type { AiGeneratedLessonDraft } from "../schemas/aiLessonSchemas.js";

const normalizeFileMapKeys = (
  fileMap: Record<string, unknown> | undefined
): Record<string, unknown> | undefined => {
  if (!fileMap || typeof fileMap !== "object" || Array.isArray(fileMap)) {
    return fileMap;
  }

  return Object.fromEntries(
    Object.entries(fileMap).map(([path, value]) => {
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      return [normalizedPath, value];
    })
  );
};

export const normalizeAiLessonDraft = (
  draft: unknown
): unknown => {
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
    lessonSteps: typedDraft.lessonSteps.map((step) => {
      if (!step || typeof step !== "object" || Array.isArray(step)) {
        return step;
      }

      const typedStep = step as Record<string, unknown>;

      return {
        ...typedStep,
        scaffoldFiles: normalizeFileMapKeys(
          typedStep.scaffoldFiles as Record<string, unknown> | undefined
        ),
        starterFiles: normalizeFileMapKeys(
          typedStep.starterFiles as Record<string, unknown> | undefined
        ),
        solutionFiles: normalizeFileMapKeys(
          typedStep.solutionFiles as Record<string, unknown> | undefined
        ),
      };
    }),
  };
};