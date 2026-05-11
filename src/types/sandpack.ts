export interface SandpackFile {
  code: string;
  active?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
}

export type SandpackFiles = Record<string, SandpackFile>;