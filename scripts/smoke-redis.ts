import { loadEnvConfig } from '@next/env';
import { randomUUID } from 'node:crypto';
import { DEFAULT_SETTINGS } from '../src/lib/backend/config';
import { RedisDatabase, Store } from '../src/lib/backend/store';
loadEnvConfig(process.cwd());
async function main(){
  if(!(process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL))throw new Error('Shared Redis URL missing');
  const prefix=`horizonscan:smoke:${randomUUID()}`;
  const store=new Store(new RedisDatabase(),prefix);
  const secondInstance=new Store(new RedisDatabase(),prefix);
  const guest=randomUUID(),id=randomUUID();
  const reservation=await store.reserve(guest,'smoke-ip','smoke-cache',id,DEFAULT_SETTINGS,0.001);
  let duplicateBlocked=false;
  try{await secondInstance.reserve(guest,'smoke-ip','smoke-cache',randomUUID(),DEFAULT_SETTINGS,0.001);}catch(error){duplicateBlocked=error instanceof Error&&error.message.includes('already being scanned');}
  if(!duplicateBlocked)throw new Error('Cross-instance duplicate scan lock failed');
  await store.settle(reservation,true,0.0002,100,50);await store.release(reservation);
  const usage=await store.guestUsage(guest,new Date().toISOString().slice(0,10));
  if(usage.scans!==1||usage.succeeded!==1)throw new Error('Redis reservation did not settle');
  await store.set(`override:${guest}`,{blocked:true});
  let blocked=false;
  try{await secondInstance.reserve(guest,'smoke-ip','new-market',randomUUID(),DEFAULT_SETTINGS,0.001);}catch(error){blocked=error instanceof Error&&error.message.includes('disabled for this guest');}
  if(!blocked)throw new Error('Cross-instance guest block failed');
  console.log('Shared Redis reservation, cross-instance lock, guest block, accounting and release passed.');
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Redis smoke failed');process.exitCode=1;});
