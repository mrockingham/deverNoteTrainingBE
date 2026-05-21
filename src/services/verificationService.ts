type SandpackFileMap = Record<string, string>;

type VerificationTextRule =
  | string
  | {
      file?: string;
      text: string;
    };

export interface VerificationRules {
  mustContain?: VerificationTextRule[];
  mustNotContain?: VerificationTextRule[];
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

const normalizeVerificationTextRules = (
  value: unknown,
): VerificationTextRule[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is VerificationTextRule => {
    if (typeof item === "string") return true;

    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return false;
    }

    const raw = item as Record<string, unknown>;

    return (
      typeof raw.text === "string" &&
      (raw.file === undefined || typeof raw.file === "string")
    );
  });
};

const extractVerificationRules = (input: unknown): VerificationRules => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const raw = input as Record<string, unknown>;

  return {
    mustContain: normalizeVerificationTextRules(raw.mustContain),
    mustNotContain: normalizeVerificationTextRules(raw.mustNotContain),
    requiredFiles: normalizeStringArray(raw.requiredFiles),
  };
};

const getFileCode = (
  files: SandpackFileMap,
  path: string,
): string | undefined => {
  return files[path] ?? files[path.startsWith("/") ? path : `/${path}`];
};

const getAllCode = (files: SandpackFileMap): string => {
  return Object.values(files).join("\n");
};

export const verifySubmission = (
  submittedFiles: SandpackFileMap,
  verificationRules: unknown,
): VerificationResult => {
  const rules = extractVerificationRules(verificationRules);

  const missing: string[] = [];
  const forbidden: string[] = [];
  const missingFiles: string[] = [];

  const requiredFiles = rules.requiredFiles ?? [];
  const mustContain = rules.mustContain ?? [];
  const mustNotContain = rules.mustNotContain ?? [];

  for (const filePath of requiredFiles) {
    const fileCode = getFileCode(submittedFiles, filePath);

    if (fileCode === undefined) {
      missingFiles.push(filePath);
    }
  }

  for (const rule of mustContain) {
    if (typeof rule === "string") {
      const allCode = getAllCode(submittedFiles);

      if (!allCode.includes(rule)) {
        missing.push(rule);
      }

      continue;
    }

    const filePath = rule.file;
    const text = rule.text;

    if (filePath) {
      const fileCode = getFileCode(submittedFiles, filePath);

      if (fileCode === undefined) {
        missingFiles.push(filePath);
        continue;
      }

      if (!fileCode.includes(text)) {
        missing.push(`${filePath}: ${text}`);
      }

      continue;
    }

    const allCode = getAllCode(submittedFiles);

    if (!allCode.includes(text)) {
      missing.push(text);
    }
  }

  for (const rule of mustNotContain) {
    if (typeof rule === "string") {
      const allCode = getAllCode(submittedFiles);

      if (allCode.includes(rule)) {
        forbidden.push(rule);
      }

      continue;
    }

    const filePath = rule.file;
    const text = rule.text;

    if (filePath) {
      const fileCode = getFileCode(submittedFiles, filePath);

      if (fileCode && fileCode.includes(text)) {
        forbidden.push(`${filePath}: ${text}`);
      }

      continue;
    }

    const allCode = getAllCode(submittedFiles);

    if (allCode.includes(text)) {
      forbidden.push(text);
    }
  }

  const passed =
    missing.length === 0 &&
    forbidden.length === 0 &&
    missingFiles.length === 0;

  const totalChecks =
    requiredFiles.length + mustContain.length + mustNotContain.length;

  const failedChecks = missing.length + forbidden.length + missingFiles.length;

  const score =
    totalChecks === 0
      ? 100
      : Math.max(
          0,
          Math.round(((totalChecks - failedChecks) / totalChecks) * 100),
        );

  return {
    passed,
    score,
    feedback: {
      missing,
      forbidden,
      missingFiles,
      summary: passed
        ? "Submission passed verification."
        : [
            missing.length > 0
              ? `Missing required content: ${missing.join(", ")}`
              : "",
            missingFiles.length > 0
              ? `Missing required files: ${missingFiles.join(", ")}`
              : "",
            forbidden.length > 0
              ? `Forbidden content found: ${forbidden.join(", ")}`
              : "",
          ]
            .filter(Boolean)
            .join(" "),
    },
  };
};