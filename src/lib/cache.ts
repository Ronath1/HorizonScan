import { ScanResponseData } from '@/types/pestle';

interface CacheEntry {
  data: ScanResponseData;
  expiresAt: number;
  createdAt: number;
}

// 24 hour TTL in milliseconds
const TTL_MS = 24 * 60 * 60 * 1000;

// Global memory cache across requests in the Node process
const memoryCache = new Map<string, CacheEntry>();

export function getCacheKey(industry: string, targetCountry: string): string {
  const normIndustry = industry.trim().toLowerCase().replace(/\s+/g, '_');
  const normCountry = targetCountry.trim().toLowerCase().replace(/\s+/g, '_');
  return `${normIndustry}_${normCountry}`;
}

export function getFromCache(industry: string, targetCountry: string): ScanResponseData | null {
  const key = getCacheKey(industry, targetCountry);
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return {
    ...entry.data,
    cached: true,
    cached_at: new Date(entry.createdAt).toISOString(),
  };
}

export function setInCache(industry: string, targetCountry: string, data: ScanResponseData): void {
  const key = getCacheKey(industry, targetCountry);
  const now = Date.now();
  memoryCache.set(key, {
    data,
    createdAt: now,
    expiresAt: now + TTL_MS,
  });
}

export function clearCache(): void {
  memoryCache.clear();
}
