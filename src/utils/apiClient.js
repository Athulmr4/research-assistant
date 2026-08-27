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
export function createApiClient({ retries = 1, timeoutMs = 30000 } = {}) {
  async function request(url, { method = 'GET', headers = {}, body, signal } = {}) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      // Merge external signal if provided
      if (signal) signal.addEventListener('abort', () => controller.abort());

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
          const msg = errBody?.error?.message || errBody?.error || `API error: ${res.status}`;
          throw new ApiError(msg, res.status);
        }
        return await res.json();
      } catch (err) {
        clearTimeout(timeout);
        lastErr = err;
        // Don't retry on 4xx client errors (bad key, etc.)
        if (err instanceof ApiError && err.status >= 400 && err.status < 500) throw err;
        if (attempt === retries) throw err;
        // Exponential backoff: 500ms, 1000ms
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
    throw lastErr;
  }

  return { request };
}

// Singleton default client (reused across providers)
export const apiClient = createApiClient({ retries: 1, timeoutMs: 30000 });
