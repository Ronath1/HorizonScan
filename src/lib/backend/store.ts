import { Redis } from '@upstash/redis';
import { DEFAULT_SETTINGS, Settings, SETTINGS_SCHEMA } from './config';
import { ServiceError } from './errors';

// Atomic operations are deliberately not retried: a lost HTTP response may have
// committed its reservation. Retaining that reservation is safer than double spend.
export const RESERVE = `
local override = cjson.decode(redis.call('GET', KEYS[4]) or '{}')
if override.blocked then return 'BLOCKED' end
local guestLimit = tonumber(override.daily_limit or ARGV[1])
if tonumber(redis.call('HGET',KEYS[2],'scans') or 0) >= guestLimit then return 'GUEST_LIMIT' end
if tonumber(redis.call('GET',KEYS[3]) or 0) >= tonumber(ARGV[2]) then return 'IP_LIMIT' end
if tonumber(redis.call('HGET',KEYS[1],'scans') or 0) >= tonumber(ARGV[3]) then return 'GLOBAL_LIMIT' end
if tonumber(redis.call('HGET',KEYS[1],'reserved_usd') or 0)+tonumber(ARGV[4]) > tonumber(ARGV[5]) then return 'BUDGET_LIMIT' end
if redis.call('EXISTS',KEYS[5]) == 1 then return 'IN_PROGRESS' end
redis.call('SET',KEYS[5],ARGV[6],'EX',90)
redis.call('SET',KEYS[6],ARGV[4],'EX',259200)
redis.call('HINCRBY',KEYS[1],'scans',1)
redis.call('HINCRBYFLOAT',KEYS[1],'reserved_usd',ARGV[4])
redis.call('HINCRBY',KEYS[2],'scans',1)
redis.call('INCR',KEYS[3])
for i=1,3 do redis.call('EXPIRE',KEYS[i],259200) end
redis.call('ZADD',KEYS[7],ARGV[7],ARGV[8])
redis.call('ZREMRANGEBYSCORE',KEYS[7],'-inf',tonumber(ARGV[7])-2592000)
return 'OK'`;
const THROTTLE = `local n=redis.call('INCR',KEYS[1]); redis.call('EXPIRE',KEYS[1],120); return n`;
const SETTLE = `
local reserved=redis.call('GET',KEYS[3]); if not reserved then return 0 end
redis.call('DEL',KEYS[3])
if tonumber(ARGV[1]) >= 0 then
 redis.call('HINCRBYFLOAT',KEYS[1],'reserved_usd',tonumber(ARGV[1])-tonumber(reserved))
 redis.call('HINCRBYFLOAT',KEYS[1],'actual_usd',ARGV[1])
 redis.call('HINCRBYFLOAT',KEYS[2],'actual_usd',ARGV[1])
end
for i=1,2 do
 redis.call('HINCRBY',KEYS[i],ARGV[2],1)
 redis.call('HINCRBY',KEYS[i],'input_tokens',ARGV[3])
 redis.call('HINCRBY',KEYS[i],'output_tokens',ARGV[4])
 redis.call('EXPIRE',KEYS[i],259200)
end
return 1`;
const RELEASE = `if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0`;

interface Database {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttl: number): Promise<void>;
  hash(key: string): Promise<Record<string, number>>;
  recent(key: string): Promise<string[]>;
  eval<T>(script: string, keys: string[], args: (string | number)[]): Promise<T>;
}

export class RedisDatabase implements Database {
  private redis = new Redis({ url: (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)!, token: (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)!,
    retry: false, signal: () => AbortSignal.timeout(4000), enableAutoPipelining: false });
  get<T>(key: string) { return this.redis.get<T>(key); }
  async set(key: string, value: unknown, ttl: number) { if(ttl>0)await this.redis.set(key,value,{ex:ttl});else await this.redis.set(key,value); }
  async hash(key: string) { return (await this.redis.hgetall<Record<string, number>>(key)) || {}; }
  recent(key: string) { return this.redis.zrange<string[]>(key, 0, 49, { rev: true }); }
  async eval<T>(script: string, keys: string[], args: (string | number)[]) { return await this.redis.eval(script, keys, args) as T; }
}

