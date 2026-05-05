// src/lib/api.ts

import axios from 'axios'
import type {
  CreateSecretPayload,
  CreateSecretResponse,
  RevealSecretPayload,
  RevealSecretResponse,
  SecretMetaResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  UserProfile,
  MySecret,
} from '../types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Inject JWT token ke setiap request otomatis
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto refresh token kalau 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (
      original.url?.includes('/auth/refresh/') ||
      original.url?.includes('/auth/login/')
    ) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) return Promise.reject(error)

        const { data } = await api.post('/auth/refresh/', { refresh })
        // Cek format response refresh — sesuaikan jika perlu
        const newAccess = data.access ?? data.data?.access_token
        localStorage.setItem('access_token', newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────
export const register = async (payload: RegisterPayload): Promise<void> => {
  await api.post('/auth/register/', payload)
}

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const { data } = await api.post('/auth/login/', payload)
  localStorage.setItem('access_token', data.data.access_token)
  localStorage.setItem('refresh_token', data.data.refresh_token)
  return data
}

export const logout = async (): Promise<void> => {
  try {
    const refresh = localStorage.getItem('refresh_token')
    await api.post('/auth/logout/', {
      refresh_token: refresh
    })
  } catch {
    // Tetap lanjut clear local meski request gagal
  } finally {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('sd_anon')
    localStorage.removeItem('sv_quota_cache')
    sessionStorage.clear()
  }
}

export const getProfile = async (): Promise<UserProfile> => {
  const { data } = await api.get('/auth/me/')
  // Cek apakah response dibungkus 'data' atau langsung
  return data.data ?? data
}

// ── Secrets ───────────────────────────────────────────
export const createSecret = async (
  payload: CreateSecretPayload
): Promise<CreateSecretResponse> => {
  const { data } = await api.post('/secrets/', payload)
  return data.data
}

export const getMySecrets = async (): Promise<MySecret[]> => {
  const { data } = await api.get('/secrets/my/')
  return data.data?.secrets ?? data.data ?? data
}

export const revokeSecret = async (secretId: string): Promise<void> => {
  await api.delete(`/secrets/${secretId}/revoke/`, {
    data: { confirm: true }   // ← Django butuh ini
  })
}

// ── Secret Access (halaman penerima) ──────────────────
// GET → ambil info link (perlu password? perlu email?)
export const getSecretInfo = async (token: string): Promise<SecretMetaResponse> => {
  const { data } = await api.get(`/s/${token}/`)
  return data.data ?? data
}

export const revealSecret = async (
  token: string,
  payload: RevealSecretPayload
): Promise<RevealSecretResponse> => {
  const { data } = await api.post(`/s/${token}/`, payload)
  return data.data ?? data
}

export const deleteSecret = async (secretId: string): Promise<void> => {
  await api.delete(`/secrets/${secretId}/delete/`)
}

export interface QuotaStatus {
  user_type: 'anonymous' | 'registered'
  max_per_day: number | null
  used_today: number
  remaining: number | null
  resets_at: string | null
  max_file_size_mb: number
  max_recipients: number
  max_expiry_days: number
}

const QUOTA_CACHE_KEY = 'sv_quota_cache'
const QUOTA_CACHE_TTL = 60 * 1000  // 5 menit
 
export async function fetchQuotaStatus(
  fingerprintHash?: string
): Promise<QuotaStatus | null> {
  // Selalu fresh, hapus cache dulu
  try { localStorage.removeItem(QUOTA_CACHE_KEY) } catch {}

  try {
    const headers: Record<string, string> = {}
    const token = localStorage.getItem('access_token')
    if (!token && fingerprintHash) {
      headers['X-Fingerprint-Hash'] = fingerprintHash
    }

    const { data } = await api.get('/config/quota-status/', { headers })
    
    // Response langsung tanpa wrapper data.data
    const quota: QuotaStatus = data.data ?? data
    
    // Simpan ke cache
    localStorage.setItem(QUOTA_CACHE_KEY, JSON.stringify({
      data: quota,
      ts: Date.now()
    }))

    return quota
  } catch {
    return null
  }
}

// Invalidate cache setelah berhasil buat secret
export function invalidateQuotaCache() {
  localStorage.removeItem(QUOTA_CACHE_KEY)
}


export default api