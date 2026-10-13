import { NextRequest } from 'next/server';
import { guestIdentity, attachGuest, requireSameOrigin, readBody, networkIdentity, json, errorResponse } from '@/lib/backend/security';
import { getStore } from '@/lib/backend/store';
import { runScan } from '@/lib/backend/pipeline';
export const runtime = 'nodejs';
export const maxDuration = 90;
export async function POST(req: NextRequest) {
  let guest: ReturnType<typeof guestIdentity> | undefined;
  try {
    requireSameOrigin(req);guest = guestIdentity(req);
    const data = await runScan(await readBody(req),{ guest:guest.id,ip:networkIdentity(req) },getStore());
    return attachGuest(json(data),guest);
  } catch (error) {
    const response = errorResponse(error);
    return guest ? attachGuest(response,guest) : response;
  }
}
