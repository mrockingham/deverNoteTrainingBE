const normalizeStringArray = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((item) => typeof item === "string");
};
const normalizeVerificationTextRules = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((item) => {
        if (typeof item === "string")
            return true;
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            return false;
        }
        const raw = item;
        return (typeof raw.text === "string" &&
            (raw.file === undefined || typeof raw.file === "string"));
    });
};
const extractVerificationRules = (input) => {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        return {};
    }
    const raw = input;
    return {
        mustContain: normalizeVerificationTextRules(raw.mustContain),
        mustNotContain: normalizeVerificationTextRules(raw.mustNotContain),
        requiredFiles: normalizeStringArray(raw.requiredFiles),
    };
};
const getFileCode = (files, path) => {
    return files[path] ?? files[path.startsWith("/") ? path : `/${path}`];
};
const getAllCode = (files) => {
    return Object.values(files).join("\n");
};
export const verifySubmission = (submittedFiles, verificationRules) => {
    const rules = extractVerificationRules(verificationRules);
    const missing = [];
    const forbidden = [];
    const missingFiles = [];
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
    const passed = missing.length === 0 &&
        forbidden.length === 0 &&
        missingFiles.length === 0;
    const totalChecks = requiredFiles.length + mustContain.length + mustNotContain.length;
    const failedChecks = missing.length + forbidden.length + missingFiles.length;
    const score = totalChecks === 0
        ? 100
        : Math.max(0, Math.round(((totalChecks - failedChecks) / totalChecks) * 100));
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
