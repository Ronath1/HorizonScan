import { NextRequest, NextResponse } from 'next/server';
import { processScanRequest } from '@/lib/scanService';
import { ScanRequestPayload } from '@/types/pestle';

export async function POST(req: NextRequest) {
  try {
    const body: ScanRequestPayload = await req.json().catch(() => ({}));
    const result = await processScanRequest(body);
    return NextResponse.json(result.data, { status: result.status });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('API Route Error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
