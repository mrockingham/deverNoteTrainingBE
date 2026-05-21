const isRecord = (value) => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};
const isValidSandpackFileValue = (value) => {
    if (typeof value === "string")
        return true;
    if (!isRecord(value))
        return false;
    return typeof value.code === "string";
};
const normalizeFilePath = (path) => {
    return path.startsWith("/") ? path : `/${path}`;
};
const looksLikeRealFilePath = (path) => {
    const normalizedPath = normalizeFilePath(path);
    return /\.(tsx|ts|jsx|js|css|html|json|md|mdx|txt)$/.test(normalizedPath);
};
const normalizeFileMapKeys = (fileMap) => {
    if (!fileMap || typeof fileMap !== "object" || Array.isArray(fileMap)) {
        return undefined;
    }
    const entries = Object.entries(fileMap)
        .map(([path, value]) => {
        const normalizedPath = normalizeFilePath(path);
        return [normalizedPath, value];
    })
        .filter(([path, value]) => {
        return looksLikeRealFilePath(path) && isValidSandpackFileValue(value);
    });
    if (!entries.length)
        return undefined;
    return Object.fromEntries(entries);
};
const normalizeArrayField = (value) => {
    if (!Array.isArray(value))
        return [];
    return value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
};
const normalizeNumberField = (value, fallback) => {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};
export const normalizeAiLessonDraft = (draft) => {
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
        return draft;
    }
    const typedDraft = draft;
    if (!Array.isArray(typedDraft.lessonSteps)) {
        return draft;
    }
    return {
        ...typedDraft,
        lessonSteps: typedDraft.lessonSteps.map((step, index) => {
            if (!step || typeof step !== "object" || Array.isArray(step)) {
                return step;
            }
            const typedStep = step;
            return {
                ...typedStep,
                orderIndex: normalizeNumberField(typedStep.orderIndex, index),
                instructions: normalizeArrayField(typedStep.instructions),
                hints: normalizeArrayField(typedStep.hints),
                scaffoldFiles: normalizeFileMapKeys(typedStep.scaffoldFiles),
                starterFiles: normalizeFileMapKeys(typedStep.starterFiles),
                solutionFiles: normalizeFileMapKeys(typedStep.solutionFiles),
            };
        }),
    };
};
