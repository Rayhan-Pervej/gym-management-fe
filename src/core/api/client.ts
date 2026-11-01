import { config } from '@/core/config'
import { useAuthStore } from '@/core/auth/store'
import type { ApiErrorBody, Tokens } from './types'

export class ApiError extends Error {
  status: number
  code: string
  details: Record<string, unknown>

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

type Opts = Omit<RequestInit, 'body'> & {
  body?: unknown
  params?: Record<string, string | number | boolean | undefined | null>
  auth?: boolean
}

let refreshing: Promise<boolean> | null = null

const refreshTokens = (): Promise<boolean> => {
  refreshing ??= (async () => {
    const { refresh, setTokens, clear } = useAuthStore.getState()
    if (!refresh) return false
    try {
      const res = await fetch(`${config.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      if (!res.ok) throw new Error()
      setTokens((await res.json()) as Tokens)
      return true
    } catch {
      clear()
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

const buildUrl = (path: string, params?: Opts['params']) => {
  const url = new URL(config.apiUrl + path)
  Object.entries(params ?? {}).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && url.searchParams.set(k, String(v)))
  return url.toString()
}

const send = (path: string, { body, params, auth = true, headers, ...init }: Opts, lang: string) => {
  const isForm = body instanceof FormData
  const { access: token, branchId } = useAuthStore.getState()
  return fetch(buildUrl(path, params), {
    ...init,
    headers: {
      'Accept-Language': lang,
      ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(auth && branchId ? { 'X-Branch-Id': branchId } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  })
}

export async function request<T>(path: string, opts: Opts = {}): Promise<T> {
  const lang = document.documentElement.lang || 'en'
  let res = await send(path, opts, lang)
  if (res.status === 401 && opts.auth !== false && (await refreshTokens())) res = await send(path, opts, lang)
  if (res.status === 204) return undefined as T
  const isJson = res.headers.get('content-type')?.includes('json')
  const data = isJson ? await res.json() : await res.blob()
  if (!res.ok) {
    const err = (data as ApiErrorBody).error
    if (res.status === 401 && opts.auth !== false) useAuthStore.getState().clear()
    throw new ApiError(res.status, err?.code ?? 'unknown', err?.message ?? res.statusText, err?.details)
  }
  return data as T
}

export const api = {
  get: <T>(path: string, params?: Opts['params'], opts?: Opts) => request<T>(path, { ...opts, params }),
  post: <T>(path: string, body?: unknown, opts?: Opts) => request<T>(path, { ...opts, method: 'POST', body: body ?? {} }),
  put: <T>(path: string, body?: unknown, opts?: Opts) => request<T>(path, { ...opts, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, opts?: Opts) => request<T>(path, { ...opts, method: 'PATCH', body }),
}
