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

const callProvider = async (
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



let parsedJson: unknown;

try {
  parsedJson = JSON.parse(jsonText);
} catch (error) {
  console.error("Failed to parse model JSON:", rawText);
  throw new Error("Model returned invalid JSON.");
}

const normalizedDraft = normalizeAiLessonDraft(parsedJson);

const result = aiGeneratedLessonDraftSchema.safeParse(normalizedDraft);

if (!result.success) {
  console.error("[AI LESSON RAW JSON]");
  console.dir(parsedJson, { depth: 8 });

  console.error("[AI LESSON NORMALIZED JSON]");
  console.dir(normalizedDraft, { depth: 8 });

  console.error("[AI LESSON ZOD ERROR]");
  console.dir(result.error.format(), { depth: 8 });

  throw result.error;
}

return result.data;
};

export const generateAiLessonDraft = async (
  input: GenerateAiLessonRequest
): Promise<AiGeneratedLessonDraft> => {


  const rawDraft =  await callProvider(input);

  return aiGeneratedLessonDraftSchema.parse(rawDraft);
};