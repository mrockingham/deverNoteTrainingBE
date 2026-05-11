import type { SandpackFiles } from "../types/sandpack.js";

export interface VerificationRules {
  mustContain?: string[];
  mustNotContain?: string[];
  requiredFiles?: string[];
}

export interface VerificationResult {
  passed: boolean;
  score: number;
  feedback: {
    summary: string;
    missing: string[];
    forbidden: string[];
    missingFiles: string[];
  };
}

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
};

const extractVerificationRules = (input: unknown): VerificationRules => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const raw = input as Record<string, unknown>;

  return {
    mustContain: normalizeStringArray(raw.mustContain),
    mustNotContain: normalizeStringArray(raw.mustNotContain),
    requiredFiles: normalizeStringArray(raw.requiredFiles),
  };
};

const combineAllCode = (files: SandpackFiles): string => {
  return Object.values(files)
    .map((file) => file.code)
    .join("\n");
};

export const verifySubmission = (
  submittedFiles: SandpackFiles,
  rawRules: unknown
): VerificationResult => {
  const rules = extractVerificationRules(rawRules);
  const combinedCode = combineAllCode(submittedFiles);
  const submittedPaths = Object.keys(submittedFiles);

  const missing = (rules.mustContain ?? []).filter(
    (token) => !combinedCode.includes(token)
  );

  const forbidden = (rules.mustNotContain ?? []).filter((token) =>
    combinedCode.includes(token)
  );

  const missingFiles = (rules.requiredFiles ?? []).filter(
    (path) => !submittedPaths.includes(path)
  );

  const totalChecks =
    (rules.mustContain?.length ?? 0) +
    (rules.mustNotContain?.length ?? 0) +
    (rules.requiredFiles?.length ?? 0);

  const failedChecks = missing.length + forbidden.length + missingFiles.length;

  const passed = failedChecks === 0;

  const score =
    totalChecks === 0
      ? 100
      : Math.max(0, Math.round(((totalChecks - failedChecks) / totalChecks) * 100));

  let summary = "Submission passed verification.";

  if (!passed) {
    const parts: string[] = [];

    if (missing.length > 0) {
      parts.push(`Missing required content: ${missing.join(", ")}`);
    }

    if (forbidden.length > 0) {
      parts.push(`Contains forbidden content: ${forbidden.join(", ")}`);
    }

    if (missingFiles.length > 0) {
      parts.push(`Missing required files: ${missingFiles.join(", ")}`);
    }

    summary = parts.join(" | ");
  }

  return {
    passed,
    score,
    feedback: {
      summary,
      missing,
      forbidden,
      missingFiles,
    },
  };
};