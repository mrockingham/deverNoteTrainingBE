import type { GenerateAiLessonRequest } from "../schemas/aiLessonSchemas.js";

const stringifyMaybe = (value: unknown): string => {
  if (value === undefined || value === null) {
    return "";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const buildAiLessonPrompt = (
  input: GenerateAiLessonRequest
): { systemPrompt: string; userPrompt: string } => {
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
- All Sandpack file paths must start with "/" 
- Example valid paths: "/App.tsx", "/styles.css", "/src/App.tsx", "/src/index.css"
- Never return file paths like "App.tsx" or "src/App.tsx" without the leading slash
- Return the exact shape:
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
dependencies: ${stringifyMaybe(input.dependencies)}

sourceSnippet:
${stringifyMaybe(input.sourceSnippet)}

Additional instructions:
- Keep the number of steps between 3 and 6 when reasonable
- Make step 0/step 1 truly small
- If sourceSnippet exists, build toward it
- Prefer React-friendly examples when framework is React
- Use mustContain and requiredFiles in verificationRules when possible
`.trim();

  return { systemPrompt, userPrompt };
};