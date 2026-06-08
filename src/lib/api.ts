/**
 * Low-level API client for the SmartPay Gateway backend.
 * Bearer auth with transparent single-flight access-token refresh on 401.
 *
 * The base URL is baked at build time (VITE_API_BASE_URL); in production it
 * points at https://api-pay.lanari.rw/api, in dev at http://localhost:4000/api.
 */
const BASE = (import.meta as any).env?.VITE_API_BASE_URL || "/api";

const ACCESS_KEY = "smartpay.accessToken";
const REFRESH_KEY = "smartpay.refreshToken";

export const tokenStore = {
  get access(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refresh = tokenStore.refresh;
  if (!refresh) return false;
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    })
      .then(async (res) => {
        if (!res.ok) {
          tokenStore.clear();
          return false;
        }
        const data = await res.json();
        tokenStore.set(data.accessToken, data.refreshToken);
        return true;
      })
      .catch(() => {
        tokenStore.clear();
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Attach bearer token (default true). */
  auth?: boolean;
}

export async function apiRequest<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, headers, ...rest } = opts;

  const doFetch = (): Promise<Response> => {
    const h: Record<string, string> = { ...(headers as Record<string, string>) };
    if (auth && tokenStore.access) h["Authorization"] = `Bearer ${tokenStore.access}`;

    let payload: BodyInit | undefined;
    if (body !== undefined) {
      h["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
    return fetch(`${BASE}${path}`, { ...rest, headers: h, body: payload });
  };

  let res = await doFetch();
  if (res.status === 401 && auth && tokenStore.refresh) {
    if (await tryRefresh()) res = await doFetch();
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let details: unknown;
    try {
      const err = await res.json();
      message = err.error || message;
      details = err.details;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message, details);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Absolute URL for things the browser fetches directly. */
export function apiUrl(path: string): string {
  return `${BASE}${path}`;
}
