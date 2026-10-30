/**
 * DukaanMate — Backend API helper
 * All calls to FastAPI backend go through this helper.
 * It automatically attaches the Supabase JWT so the backend can verify ownership.
 */
import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Make an authenticated request to the FastAPI backend.
 * Automatically adds the Authorization header with the Supabase JWT.
 */
async function apiFetch(path, options = {}) {
  // Get the current session token
  let token = null
  try {
    const { data: { session } } = await supabase.auth.getSession()
    token = session?.access_token
  } catch {}

  // If in demo mode and no real token, use demo-token
  if (!token && localStorage.getItem('dukaanmate_is_demo') === 'true') {
    token = 'demo-token'
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  // Handle non-JSON responses gracefully
  let data
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = { detail: await response.text() }
  }

  if (!response.ok) {
    // Throw a clean error message (backend sends generic messages to users)
    throw new Error(data.detail || 'Something went wrong. Please try again.')
  }

  return data
}

// ── Convenience methods ──────────────────────────────────────────────────────
export const api = {
  get:    (path)         => apiFetch(path, { method: 'GET' }),
  post:   (path, body)   => apiFetch(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:    (path, body)   => apiFetch(path, { method: 'PUT',   body: JSON.stringify(body) }),
  delete: (path)         => apiFetch(path, { method: 'DELETE' }),
  patch:  (path, body)   => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
}

