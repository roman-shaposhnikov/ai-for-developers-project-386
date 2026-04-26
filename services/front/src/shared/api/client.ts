import createClient from 'openapi-fetch';
import type { paths } from './schema';
import { env } from '../config/env';

export const api = createClient<paths>({
  baseUrl: env.apiBaseUrl,
  // Defer to current globalThis.fetch so tests can stub it after this module loads.
  fetch: (input, init) => globalThis.fetch(input, init),
});

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type ErrorBody = { error?: { code?: string; message?: string } };

interface FetchResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/**
 * Throws on missing data, returning the typed body otherwise. Unifies the
 * shape across endpoints whether or not the contract declares error responses.
 */
export function unwrap<T>(result: FetchResult<T>): T {
  if (result.data !== undefined) return result.data;
  const body = result.error as ErrorBody | undefined;
  const err = body?.error;
  throw new ApiError(
    result.response.status,
    err?.message ?? `Request failed (${result.response.status})`,
    err?.code,
  );
}

/** Throws on a non-2xx response with no body (e.g. 204). */
export function unwrapVoid(result: { error?: unknown; response: Response }): void {
  if (result.response.ok) return;
  const body = result.error as ErrorBody | undefined;
  const err = body?.error;
  throw new ApiError(
    result.response.status,
    err?.message ?? `Request failed (${result.response.status})`,
    err?.code,
  );
}
