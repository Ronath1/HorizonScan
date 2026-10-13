import { PestleBreakdown, ScanResponseData } from '@/types/pestle';
import { PILLARS } from './config';
export function calculateScores(breakdown: PestleBreakdown): NonNullable<ScanResponseData['scoring']> {
  const pillar_scores = Object.fromEntries(PILLARS.map(p => {
    const signals = breakdown[p];
    return [p, signals.length ? Number((signals.reduce((n, s) => n + s.impact_score, 0) / signals.length).toFixed(2)) : null];
  })) as NonNullable<ScanResponseData['scoring']>['pillar_scores'];
  const values = Object.values(pillar_scores).filter((n): n is number => n !== null);
  const signals = Object.values(breakdown).flat();
  const score = values.length === PILLARS.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : null;
  return {
    version: 'equal-pillars-v1', method: 'Mean signal impact within each pillar; equal weight for all six pillars. Overall index withheld unless all six have evidence.',
    pillar_scores, covered_pillars: values.length, total_pillars: PILLARS.length,
    favorability_index: score === null ? null : Math.round((score + 5) * 10),
    opportunity_count: signals.filter(s => s.type === 'Opportunity').length,
    risk_count: signals.filter(s => s.type === 'Risk').length,
    rubric: 'AI-assessed magnitude: 1 minor/local; 2 limited; 3 material sector impact; 4 major sector impact; 5 transformative sector impact. Backend applies negative sign for risks and positive for opportunities. This index is not a probability or forecast.',
  };
}
export function overallScore(scoring: NonNullable<ScanResponseData['scoring']>): number | null {
  const values = Object.values(scoring.pillar_scores);
  return values.some(v => v === null) ? null : Number((values.reduce<number>((n, v) => n + (v ?? 0), 0) / 6).toFixed(2));
}
export function createSummary(breakdown: PestleBreakdown, industry: string, country: string, covered: number) {
  const all = Object.values(breakdown).flat();
  const opportunities = all.filter(s => s.type === 'Opportunity').sort((a, b) => b.impact_score - a.impact_score);
  const risks = all.filter(s => s.type === 'Risk').sort((a, b) => a.impact_score - b.impact_score);
  return `Evidence review for ${industry} in ${country} identified ${opportunities.length} opportunities and ${risks.length} risks across ${covered}/6 PESTLE pillars. ${opportunities[0] ? `Highest-rated opportunity: ${opportunities[0].title}. ` : ''}${risks[0] ? `Highest-rated risk: ${risks[0].title}.` : ''}`.trim();
}
