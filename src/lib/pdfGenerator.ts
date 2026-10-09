import { jsPDF } from 'jspdf';
import { ScanResponseData } from '@/types/pestle';
import { PILLARS_CONFIG } from './constants';

/**
 * Resolves the jsPDF constructor reliably across Next.js ESM, Webpack, and browser environments.
 */
function createPdfInstance(): jsPDF {
  let Constructor: any = jsPDF;
  if (typeof Constructor !== 'function') {
    if (typeof (jsPDF as any)?.jsPDF === 'function') {
      Constructor = (jsPDF as any).jsPDF;
    } else if (typeof (jsPDF as any)?.default === 'function') {
      Constructor = (jsPDF as any).default;
    }
  }
  return new Constructor({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });
}

/**
 * Sanitizes strings for standard PDF Helvetica font (WinAnsiEncoding).
 * Replaces high-Unicode glyphs (em-dashes, bullets, curly quotes, arrows)
 * with clean readable ASCII symbols to prevent encoding crashes.
 */
function cleanPdfText(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '*')
    .replace(/▲/g, '(+) ')
    .replace(/▼/g, '(-) ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '');
}

export async function generatePestlePdf(data: ScanResponseData): Promise<void> {
  const doc = createPdfInstance();

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
  const margin = 36;
  const contentWidth = pageWidth - margin * 2; // 523 pt

  let y = margin;
  let pageNumber = 1;

  const safeIndustry = cleanPdfText(data.industry || 'Industry');
  const safeCountry = cleanPdfText(data.target_country || 'Country');

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 45) {
      renderFooter();
      doc.addPage();
      pageNumber++;
      y = margin + 10;
      renderRunningHeader();
    }
  };

  const renderRunningHeader = () => {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`HorizonScan Intelligence Report - ${safeIndustry} in ${safeCountry}`, margin, y);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 6, margin + contentWidth, y + 6);
    y += 20;
  };

  const renderFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const footerText = `HorizonScan AI | Tavily Grounded Intelligence | Page ${pageNumber}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 20, { align: 'center' });
  };

  // ==========================================
  // 1. Executive Cover Header
  // ==========================================
  doc.setFillColor(15, 23, 42); // dark navy
  doc.roundedRect(margin, y, contentWidth, 68, 8, 8, 'F');

  // Cyan brand mark
  doc.setFillColor(6, 182, 212); // cyan
  doc.roundedRect(margin + 12, y + 14, 40, 40, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('H', margin + 26, y + 42);

  // Title
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Horizon', margin + 60, y + 32);
  doc.setTextColor(56, 189, 248); // light cyan
  doc.text('Scan', margin + 126, y + 32);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('EXECUTIVE PESTLE MARKET INTELLIGENCE REPORT', margin + 60, y + 48);

  // Target Industry & Country badge on right
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text(`Target: ${safeIndustry}`, margin + contentWidth - 14, y + 28, { align: 'right' });
  doc.setTextColor(52, 211, 153); // emerald
  doc.text(`Region: ${safeCountry}`, margin + contentWidth - 14, y + 42, { align: 'right' });
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);

  let formattedDate = 'Recent';
  try {
    if (data.timestamp) {
      formattedDate = new Date(data.timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  } catch {
    formattedDate = 'Current';
  }

  doc.text(formattedDate, margin + contentWidth - 14, y + 55, { align: 'right' });

  y += 80;

  // ==========================================
  // 2. Executive Summary Callout
  // ==========================================
  const rawSummary = cleanPdfText(data.summary || 'Summary unavailable');
  const summaryLines = doc.splitTextToSize(rawSummary, contentWidth - 28);
  const summaryBoxHeight = summaryLines.length * 13 + 30;

  doc.setFillColor(240, 249, 255); // light cyan bg
  doc.setDrawColor(6, 182, 212); // cyan border
  doc.setLineWidth(1);
  doc.roundedRect(margin, y, contentWidth, summaryBoxHeight, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(14, 116, 144);
  doc.text('EXECUTIVE MACRO ASSESSMENT', margin + 14, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(summaryLines, margin + 14, y + 30);

  y += summaryBoxHeight + 14;

  // ==========================================
  // 3. Colorful Visual Charts Section
  // ==========================================
  let totalRisks = 0;
  let totalOpportunities = 0;
  const pillarScores: { label: string; letter: string; color: [number, number, number]; avg: number }[] = [];

  for (const p of PILLARS_CONFIG) {
    const sigs = data.pestle_breakdown?.[p.key] || [];
    let sum = 0;
    for (const s of sigs) {
      if (s.type === 'Risk') totalRisks++;
      if (s.type === 'Opportunity') totalOpportunities++;
      sum += Number(s.impact_score || 0);
    }
    const avg = sigs.length > 0 ? Number((sum / sigs.length).toFixed(1)) : 0;
    const colorRGB: [number, number, number] =
      p.key === 'political' ? [139, 92, 246]
      : p.key === 'economic' ? [16, 185, 129]
      : p.key === 'social' ? [245, 158, 11]
      : p.key === 'technological' ? [6, 182, 212]
      : p.key === 'legal' ? [59, 130, 246]
      : [20, 184, 166];
    pillarScores.push({ label: p.label, letter: p.letter, color: colorRGB, avg });
  }

  const totalSignals = totalRisks + totalOpportunities;
  const oppPct = totalSignals > 0 ? Math.round((totalOpportunities / totalSignals) * 100) : 50;
  const riskPct = 100 - oppPct;
  const score = Math.max(-5, Math.min(5, Number(data.overall_sentiment_score || 0)));

  // Dual Chart Cards: Readiness Meter & Risk/Opportunity Bar
  const halfCardW = (contentWidth - 12) / 2;

  // Card 1: Macro Readiness Meter
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, halfCardW, 82, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('MACRO FAVORABILITY METER', margin + 12, y + 16);

  doc.setFontSize(22);
  if (score >= 1) doc.setTextColor(16, 185, 129); // green
  else if (score <= -1) doc.setTextColor(239, 68, 68); // red
  else doc.setTextColor(245, 158, 11); // amber
  doc.text(score > 0 ? `+${score}` : `${score}`, margin + 12, y + 42);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('/ +5.0 Scale', margin + 70, y + 40);

  // Vector Progress Meter Bar
  const meterY = y + 54;
  const meterW = halfCardW - 24;
  doc.setFillColor(239, 68, 68); // Red threat zone
  doc.rect(margin + 12, meterY, meterW * 0.35, 7, 'F');
  doc.setFillColor(245, 158, 11); // Amber zone
  doc.rect(margin + 12 + meterW * 0.35, meterY, meterW * 0.3, 7, 'F');
  doc.setFillColor(16, 185, 129); // Green zone
  doc.rect(margin + 12 + meterW * 0.65, meterY, meterW * 0.35, 7, 'F');

  // Needle indicator
  const normX = margin + 12 + ((score + 5) / 10) * meterW;
  doc.setFillColor(15, 23, 42);
  doc.circle(normX, meterY + 3.5, 4.5, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('-5 Threat', margin + 12, y + 74);
  doc.text('+5 Prime Opportunity', margin + halfCardW - 12, y + 74, { align: 'right' });

  // Card 2: Risk vs Opportunity Balance Bar
  const card2X = margin + halfCardW + 12;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(card2X, y, halfCardW, 82, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('OPPORTUNITY VS RISK RATIO', card2X + 12, y + 16);

  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129);
  doc.text(`[+] ${totalOpportunities} Opps (${oppPct}%)`, card2X + 12, y + 36);
  doc.setTextColor(239, 68, 68);
  doc.text(`[-] ${totalRisks} Risks (${riskPct}%)`, card2X + halfCardW - 12, y + 36, { align: 'right' });

  // Ratio dual-color bar
  const ratioY = y + 46;
  const oppW = (meterW * oppPct) / 100;
  const riskW = meterW - oppW;
  doc.setFillColor(16, 185, 129);
  doc.rect(card2X + 12, ratioY, oppW, 9, 'F');
  doc.setFillColor(239, 68, 68);
  doc.rect(card2X + 12 + oppW, ratioY, riskW, 9, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Total Signals Analyzed: ${totalSignals} Grounded Findings`, card2X + 12, y + 70);

  y += 94;

  // ==========================================
  // 4. 6-Pillar Sentiment Distribution Bar
  // ==========================================
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 54, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('PILLAR NET SENTIMENT DISTRIBUTION', margin + 12, y + 14);

  const colW = (contentWidth - 24) / 6;
  pillarScores.forEach((p, idx) => {
    const px = margin + 12 + idx * colW;
    // Pillar letter badge
    doc.setFillColor(...p.color);
    doc.roundedRect(px, y + 20, 14, 14, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(p.letter, px + 4, y + 30);

    // Label & Score
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(p.label, px + 18, y + 27);
    doc.setFont('helvetica', 'bold');
    if (p.avg > 0) doc.setTextColor(16, 185, 129);
    else if (p.avg < 0) doc.setTextColor(239, 68, 68);
    else doc.setTextColor(100, 116, 139);
    doc.text(p.avg > 0 ? `+${p.avg}` : `${p.avg}`, px + 18, y + 37);

    // Mini bar
    doc.setFillColor(226, 232, 240);
    doc.rect(px, y + 42, colW - 6, 3, 'F');
    doc.setFillColor(...p.color);
    doc.rect(px, y + 42, Math.min(colW - 6, (Math.abs(p.avg) / 5) * (colW - 6)), 3, 'F');
  });

  y += 66;

  // ==========================================
  // 5. Detailed 6-Card PESTLE Matrix
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('PESTLE Environmental Matrix & Actionable Signals', margin, y);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.line(margin, y + 4, margin + contentWidth, y + 4);
  y += 16;

  for (const pillar of PILLARS_CONFIG) {
    const signals = data.pestle_breakdown?.[pillar.key] || [];

    checkPageBreak(50);

    // Pillar Header Banner
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 22, 4, 4, 'F');

    // Colored accent chip
    const pillarMeta = pillarScores.find((ps) => ps.letter === pillar.letter);
    if (pillarMeta) {
      doc.setFillColor(...pillarMeta.color);
      doc.roundedRect(margin + 6, y + 4, 14, 14, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(pillar.letter, margin + 10, y + 14);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${pillar.label} Dimension`, margin + 26, y + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${signals.length} verified signals`, margin + contentWidth - 10, y + 14, { align: 'right' });

    y += 26;

    if (signals.length === 0) {
      checkPageBreak(24);
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text('No critical macro signals identified in web indices for this pillar.', margin + 10, y + 10);
      y += 20;
      continue;
    }

    for (const sig of signals) {
      const isOpp = sig.type === 'Opportunity';
      const cleanTitle = cleanPdfText(sig.title || 'Untitled Signal');
      const cleanDetail = cleanPdfText(sig.detail || '');
      const detailLines = doc.splitTextToSize(cleanDetail, contentWidth - 28);
      const cardHeight = detailLines.length * 11 + 42;

      checkPageBreak(cardHeight + 8);

      // Signal Card Box
      if (isOpp) {
        doc.setFillColor(240, 253, 244); // light emerald
        doc.setDrawColor(187, 247, 208); // border
      } else {
        doc.setFillColor(254, 242, 242); // light rose
        doc.setDrawColor(254, 202, 202); // border
      }
      doc.setLineWidth(0.8);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 5, 5, 'FD');

      // Badges: Type & Impact
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      if (isOpp) {
        doc.setFillColor(16, 185, 129);
        doc.setTextColor(255, 255, 255);
        doc.roundedRect(margin + 10, y + 7, 65, 12, 3, 3, 'F');
        doc.text('OPPORTUNITY', margin + 15, y + 15);
      } else {
        doc.setFillColor(239, 68, 68);
        doc.setTextColor(255, 255, 255);
        doc.roundedRect(margin + 10, y + 7, 40, 12, 3, 3, 'F');
        doc.text('RISK', margin + 18, y + 15);
      }

      // Impact Score Badge
      const scoreNum = Number(sig.impact_score || 0);
      const scoreText = `Impact: ${scoreNum > 0 ? `+${scoreNum}` : scoreNum}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      if (scoreNum >= 0) doc.setTextColor(5, 150, 105);
      else doc.setTextColor(220, 38, 38);
      doc.text(scoreText, margin + contentWidth - 12, y + 15, { align: 'right' });

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(cleanTitle.slice(0, 90), margin + 10, y + 28);

      // Detail
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(detailLines, margin + 10, y + 40);

      // Citation URL
      if (sig.source_url) {
        doc.setFontSize(7);
        doc.setTextColor(2, 132, 199);
        const urlY = y + cardHeight - 8;
        const displayUrl = cleanPdfText(sig.source_url).slice(0, 90);
        doc.textWithLink(`Source Citation: ${displayUrl}`, margin + 10, urlY, {
          url: sig.source_url,
        });
      }

      y += cardHeight + 6;
    }

    y += 8;
  }

  // ==========================================
  // 6. Verified Grounding Sources List
  // ==========================================
  if (data.sources && data.sources.length > 0) {
    checkPageBreak(80);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Verified Web Grounding Sources (${data.sources.length} Indexed Sources)`, margin, y);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 4, margin + contentWidth, y + 4);
    y += 14;

    data.sources.slice(0, 8).forEach((src, idx) => {
      checkPageBreak(22);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const cleanSrcTitle = cleanPdfText(src.title || 'Untitled Source').slice(0, 75);
      doc.text(`[${idx + 1}] ${cleanSrcTitle}`, margin + 4, y);
      if (src.url) {
        doc.setTextColor(2, 132, 199);
        const cleanSrcUrl = cleanPdfText(src.url).slice(0, 80);
        doc.textWithLink(cleanSrcUrl, margin + 4, y + 9, { url: src.url });
      }
      y += 18;
    });
  }

  // Final footer
  renderFooter();

  // Save PDF file with robust fallback
  const cleanIndFilename = safeIndustry.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const cleanCtryFilename = safeCountry.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const filename = `HorizonScan_${cleanIndFilename}_${cleanCtryFilename}_Report.pdf`;

  try {
    doc.save(filename);
  } catch (err) {
    console.warn('doc.save fallback to direct Blob download:', err);
    try {
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 250);
    } catch (innerErr) {
      console.error('Fatal PDF save error:', innerErr);
      throw innerErr;
    }
  }
}
