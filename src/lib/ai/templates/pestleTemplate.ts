import { AnalysisTemplate } from '../types';
import { PestleBreakdown, PestleSignal } from '@/types/pestle';

export interface PestleOutputData {
  summary: string;
  overall_sentiment_score: number;
  pestle_breakdown: PestleBreakdown;
}

export const PestleAnalysisTemplate: AnalysisTemplate<PestleOutputData> = {
  templateId: 'pestle_market_intelligence',
  templateName: 'PESTLE Market Intelligence & Risk Radar',
  description:
    'Comprehensive macro-environmental assessment across Political, Economic, Social, Technological, Legal, and Environmental dimensions.',
  questions: [
    {
      id: 'industry',
      label: 'Target Industry',
      type: 'text',
      required: true,
      placeholder: 'e.g. Renewable Energy, Fintech, MedTech...',
    },
    {
      id: 'target_country',
      label: 'Target Country or Region',
      type: 'text',
      required: true,
      placeholder: 'e.g. Sri Lanka, Germany, India...',
    },
  ],
  systemInstructions: `You are the specialized HorizonScan market intelligence and risk assessment AI engine.
Your mission is to perform a rigorous macro-environmental analysis across the 6 PESTLE pillars.
Rules:
1. Ground every signal directly in the provided web snippets and concrete facts.
2. Provide direct citations (source URL from provided evidence).
3. Classify each finding as either 'Risk' (threat/headwind) or 'Opportunity' (growth/tailwind).
4. Assign an impact score from -5 (critical threat/barrier) to +5 (major strategic opportunity).
5. Output ONLY valid JSON matching the exact schema specified below. Do not wrap in markdown or commentary.`,
  expectedOutputSchemaDescription: `{
  "summary": "Brief 2-sentence executive summary of the macro environment",
  "overall_sentiment_score": 0.0,
  "pestle_breakdown": {
    "political": [
      {
        "title": "Short title",
        "detail": "Actionable 1-2 sentence description",
        "type": "Risk" | "Opportunity",
        "impact_score": -5 to 5,
        "source_url": "https://..."
      }
    ],
    "economic": [],
    "social": [],
    "technological": [],
    "legal": [],
    "environmental": []
  }
}`,
  validateOutput(rawParsed: unknown): { valid: boolean; data?: PestleOutputData; errors?: string[] } {
    const errors: string[] = [];

    if (!rawParsed || typeof rawParsed !== 'object') {
      return { valid: false, errors: ['Output is not a valid JSON object.'] };
    }

    const obj = rawParsed as Record<string, unknown>;

    if (typeof obj.summary !== 'string' || obj.summary.trim().length === 0) {
      errors.push('Missing or invalid "summary" string.');
    }

    let overall_sentiment_score = 0;
    if (typeof obj.overall_sentiment_score === 'number') {
      overall_sentiment_score = Math.max(-5, Math.min(5, obj.overall_sentiment_score));
    }

    if (!obj.pestle_breakdown || typeof obj.pestle_breakdown !== 'object') {
      errors.push('Missing "pestle_breakdown" object.');
      return { valid: false, errors };
    }

    const rawBreakdown = obj.pestle_breakdown as Record<string, unknown>;
    const pillars = ['political', 'economic', 'social', 'technological', 'legal', 'environmental'] as const;

    const pestle_breakdown: PestleBreakdown = {
      political: [],
      economic: [],
      social: [],
      technological: [],
      legal: [],
      environmental: [],
    };

    for (const pillar of pillars) {
      const rawList = Array.isArray(rawBreakdown[pillar]) ? rawBreakdown[pillar] : [];
      pestle_breakdown[pillar] = rawList.map((item: unknown, idx: number): PestleSignal => {
        const sig = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {};
        const title = typeof sig.title === 'string' ? sig.title : `Signal ${idx + 1}`;
        const detail = typeof sig.detail === 'string' ? sig.detail : '';
        const rawType = String(sig.type || '').toLowerCase();
        const type: 'Risk' | 'Opportunity' =
          rawType.includes('risk') || rawType.includes('threat') ? 'Risk' : 'Opportunity';

        let impact_score =
          typeof sig.impact_score === 'number'
            ? sig.impact_score
            : type === 'Risk'
            ? -2
            : 3;
        impact_score = Math.max(-5, Math.min(5, Math.round(impact_score)));

        const source_url =
          typeof sig.source_url === 'string' && sig.source_url.startsWith('http')
            ? sig.source_url
            : '';

        return {
          id: `${pillar}_${idx}_${Date.now()}`,
          title,
          detail,
          type,
          impact_score,
          source_url,
        };
      });
    }

    // Recompute overall sentiment if zero or missing
    let totalSignals = 0;
    let sumScore = 0;
    for (const pillar of pillars) {
      for (const sig of pestle_breakdown[pillar]) {
        totalSignals++;
        sumScore += sig.impact_score;
      }
    }

    if (totalSignals > 0 && Math.abs(overall_sentiment_score) < 0.001) {
      overall_sentiment_score = Number((sumScore / totalSignals).toFixed(1));
    }

    return {
      valid: errors.length === 0,
      data: {
        summary: String(obj.summary || 'Macro analysis completed.'),
        overall_sentiment_score,
        pestle_breakdown,
      },
      errors,
    };
  },
};
