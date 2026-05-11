export const AI_USAGE_COSTS = {
  generate: 1,
  generateAndSave: 2,
} as const;

export type AiUsageAction = keyof typeof AI_USAGE_COSTS;