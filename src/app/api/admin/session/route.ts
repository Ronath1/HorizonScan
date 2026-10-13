import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { cookieOptions, equal, errorResponse, json, networkIdentity, readBody, requireSameOrigin, signSession } from '@/lib/backend/security';
import { getStore } from '@/lib/backend/store';
import { ServiceError } from '@/lib/backend/errors';
export const runtime='nodejs';
export async function POST(req:NextRequest){try{requireSameOrigin(req);const store=getStore(),ip=networkIdentity(req);await store.throttle(`admin-login:${ip}`,5);
  if((process.env.ADMIN_ACCESS_CODE?.length||0)<16)throw new ServiceError('ADMIN_NOT_CONFIGURED',503,'Admin access has not been configured.');
  const parsed=z.object({code:z.string().min(1).max(256)}).strict().safeParse(await readBody(req));
  if(!parsed.success||!equal(parsed.data.code,process.env.ADMIN_ACCESS_CODE!))throw new ServiceError('UNAUTHORIZED',401,'The admin access code is incorrect.');
  const response=json({ok:true});response.cookies.set('hs_admin',signSession('admin',randomUUID(),28800),cookieOptions(28800));return response;
}catch(error){return errorResponse(error);}}
export async function DELETE(req:NextRequest){try{requireSameOrigin(req);const response=json({ok:true});response.cookies.set('hs_admin','',cookieOptions(0));return response;}catch(error){return errorResponse(error);}}
