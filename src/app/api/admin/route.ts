import { NextRequest } from 'next/server';
import { z } from 'zod';
import { configurationStatus, MODELS, pricing, SETTINGS_SCHEMA } from '@/lib/backend/config';
import { ServiceError } from '@/lib/backend/errors';
import { errorResponse, json, networkIdentity, readBody, requireAdmin, requireSameOrigin } from '@/lib/backend/security';
import { getStore } from '@/lib/backend/store';
export const runtime='nodejs';
export async function GET(req:NextRequest){try{requireAdmin(req);const store=getStore();await store.throttle(`admin:${networkIdentity(req)}`,30);
  const [settings,usage]=await Promise.all([store.settings(),store.overview()]);return json({settings,usage,configuration:configurationStatus(),models:Object.entries(MODELS).map(([id,m])=>({id,label:m.label,legacy:m.legacy,...pricing(id as keyof typeof MODELS)}))});
}catch(error){return errorResponse(error);}}
const CHANGE_SCHEMA=z.discriminatedUnion('action',[
  z.object({action:z.literal('settings'),settings:SETTINGS_SCHEMA}).strict(),
  z.object({action:z.literal('guest'),guest_id:z.string().uuid(),daily_limit:z.number().int().min(0).max(100).nullable(),blocked:z.boolean()}).strict(),
]);
export async function PATCH(req:NextRequest){try{requireSameOrigin(req);requireAdmin(req);const store=getStore();await store.throttle(`admin:${networkIdentity(req)}`,30);
  const parsed=CHANGE_SCHEMA.safeParse(await readBody(req));if(!parsed.success)throw new ServiceError('INVALID_SETTINGS',400,'The settings or guest allowance are invalid.');
  const change=parsed.data;if(change.action==='settings')await store.set('settings',change.settings);
  else await store.set(`override:${change.guest_id}`,{...(change.daily_limit===null?{}:{daily_limit:change.daily_limit}),blocked:change.blocked});
  await store.set('last_admin_change',{action:change.action,timestamp:new Date().toISOString()},2678400);return json({ok:true});
}catch(error){return errorResponse(error);}}
