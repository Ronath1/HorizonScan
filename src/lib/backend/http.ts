import { ServiceError } from './errors';

// Bound time, response size and retries. Never include upstream bodies or keys in errors.
export async function fetchJson(url: string, init: RequestInit, provider: string, timeoutMs: number, parent?: AbortSignal): Promise<unknown> {
  const timeout = AbortSignal.timeout(timeoutMs);
  const signal = parent ? AbortSignal.any([parent, timeout]) : timeout;
  try {
    const res = await fetch(url, { ...init, signal, cache: 'no-store' });
    if (!res.ok) {
      const retry = Number(res.headers.get('retry-after'));
      if (res.status === 429) throw new ServiceError('PROVIDER_RATE_LIMIT', 429, `${provider} is at its usage limit. Please try again later.`, Number.isFinite(retry) && retry > 0 ? Math.min(retry, 86400) : 60);
      if (res.status === 401 || res.status === 403) throw new ServiceError('PROVIDER_AUTH', 503, `${provider} credentials or model access need administrator attention.`);
      if (res.status === 404 && provider === 'Gemini') throw new ServiceError('MODEL_UNAVAILABLE', 503, 'The selected Gemini model is unavailable to this account. Ask the administrator to select another model.');
      if (res.status === 400) throw new ServiceError('PROVIDER_CONFIGURATION', 503, `${provider} rejected the request configuration. Administrator attention is required.`);
      throw new ServiceError('PROVIDER_UNAVAILABLE', 502, `${provider} is temporarily unavailable. Please try again later.`);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error('Missing body');
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 200000) throw new ServiceError('PROVIDER_RESPONSE_SIZE', 502, `${provider} returned an unexpectedly large response.`);
        chunks.push(value);
      }
    } finally { await reader.cancel().catch(() => {}); }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    if (signal.aborted) throw new ServiceError('PROVIDER_TIMEOUT', 504, `${provider} did not finish in time. Please try again later.`);
    throw new ServiceError('PROVIDER_UNAVAILABLE', 502, `${provider} returned an unreadable response or could not be reached.`);
  }
}
