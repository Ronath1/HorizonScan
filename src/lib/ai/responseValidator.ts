import { AnalysisTemplate, AIProvider } from './types';
import { PromptBuilder } from './promptBuilder';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  rawText: string;
  error?: string;
  corrected?: boolean;
}

/**
 * Handles cleaning, JSON parsing, schema validation, and automatic AI correction loop
 */
export class ResponseValidator {
  /**
   * Sanitizes raw AI text to isolate JSON payload
   */
  public static cleanJsonText(rawText: string): string {
    let cleaned = rawText.trim();

    // 1. Remove markdown fences ```json ... ``` or ``` ... ```
    cleaned = cleaned.replace(/^```(?:json)?\s*/gi, '');
    cleaned = cleaned.replace(/\s*```$/gi, '');

    // 2. Locate first '{' and last '}'
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.slice(startIdx, endIdx + 1);
    }

    // 3. Fix common trailing comma syntax issues
    cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

    return cleaned.trim();
  }

  /**
   * Parses string into JSON safely
   */
  public static parseJson(rawText: string): { success: boolean; data?: unknown; error?: string } {
    const cleaned = this.cleanJsonText(rawText);
    try {
      const parsed = JSON.parse(cleaned);
      return { success: true, data: parsed };
    } catch (err) {
      return {
        success: false,
        error: `JSON parse error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Validates parsed JSON against the AnalysisTemplate schema with optional 1-attempt correction
   */
  public static async validateAndExtract<T>(
    rawAiText: string,
    template: AnalysisTemplate<T>,
    aiProvider?: AIProvider,
    allowCorrection = true
  ): Promise<ValidationResult<T>> {
    // 1. Parse JSON
    const parseResult = this.parseJson(rawAiText);

    if (parseResult.success) {
      const valResult = template.validateOutput(parseResult.data);
      if (valResult.valid && valResult.data) {
        return {
          success: true,
          data: valResult.data,
          rawText: rawAiText,
        };
      }
    }

    // 2. If parsing or validation failed and correction is allowed + provider is available:
    if (allowCorrection && aiProvider) {
      console.log('[AI] Initial response failed validation. Triggering 1-attempt correction request...');
      try {
        const errorDetail = parseResult.error || 'Schema validation mismatch';
        const correctionPrompt = PromptBuilder.buildCorrectionPrompt(
          rawAiText,
          template.expectedOutputSchemaDescription,
          errorDetail
        );

        const correctedRawText = await aiProvider.ask(correctionPrompt, { timeoutMs: 30000 });
        const correctedParse = this.parseJson(correctedRawText);

        if (correctedParse.success) {
          const valResult = template.validateOutput(correctedParse.data);
          if (valResult.valid && valResult.data) {
            console.log('[AI] Correction request succeeded! Validated successfully.');
            return {
              success: true,
              data: valResult.data,
              rawText: correctedRawText,
              corrected: true,
            };
          }
        }
      } catch (correctionErr) {
        console.warn('[AI] Correction request failed:', correctionErr);
      }
    }

    return {
      success: false,
      rawText: rawAiText,
      error: parseResult.error || 'Response does not match expected analysis schema.',
    };
  }
}
