import type { PestleBreakdown } from "@/types/pestle";
import { PILLARS_CONFIG } from "@/lib/constants";

export function sourceDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Source page";
  }
}

export function readableDate(value?: string) {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function signedScore(value: number) {
  return `${value > 0 ? "+" : ""}${Number(value.toFixed(2))}`;
}

export function reportFindings(breakdown: PestleBreakdown) {
  return PILLARS_CONFIG.flatMap((pillar) =>
    (breakdown[pillar.key] || []).map((signal, index) => ({
      signal,
      pillar,
      key: `${pillar.key}-${signal.id || index}`,
    })),
  );
}
