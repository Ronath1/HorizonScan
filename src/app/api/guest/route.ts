import { NextRequest } from 'next/server';
import { attachGuest, guestIdentity, json, errorResponse, networkIdentity } from '@/lib/backend/security';
import { getStore, GuestOverride } from '@/lib/backend/store';
export const runtime='nodejs';
export async function GET(req:NextRequest){try{const guest=guestIdentity(req),store=getStore(),settings=await store.settings();await store.throttle(`guest:${networkIdentity(req)}`,30);
  const day=new Date().toISOString().slice(0,10),usage=await store.guestUsage(guest.id,day),override=await store.get<GuestOverride>(`override:${guest.id}`)||{};
  return attachGuest(json({guest_id:guest.id,day,daily_limit:override.daily_limit??settings.guest_daily_limit,used:usage.scans||0,blocked:Boolean(override.blocked),scans_enabled:settings.scans_enabled,resets_at:new Date(Date.parse(`${day}T00:00:00Z`)+86400000).toISOString()}),guest);
}catch(error){return errorResponse(error);}}
