// src/lib/fingerprint.ts

// Generate fingerprint hash dari browser info
// SHA-256 dari kombinasi user-agent + bahasa + timezone
export async function getFingerprint(): Promise<string> {
  const raw = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen.width + 'x' + screen.height,
    navigator.hardwareConcurrency ?? '',
  ].join('|')

  const encoder = new TextEncoder()
  const data = encoder.encode(raw)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Simpan & ambil anonymous session info dari localStorage
const ANON_KEY = 'sd_anon'

interface AnonSession {
  fingerprint: string
  count: number       // jumlah secret dibuat hari ini
  date: string        // format YYYY-MM-DD
}

export function getAnonSession(): AnonSession | null {
  try {
    const raw = localStorage.getItem(ANON_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AnonSession
    // Reset jika sudah hari baru
    const today = new Date().toISOString().split('T')[0]
    if (session.date !== today) {
      session.count = 0
      session.date = today
      localStorage.setItem(ANON_KEY, JSON.stringify(session))
    }
    return session
  } catch {
    return null
  }
}

export function incrementAnonCount(fingerprint: string): void {
  const today = new Date().toISOString().split('T')[0]
  const current = getAnonSession()
  const updated: AnonSession = {
    fingerprint,
    count: (current?.count ?? 0) + 1,
    date: today,
  }
  localStorage.setItem(ANON_KEY, JSON.stringify(updated))
}

export function getAnonRemainingQuota(): number {
  const session = getAnonSession()
  if (!session) return 3
  return Math.max(0, 3 - session.count)
}