type SandpackFileValue =
  | string
  | {
      code: string;
      active?: boolean;
      hidden?: boolean;
      readOnly?: boolean;
    };

type SandpackFileEntry = [string, SandpackFileValue];

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isValidSandpackFileValue = (
  value: unknown,
): value is SandpackFileValue => {
  if (typeof value === "string") return true;

  if (!isRecord(value)) return false;

  return typeof value.code === "string";
};

const isValidSandpackFileEntry = (
  entry: [string, unknown],
): entry is SandpackFileEntry => {
  const [path, value] = entry;

  const looksLikeFilePath =
    path.startsWith("/") &&
    /\.(tsx|ts|jsx|js|css|html|json|md)$/.test(path);

  return looksLikeFilePath && isValidSandpackFileValue(value);
};

export const normalizeSandpackFilesFromAi = (
  input: unknown,
): Record<string, SandpackFileValue> | undefined => {
  if (!isRecord(input)) return undefined;

  const entries = Object.entries(input).filter(isValidSandpackFileEntry);

  if (!entries.length) return undefined;

  return Object.fromEntries(entries);
};