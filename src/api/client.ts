import axios, { AxiosError } from 'axios'

export const TOKEN_KEY = 'cpc_token'
export const ORG_KEY = 'cpc_officer_org'

const baseURL = `${(import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')}/api`

export const api = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
  timeout: 70000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`

  const orgId = localStorage.getItem(ORG_KEY)
  if (orgId) config.headers['X-Organization-Id'] = orgId

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Token expired or revoked: send the user back to the login page.
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event('cpc:unauthorized'))
    }
    return Promise.reject(error)
  },
)

/** Turns any API error into one friendly sentence. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Cannot reach the server. Check your internet connection — the server may also be waking up, so try again in a few seconds.'
    }

    const data = error.response.data as { message?: string; errors?: Record<string, string[]> } | undefined
    const firstFieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined

    if (firstFieldError) return firstFieldError
    if (error.response.status === 429) return 'Too many attempts. Please wait a minute and try again.'
    if (data?.message) return data.message
  }

  return fallback
}

/** Field-level validation errors (422) keyed by field name. */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (axios.isAxiosError(error) && error.response?.status === 422) {
    const errors = (error.response.data as { errors?: Record<string, string[]> })?.errors ?? {}
    return Object.fromEntries(Object.entries(errors).map(([key, messages]) => [key, messages[0]]))
  }
  return {}
}

/** Downloads a CSV (or any file) from an authenticated endpoint. */
export async function downloadFile(path: string, fallbackName: string) {
  const response = await api.get(path, { responseType: 'blob' })
  const disposition = String(response.headers['content-disposition'] ?? '')
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
  const filename = match ? decodeURIComponent(match[1]) : fallbackName

  const url = URL.createObjectURL(response.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
