"use client";
import { BookOpenText } from "lucide-react";
import type { ScanResponseData } from "@/types/pestle";

export function ExecutiveSummaryBar({ data }: { data: ScanResponseData }) {
  return (
    <section className="panel summary-panel">
      <h2>
        <BookOpenText size={15} />
        Your market at a glance
      </h2>
      <p>{data.summary}</p>
    </section>
  );
}