// Only for development and deterministic tests. Production never falls back here.
export class MemoryDatabase implements Database {
  private entries = new Map<string, { value: unknown; expires: number }>();
  async get<T>(key: string): Promise<T | null> {
    const e = this.entries.get(key);
    if (!e || e.expires <= Date.now()) { this.entries.delete(key); return null; }
    return structuredClone(e.value) as T;
  }
  async set(key: string, value: unknown, ttl: number) { this.entries.set(key, { value: structuredClone(value), expires: ttl>0?Date.now()+ttl*1000:Infinity }); }
  async hash(key: string) { return (await this.get<Record<string, number>>(key)) || {}; }
  async recent(key: string) { return Object.entries((await this.get<Record<string, number>>(key)) || {}).sort((a,b) => b[1]-a[1]).slice(0,50).map(([id]) => id); }
  // One synchronous transaction, just as Lua executes without interleaving in Redis.
  async eval<T>(script: string, k: string[], a: (string | number)[]): Promise<T> {
    const read = (key: string) => {
      const e = this.entries.get(key); return e && e.expires > Date.now() ? e.value : null;
    };
    const put = (key: string, value: unknown, ttl = 259200) => { this.entries.set(key, { value, expires: Date.now()+ttl*1000 }); };
    let result: unknown;
    if (script === THROTTLE) { result = Number(read(k[0]) || 0)+1; put(k[0],result,120); }
    else if (script === RELEASE) { result = read(k[0]) === a[0] ? Number(this.entries.delete(k[0])) : 0; }
    else if (script === RESERVE) {
      const global = (read(k[0]) || {}) as Record<string,number>;
      const guest = (read(k[1]) || {}) as Record<string,number>;
      const override = (read(k[3]) || {}) as GuestOverride;
      result = override.blocked ? 'BLOCKED' : (guest.scans || 0) >= (override.daily_limit ?? Number(a[0])) ? 'GUEST_LIMIT'
        : Number(read(k[2]) || 0) >= Number(a[1]) ? 'IP_LIMIT' : (global.scans || 0) >= Number(a[2]) ? 'GLOBAL_LIMIT'
        : (global.reserved_usd || 0)+Number(a[3]) > Number(a[4]) ? 'BUDGET_LIMIT' : read(k[4]) ? 'IN_PROGRESS' : 'OK';
      if (result === 'OK') {
        global.scans = (global.scans || 0)+1; global.reserved_usd = (global.reserved_usd || 0)+Number(a[3]);
        guest.scans = (guest.scans || 0)+1;
        put(k[0],global); put(k[1],guest); put(k[2],Number(read(k[2]) || 0)+1);
        put(k[4],a[5],90); put(k[5],Number(a[3]));
        const recent = (read(k[6]) || {}) as Record<string,number>; recent[String(a[7])] = Number(a[6]);
        for (const id of Object.keys(recent)) if (recent[id] < Number(a[6])-2592000) delete recent[id];
        put(k[6],recent,2678400);
      }
    } else if (script === SETTLE) {
      const reserved = read(k[2]); result = reserved === null ? 0 : 1;
      if (reserved !== null) {
        this.entries.delete(k[2]);
        for (let i=0;i<2;i++) {
          const h = (read(k[i]) || {}) as Record<string,number>;
          if (Number(a[0]) >= 0) { h.actual_usd = (h.actual_usd || 0)+Number(a[0]); if (!i) h.reserved_usd = (h.reserved_usd || 0)+Number(a[0])-Number(reserved); }
          h[String(a[1])] = (h[String(a[1])] || 0)+1;
          h.input_tokens = (h.input_tokens || 0)+Number(a[2]); h.output_tokens = (h.output_tokens || 0)+Number(a[3]); put(k[i],h);
        }
      }
    } else throw new Error('Unknown memory transaction');
    return result as T;
  }
}

