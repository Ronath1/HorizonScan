import { AnalysisTemplate } from './types';

export interface PromptContext {
  template: AnalysisTemplate<unknown>;
  answers: Record<string, string>;
  groundingEvidence?: string;
}

/**
 * PromptBuilder enforces clear delineation between system instructions,
 * domain templates, untrusted user inputs, and grounding evidence.
 */
export class PromptBuilder {
  /**
   * Sanitizes untrusted user strings to prevent prompt injection delimiter spoofing
   */
  private static sanitizeUserInput(val: string): string {
    if (!val) return '';
    return val
      .replace(/===/g, '---')
      .replace(/\r\n/g, '\n')
      .trim();
  }

  public static buildPrompt(context: PromptContext): string {
    const { template, answers, groundingEvidence } = context;

    const formattedAnswers = template.questions
      .map((q) => {
        const rawVal = answers[q.id] || answers[q.label] || '';
        const safeVal = this.sanitizeUserInput(rawVal);
        return `${q.label}: ${safeVal || '(Not specified)'}`;
      })
      .join('\n');

    const promptBlocks = [
      `=== ROLE & SYSTEM INSTRUCTIONS ===`,
      template.systemInstructions,
      ``,
      `=== ANALYSIS TEMPLATE ===`,
      `Template ID: ${template.templateId}`,
      `Template Name: ${template.templateName}`,
      `Description: ${template.description}`,
      ``,
      `=== USER DATA & INPUTS ===`,
      formattedAnswers,
      ``,
    ];

    if (groundingEvidence && groundingEvidence.trim().length > 0) {
      promptBlocks.push(
        `=== GROUNDED RESEARCH EVIDENCE ===`,
        groundingEvidence.trim(),
        ``
      );
    }

    promptBlocks.push(
      `=== REQUIRED OUTPUT SCHEMA ===`,
      `Return ONLY valid JSON with no markdown formatting, no code fences, and no preamble:`,
      template.expectedOutputSchemaDescription,
      ``,
      `CRITICAL INSTRUCTION: Return strictly the raw JSON object conforming to the schema above.`
    );

    return promptBlocks.join('\n');
  }

  /**
   * Builds a correction prompt in case the AI generated invalid JSON
   */
  public static buildCorrectionPrompt(originalResponse: string, schemaDescription: string, errorDetail?: string): string {
    return `=== CORRECTION REQUEST ===
The previous response failed schema validation.

Error: ${errorDetail || 'Invalid JSON syntax'}

PREVIOUS RESPONSE:
${originalResponse.slice(0, 1500)}

Please return the EXACT SAME analysis, but fix the syntax so it is 100% valid JSON matching this schema:
${schemaDescription}

Return ONLY valid JSON. Do not include markdown codeblocks or explanations outside the JSON.`;
  }
}
