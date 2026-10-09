/**
 * Core AI Provider and Analysis Types
 */

export interface AskOptions {
  timeoutMs?: number;
  retries?: number;
}

export interface AIProvider {
  name: string;
  ask(prompt: string, options?: AskOptions): Promise<string>;
  isReady(): Promise<{ ready: boolean; reason?: string }>;
}

export interface AnalysisQuestion {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  required: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
}

export interface AnalysisTemplate<TOutput = unknown> {
  templateId: string;
  templateName: string;
  description: string;
  questions: AnalysisQuestion[];
  systemInstructions: string;
  expectedOutputSchemaDescription: string;
  validateOutput(rawParsed: unknown): { valid: boolean; data?: TOutput; errors?: string[] };
}