export type GuestOverride = { daily_limit?: number; blocked?: boolean };
export type Reservation = { id: string; guest: string; day: string; lock: string };
export class Store {
  constructor(private db: Database, private prefix = 'horizonscan:local') {}
  key(key: string) { return `${this.prefix}:${key}`; }
  async get<T>(key: string) { try { return await this.db.get<T>(this.key(key)); } catch { throw new ServiceError('STORAGE_UNAVAILABLE',503,'Shared storage is unavailable. Scanning is paused to protect spending.'); } }
  async set(key: string, value: unknown, ttl = 0) { try { await this.db.set(this.key(key),value,ttl); } catch { throw new ServiceError('STORAGE_UNAVAILABLE',503,'Shared storage is unavailable. Changes were not confirmed.'); } }
  async settings() { return SETTINGS_SCHEMA.parse((await this.get<Settings>('settings')) || DEFAULT_SETTINGS); }
  async guestUsage(id: string, day: string) {
    try { return await this.db.hash(this.key(`guest:${id}:${day}`)); }
    catch { throw new ServiceError('STORAGE_UNAVAILABLE',503,'Usage storage is unavailable.'); }
  }
  async throttle(id: string, limit: number, now = new Date()) {
    const count = await this.run<number>(THROTTLE,[`throttle:${id}:${Math.floor(now.getTime()/60000)}`],[]);
    if (count > limit) throw new ServiceError('RATE_LIMIT',429,'Too many requests. Please wait a minute.',60);
  }
  private async run<T>(script: string, keys: string[], args: (string | number)[]) {
    try { return await this.db.eval<T>(script, keys.map(k => this.key(k)),args); }
    catch { throw new ServiceError('STORAGE_UNAVAILABLE',503,'Shared storage is unavailable. Scanning is paused to protect spending.'); }
  }
  async reserve(guest: string, ip: string, cache: string, id: string, settings: Settings, maximumCost: number, now = new Date()): Promise<Reservation> {
    const day = now.toISOString().slice(0,10), lock = `lock:${cache}`;
    const result = await this.run<string>(RESERVE,[`day:${day}`,`guest:${guest}:${day}`,`ip:${ip}:${day}`,`override:${guest}`,lock,`reservation:${id}`,'guests'],
      [settings.guest_daily_limit,settings.ip_daily_limit,settings.global_daily_limit,maximumCost,settings.daily_budget_usd,id,Math.floor(now.getTime()/1000),guest]);
    if (result !== 'OK') {
      const messages: Record<string,string> = { BLOCKED:'Scanning is disabled for this guest.',GUEST_LIMIT:'Your daily guest scan allowance has been used.',IP_LIMIT:'The daily scan allowance for this network has been used.',GLOBAL_LIMIT:'The site’s daily scan allowance has been used.',BUDGET_LIMIT:'The site’s daily research budget has been reached.',IN_PROGRESS:'This market is already being scanned. Please retry shortly.' };
      const seconds = result === 'IN_PROGRESS' ? 15 : Math.ceil((Date.parse(`${day}T00:00:00Z`)+86400000-now.getTime())/1000);
      throw new ServiceError(result,result === 'BLOCKED' ? 403 : result === 'IN_PROGRESS' ? 409 : 429,messages[result] || 'Scanning unavailable.',seconds);
    }
    return { id,guest,day,lock };
  }
  async settle(r: Reservation, success: boolean, cost: number | null, input = 0, output = 0) {
    await this.run(SETTLE,[`day:${r.day}`,`guest:${r.guest}:${r.day}`,`reservation:${r.id}`],[cost ?? -1,success ? 'succeeded' : 'failed',input,output]);
  }
  async release(r: Reservation) { await this.run(RELEASE,[r.lock],[r.id]); }
  async overview(now = new Date()) {
    const day = now.toISOString().slice(0,10);
    try {
      const [totals, ids] = await Promise.all([this.db.hash(this.key(`day:${day}`)),this.db.recent(this.key('guests'))]);
      const guests = await Promise.all(ids.map(async id => ({ id,usage: await this.db.hash(this.key(`guest:${id}:${day}`)),override: await this.get<GuestOverride>(`override:${id}`) || {} })));
      return { day,totals,guests };
    } catch { throw new ServiceError('STORAGE_UNAVAILABLE',503,'Usage storage is unavailable.'); }
  }
}
let store: Store | undefined;
export function getStore() {
  if (store) return store;
  const shared = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) && (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN);
  if (!shared && process.env.NODE_ENV === 'production') throw new ServiceError('STORAGE_NOT_CONFIGURED',503,'Shared storage must be configured before public scanning.');
  store = new Store(shared ? new RedisDatabase() : new MemoryDatabase(),`horizonscan:${process.env.VERCEL_ENV || 'local'}`);
  return store;
}
