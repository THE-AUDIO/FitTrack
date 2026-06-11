const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface FetchOptions extends RequestInit {
  skipAuth?: boolean
}

async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null
  const token = sessionStorage.getItem("access_token")
  return token
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token")
  if (!refreshToken) return null

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return null
    const data = await res.json()
    sessionStorage.setItem("access_token", data.access_token)
    return data.access_token
  } catch {
    return null
  }
}

export async function apiClient<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOpts } = options
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOpts.headers as Record<string, string>),
  }

  if (!skipAuth) {
    let token = await getAccessToken()
    if (!token) {
      token = await refreshAccessToken()
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOpts,
    headers,
  })

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`
      const retryRes = await fetch(`${API_BASE}${path}`, {
        ...fetchOpts,
        headers,
      })
      if (!retryRes.ok) {
        throw new ApiError(await retryRes.text(), retryRes.status)
      }
      return retryRes.json()
    }
    throw new ApiError("Unauthorized", 401)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new ApiError(text, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}
