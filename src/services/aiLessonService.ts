import OpenAI from "openai";
import {
  aiGeneratedLessonDraftSchema,
  type AiGeneratedLessonDraft,
  type GenerateAiLessonRequest,
} from "../schemas/aiLessonSchemas.js";
import { buildAiLessonPrompt } from "./promptBuilderService.js";
import { normalizeAiLessonDraft } from "../utils/normalizeAiLessonDraft.js";
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const buildMockDraft = (
  input: GenerateAiLessonRequest
): AiGeneratedLessonDraft => {
  const title = input.title?.trim() || `${input.topic} Mastery`;

  return {
    lessonPlan: {
      title,
      topic: input.topic,
      level: input.level,
      framework: input.framework,
      focus: input.focus,
      notes: input.notes,
      description:
        input.description || `AI-generated lesson plan for ${input.topic}.`,
      aiSummary:
        "This draft was generated in mock mode. Replace the mock provider with a real LLM call when ready.",
      sandpackTemplate: input.sandpackTemplate,
      dependencies: input.dependencies,
    },
    lessonSteps: [
      {
        orderIndex: 0,
        phaseTitle: "Step 1: Foundation",
        title: "Build the smallest working version",
        description:
          "Create the simplest possible version of the target feature before refinement.",
        instructions: [
          "Create the smallest working component",
          "Avoid extra abstractions",
          "Focus on one visible result",
        ],
        hints: ["Keep the first step tiny", "Use plain markup before polish"],
        starterFiles: {
          "/App.tsx": {
            code: "export default function App() { return <div>Start here</div>; }",
            active: true,
          },
        },
        solutionFiles: {
          "/App.tsx": {
            code: "export default function App() { return <div className='card'>Hello</div>; }",
            active: true,
          },
          "/styles.css": {
            code: ".card { padding: 16px; border-radius: 12px; }",
          },
          "/package.json": {
            code: JSON.stringify(
              { dependencies: input.dependencies ?? {} },
              null,
              2
            ),
          },
        },
        verificationRules: {
          mustContain: ["card", "padding", "border-radius"],
        },
      },
      {
        orderIndex: 1,
        phaseTitle: "Step 2: Refinement",
        title: "Refine layout and visual structure",
        description:
          "Improve the base component and bring it closer to the target.",
        instructions: ["Refine spacing", "Improve structure", "Keep code readable"],
        hints: ["Do not overbuild the second step"],
        starterFiles: {
          "/App.tsx": {
            code: "export default function App() { return <div className='card'>Hello</div>; }",
            active: true,
          },
          "/styles.css": {
            code: ".card { padding: 16px; border-radius: 12px; }",
          },
        },
        solutionFiles: {
          "/App.tsx": {
            code: "export default function App() { return <div className='card'>Refined card</div>; }",
            active: true,
          },
          "/styles.css": {
            code: ".card { padding: 20px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }",
          },
          "/package.json": {
            code: JSON.stringify(
              { dependencies: input.dependencies ?? {} },
              null,
              2
            ),
          },
        },
        verificationRules: {
          mustContain: ["card", "padding", "border-radius"],
        },
      },
    ],
  };
};

const extractTextFromResponse = (response: unknown): string => {
  if (!response || typeof response !== "object") {
    throw new Error("Invalid OpenAI response shape.");
  }

  const directText = (response as { output_text?: unknown }).output_text;
  if (typeof directText === "string" && directText.trim()) {
    return directText.trim();
  }

  const maybeOutput = (response as { output?: unknown }).output;

  if (!Array.isArray(maybeOutput)) {
    throw new Error("OpenAI response did not contain output.");
  }

  const textParts: string[] = [];

  for (const item of maybeOutput) {
    if (!item || typeof item !== "object") continue;

    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      if (!part || typeof part !== "object") continue;

      const typedPart = part as { type?: unknown; text?: unknown };

      if (typedPart.type === "output_text" && typeof typedPart.text === "string") {
        textParts.push(typedPart.text);
      }
    }
  }

  const text = textParts.join("\n").trim();

  if (!text) {
    throw new Error("OpenAI response did not contain output text.");
  }

  return text;
};

const extractJsonBlock = (text: string): string => {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Could not find JSON object in model response.");
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
};

const callRealProvider = async (
  input: GenerateAiLessonRequest
): Promise<AiGeneratedLessonDraft> => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const model = process.env.OPENAI_MODEL;
  if (!model) {
    throw new Error("OPENAI_MODEL is not set.");
  }

  const { systemPrompt, userPrompt } = buildAiLessonPrompt(input);

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: systemPrompt }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: userPrompt }],
      },
    ],
    text: {
      format: {
        type: "json_object",
      },
    },
  });

  const rawText = extractTextFromResponse(response);
  const jsonText = extractJsonBlock(rawText);

//   console.log("[AI LESSON RAW RESPONSE TEXT]");
// console.log(rawText);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch (error) {
    console.error("Failed to parse model JSON:", rawText);
    throw new Error("Model returned invalid JSON.");
  }

 const normalizedDraft = normalizeAiLessonDraft(parsedJson);
return aiGeneratedLessonDraftSchema.parse(normalizedDraft);
};

export const generateAiLessonDraft = async (
  input: GenerateAiLessonRequest
): Promise<AiGeneratedLessonDraft> => {
  const { systemPrompt, userPrompt } = buildAiLessonPrompt(input);

  // console.log("[AI LESSON SYSTEM PROMPT]");
  // console.log(systemPrompt);
  // console.log("[AI LESSON USER PROMPT]");
  // console.log(userPrompt);

  const useMock = process.env.MOCK_AI_LESSONS === "true";

  const rawDraft = useMock
    ? buildMockDraft(input)
    : await callRealProvider(input);

  return aiGeneratedLessonDraftSchema.parse(rawDraft);
};