/**
 * apiClient.js — Generic REST client (Factory pattern) for free + paid LLM providers.
 * Demonstrates: REST API integration, retry, timeout via AbortController, typed errors.
 */

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Factory: returns a client with .request(url, options) that handles retry/timeout.
 * @param {{ retries?: number, timeoutMs?: number }} config
 */
export function createApiClient({ retries = 1, timeoutMs = 60000 } = {}) {
  async function request(url, { method = 'GET', headers = {}, body, signal } = {}) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort('timeout'), timeoutMs);
      // Merge external signal if provided
      if (signal) signal.addEventListener('abort', () => controller.abort(signal.reason));

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', ...headers },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          const msg = errBody?.error?.message || errBody?.error?.message || errBody?.error || errBody?.message || `API error: ${res.status}`;
          console.error(`[apiClient] ${res.status} ${url}`, msg, errBody);
          throw new ApiError(msg, res.status);
        }
        return await res.json();
      } catch (err) {
        clearTimeout(timeout);
        // Normalize AbortError (timeout) — give actionable message
        if (err.name === 'AbortError') {
          const isTimeout = controller.signal.reason === 'timeout' || err.message.includes('aborted');
          if (isTimeout) {
            err = new ApiError(`Request timed out after ${timeoutMs / 1000}s — Gemini free tier can be slow with large PDFs. Try a smaller PDF or retry.`, 408);
          } else {
            err = new ApiError(`Signal aborted: ${err.message || 'without reason'}`, 499);
          }
        }
        lastErr = err;
        // Don't retry on 4xx client errors (bad key, etc.) or 408 timeout fallback will be handled by caller
        if (err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 408) throw err;
        if (attempt === retries) throw err;
        // Exponential backoff: 500ms, 1000ms
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
    throw lastErr;
  }

  return { request };
}

// Singleton default client (reused across providers) — 60s for free Gemini with 15k PDF
export const apiClient = createApiClient({ retries: 1, timeoutMs: 60000 });
