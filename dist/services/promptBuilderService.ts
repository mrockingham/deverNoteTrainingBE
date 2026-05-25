type DependencyMap = Record<string, string>;

type BuildAiLessonPromptInput = {
  title?: string | null;
  topic: string;
  level: string;
  framework: string;
  focus?: string | null;
  notes?: string | null;
  description?: string | null;
  sandpackTemplate?: string | null;
  dependencies?: DependencyMap | null;
  sourceSnippet?: unknown;
};

const stringifyMaybe = (value: unknown): string => {
  if (value === undefined || value === null) {
    return "";
  }

  try {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const inferDependenciesFromSnippet = (
  snippet: unknown,
): DependencyMap => {
  const text =
    typeof snippet === "string"
      ? snippet
      : snippet
        ? JSON.stringify(snippet)
        : "";

  if (!text.trim()) return {};

  const dependencies: DependencyMap = {};

  const importRegex =
    /import\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;

  const requireRegex = /require\(["']([^"']+)["']\)/g;

  const packageNames = new Set<string>();

  const ignoredPackages = new Set([
    "react",
    "react-dom",
    "react/jsx-runtime",
    "react-dom/client",
  ]);

  const collectPackageName = (importPath: string) => {
    if (!importPath) return;

    if (
      importPath.startsWith(".") ||
      importPath.startsWith("/") ||
      importPath.startsWith("@/")
    ) {
      return;
    }

    if (ignoredPackages.has(importPath)) return;

    const parts = importPath.split("/");

    const packageName = importPath.startsWith("@")
      ? `${parts[0]}/${parts[1]}`
      : parts[0];

    if (packageName) {
      packageNames.add(packageName);
    }
  };

  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(text)) !== null) {
    collectPackageName(match[1]);
  }

  while ((match = requireRegex.exec(text)) !== null) {
    collectPackageName(match[1]);
  }

  packageNames.forEach((packageName) => {
    dependencies[packageName] = "latest";
  });

  return dependencies;
};

export const inferDependenciesFromText = (input: {
  topic?: string | null;
  framework?: string | null;
  focus?: string | null;
  notes?: string | null;
  description?: string | null;
}): DependencyMap => {
  const text = [
    input.topic,
    input.framework,
    input.focus,
    input.notes,
    input.description,
  ]
    .filter((item): item is string => Boolean(item))
    .join(" ")
    .toLowerCase();

  const dependencies: DependencyMap = {};

  const dependencyKeywords: Array<{
    keywords: string[];
    packageName: string;
  }> = [
    {
      keywords: ["framer motion", "framer-motion", "motion/react"],
      packageName: "framer-motion",
    },
    {
      keywords: ["chakra", "chakra ui", "@chakra-ui/react"],
      packageName: "@chakra-ui/react",
    },
    {
      keywords: ["mui", "material ui", "@mui/material"],
      packageName: "@mui/material",
    },
    {
      keywords: ["emotion", "@emotion/react"],
      packageName: "@emotion/react",
    },
    {
      keywords: ["styled emotion", "@emotion/styled"],
      packageName: "@emotion/styled",
    },
    {
      keywords: ["lucide", "lucide react", "lucide-react"],
      packageName: "lucide-react",
    },
    {
      keywords: ["react icons", "react-icons"],
      packageName: "react-icons",
    },
    {
      keywords: ["clsx"],
      packageName: "clsx",
    },
    {
      keywords: ["tailwind merge", "tailwind-merge"],
      packageName: "tailwind-merge",
    },
    {
      keywords: ["zod"],
      packageName: "zod",
    },
    {
      keywords: ["react hook form", "react-hook-form"],
      packageName: "react-hook-form",
    },
    {
      keywords: ["confetti", "canvas-confetti"],
      packageName: "canvas-confetti",
    },
  ];

  dependencyKeywords.forEach(({ keywords, packageName }) => {
    if (keywords.some((keyword) => text.includes(keyword))) {
      dependencies[packageName] = "latest";
    }
  });

  return dependencies;
};

export const mergeDependencies = (
  ...dependencyObjects: Array<DependencyMap | null | undefined>
): DependencyMap | undefined => {
  const merged = dependencyObjects.reduce<DependencyMap>(
    (acc, dependencies) => {
      if (!dependencies) return acc;

      Object.entries(dependencies).forEach(([name, version]) => {
        acc[name] = version || "latest";
      });

      return acc;
    },
    {},
  );

  return Object.keys(merged).length > 0 ? merged : undefined;
};

