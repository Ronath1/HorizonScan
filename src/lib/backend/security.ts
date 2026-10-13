import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { NextRequest, NextResponse } from 'next/server';
import { ServiceError, safeError } from './errors';
import { LIMITS } from './config';

function secret() {
  if ((process.env.SESSION_SECRET?.length || 0) < 32) throw new ServiceError('SESSION_NOT_CONFIGURED',503,'Secure sessions must be configured before scanning.');
  return process.env.SESSION_SECRET!;
}
export function digest(value: string) { return createHmac('sha256',secret()).update(value).digest('hex'); }
export function equal(a: string, b: string) { const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length && timingSafeEqual(x,y); }
export function signSession(kind: 'guest' | 'admin', id: string, age: number) {
  const body=Buffer.from(JSON.stringify({kind,id,expires:Date.now()+age*1000,
    version:kind==='admin'?digest(`admin:${process.env.ADMIN_ACCESS_CODE || ''}`):''})).toString('base64url');
  return `${body}.${digest(body)}`;
}
export function readSession(token: string | undefined, kind: 'guest' | 'admin'): string | null {
  if (!token || token.length>1024) return null;
  try { const [body,signature,extra]=token.split('.');if(extra||!signature||!equal(digest(body),signature))return null;
    const parsed=JSON.parse(Buffer.from(body,'base64url').toString());
    if(parsed.kind!==kind||!Number.isFinite(parsed.expires)||parsed.expires<=Date.now()||!/^[a-f0-9-]{36}$/.test(parsed.id))return null;
    if(kind==='admin'&&!equal(parsed.version,digest(`admin:${process.env.ADMIN_ACCESS_CODE || ''}`)))return null;
    return parsed.id;
  } catch {return null;}
}
export function guestIdentity(req: NextRequest) { secret();const existing=readSession(req.cookies.get('hs_guest')?.value,'guest');return {id:existing||randomUUID(),fresh:!existing}; }
export function cookieOptions(maxAge:number) {return {httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict' as const,path:'/',maxAge};}
export function attachGuest(response:NextResponse,identity:{id:string;fresh:boolean}) {if(identity.fresh)response.cookies.set('hs_guest',signSession('guest',identity.id,2592000),cookieOptions(2592000));return response;}
export function networkIdentity(req:NextRequest) {
  // Vercel overwrites x-vercel-forwarded-for. Caller supplied XFF is ignored.
  const raw=process.env.VERCEL?req.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim():'127.0.0.1';
  if(!raw||!isIP(raw))throw new ServiceError('NETWORK_UNAVAILABLE',503,'The request network could not be verified.');
  return digest(`ip:${raw}`).slice(0,32);
}
export function requireAdmin(req:NextRequest) {secret();if((process.env.ADMIN_ACCESS_CODE?.length||0)<16)throw new ServiceError('ADMIN_NOT_CONFIGURED',503,'Admin access has not been configured.');if(!readSession(req.cookies.get('hs_admin')?.value,'admin'))throw new ServiceError('UNAUTHORIZED',401,'Sign in to administer HorizonScan.');}
export function requireSameOrigin(req:NextRequest) {const origin=req.headers.get('origin');if(!origin||origin!==req.nextUrl.origin||req.headers.get('sec-fetch-site')==='cross-site')throw new ServiceError('INVALID_ORIGIN',403,'This action must be made from the HorizonScan website.');}
export async function readBody(req:Request) {
  if(!req.headers.get('content-type')?.startsWith('application/json'))throw new ServiceError('INVALID_CONTENT_TYPE',415,'Send JSON request data.');
  if(Number(req.headers.get('content-length')||0)>LIMITS.bodyBytes)throw new ServiceError('REQUEST_TOO_LARGE',413,'The request is too large.');
  const reader=req.body?.getReader();if(!reader)throw new ServiceError('INVALID_REQUEST',400,'The request body is missing.');
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>LIMITS.bodyBytes)throw new ServiceError('REQUEST_TOO_LARGE',413,'The request is too large.');chunks.push(value);}
    try{return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;}catch{throw new ServiceError('INVALID_JSON',400,'The request contains invalid JSON.');}
  }finally{await reader.cancel().catch(()=>undefined);}
}
export function json(data:unknown,status=200){return NextResponse.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function errorResponse(error:unknown,requestId?:string){const e=safeError(error),response=json({error:e.message,code:e.code,request_id:requestId},e.status);if(e.retryAfter)response.headers.set('Retry-After',String(e.retryAfter));return response;}