export const buildAiLessonPrompt = (input: BuildAiLessonPromptInput) => {
  const inferredSnippetDependencies = inferDependenciesFromSnippet(
    input.sourceSnippet,
  );

  const inferredTextDependencies = inferDependenciesFromText({
    topic: input.topic,
    framework: input.framework,
    focus: input.focus,
    notes: input.notes,
    description: input.description,
  });

  const mergedDependencies = mergeDependencies(
    inferredSnippetDependencies,
    inferredTextDependencies,
    input.dependencies,
  );

  const systemPrompt = `
You are creating deliberate-practice coding lessons for a platform called DeverNote.

Your job:
- create a SMALL, progressive lesson plan
- break learning into repeatable steps
- start simpler than the final outcome
- if a source snippet is provided, treat it as the target/final outcome
- return STRICT JSON only
- do not include markdown fences
- do not include commentary outside JSON

Rules:
- Keep steps incremental
- Each step should be independently teachable
- Prefer simple starter files
- The first step must be meaningfully smaller than the final result
- Do not make starterFiles identical to solutionFiles
- Each step must add only one or two new ideas
- Prefer minimal starter code for early steps
- Verification rules should target the exact concept introduced in that step
- Do not fully polish the UI in the first step
- Use Sandpack-style file maps
- Include verificationRules using deterministic checks when possible
- If dependencies are provided, preserve them
- If sandpackTemplate is provided, preserve it
- Infer dependencies from sourceSnippet imports, topic, focus, notes, description, and generated solution code
- Include all third-party packages required by solutionFiles in lessonPlan.dependencies
- Preserve provided dependencies and add missing inferred dependencies
- Use "latest" for inferred dependency versions unless a version is provided
- Do not include local imports, relative imports, built-in browser APIs, or built-in Node APIs as dependencies
- Do not include React or ReactDOM unless the template requires them and they are not already available
- All Sandpack file paths must start with "/"
- Example valid paths: "/App.tsx", "/styles.css", "/src/App.tsx", "/src/index.css"
- Never return file paths like "App.tsx" or "src/App.tsx" without the leading slash

Return the exact shape:
{
  "lessonPlan": {
    "title": string,
    "topic": string,
    "level": string,
    "framework": string,
    "focus"?: string,
    "notes"?: string,
    "description"?: string,
    "aiSummary"?: string,
    "sandpackTemplate"?: string,
    "dependencies"?: Record<string, string>
  },
  "lessonSteps": [
    {
      "orderIndex": number,
      "phaseTitle"?: string,
      "title": string,
      "description": string,
      "instructions": string[],
      "hints"?: string[],
      "scaffoldFiles"?: Record<string, { code: string, active?: boolean, hidden?: boolean, readOnly?: boolean }>,
      "starterFiles"?: Record<string, { code: string, active?: boolean, hidden?: boolean, readOnly?: boolean }>,
      "solutionFiles": Record<string, { code: string, active?: boolean, hidden?: boolean, readOnly?: boolean }>,
      "verificationRules"?: Record<string, unknown>,
      "snippetExports"?: Record<string, unknown>
    }
  ]
}
`.trim();

  const userPrompt = `
Create a coding lesson draft from this input:

title: ${input.title ?? ""}
topic: ${input.topic}
level: ${input.level}
framework: ${input.framework}
focus: ${input.focus ?? ""}
notes: ${input.notes ?? ""}
description: ${input.description ?? ""}
sandpackTemplate: ${input.sandpackTemplate ?? ""}
dependencies: ${stringifyMaybe(mergedDependencies)}

sourceSnippet:
${stringifyMaybe(input.sourceSnippet)}

Additional instructions:
- Keep the number of steps between 3 and 10 when reasonable
- If it request a specific amount of steps create that amount of steps
- Make step 0/step 1 truly small
- If sourceSnippet exists, build toward it
- Prefer React-friendly examples when framework is React
- Use mustContain and requiredFiles in verificationRules when possible
- Inspect sourceSnippet, topic, focus, notes, and description for required packages
- Add any third-party packages required by the final solution to lessonPlan.dependencies
- Merge inferred dependencies with provided dependencies
- For dependency versions you are unsure about, use "latest"

Dependency detection:
- Pre-inferred dependencies are included below.
- You may add additional dependencies if your generated solution requires them.
- Do not remove provided dependencies unless they are clearly unused.

preInferredDependencies:
${stringifyMaybe(mergedDependencies)}
`.trim();

  return { systemPrompt, userPrompt };
};