// src/types/index.ts

export type SecretType = 'text' | 'file'

// ── Auth ──────────────────────────────────────────────
export interface RegisterPayload {
  full_name: string        // ← bukan 'name'
  email: string
  password: string
  password_confirm: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    access_token: string
    refresh_token: string
    user: UserProfile
  }
}

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  total_secrets_created: number
  created_at: string
}

// ── Create Secret ─────────────────────────────────────
export interface CreateSecretPayload {
  secret_type: 'text' | 'file'
  encrypted_payload: string
  encryption_iv: string
  encryption_tag: string
  encryption_salt: string
  max_views: number
  expires_in: number
  email_whitelist: string[]
  access_password?: string 
  notify_on_open: boolean
  allow_preview: boolean
  raw_key?: string
}

export interface CreateSecretResponse {
  secret_id: string
  revoke_token: string
  expires_at: string | null
  links: {
    id: string
    token: string
    full_url: string
    label: string
  }[]
}

// ── My Secrets (dashboard) ────────────────────────────
export interface MySecret {
  id: string
  secret_type: 'text' | 'file'
  original_filename: string
  mime_type: string
  file_size_bytes: number | null
  status: 'active' | 'expired' | 'destroyed' | 'revoked'
  max_views: number
  current_views: number
  views_remaining: number
  expires_at: string | null
  created_at: string
  links: MySecretLink[]
  email_whitelist: string[]
  ai_flagged: boolean
  revoke_token: string
}

export interface MySecretLink {
  id: string
  token: string
  label: string
  full_url: string
  is_active: boolean
}


// ── Secret Access (halaman penerima) ──────────────────
export interface SecretMetaResponse {
  token: string
  encryption_salt?: string
  requires_passphrase?: boolean
  expires_at: string | null
  max_views: number
  views_remaining: number
  is_password_protected: boolean
  is_email_restricted: boolean
  allow_preview: boolean
  status: 'active' | 'expired' | 'destroyed'
  // Raw dari Django
  can_access?: boolean
  requires_password?: boolean
  requires_email?: boolean
}

export interface RevealSecretPayload {
  access_password?: string
  email?: string
}

export interface RevealSecretResponse {
  type: SecretType
  encrypted_payload: string
  encryption_iv: string
  encryption_tag: string
  views_remaining: number
}

export interface CreateSecretPayload {
  secret_type: 'text' | 'file'
  encrypted_payload: string
  encryption_iv: string
  encryption_tag: string
  encryption_salt: string
  encryption_mode: 'url-key' | 'passphrase' 
  max_views: number
  expires_in_hours: number
  email_whitelist: string[]
  domain_whitelist: string[] 
  access_password?: string
  notify_on_open: boolean
  allow_preview: boolean
  client_risk_score?: number           // ← tambah
  client_rules_triggered?: string[] 
  // File only
  original_filename?: string
  mime_type?: string
  file_size_bytes?: number
  fingerprint_hash?: string
}

export interface RevealSecretResponse {
  secret_type: 'text' | 'file'
  encrypted_payload: string
  encryption_iv: string
  encryption_tag: string
  encryption_salt: string
  views_remaining: number
  // File only
  original_filename?: string
  mime_type?: string
  file_size_bytes?: number
}

export interface ClientRuleResult {
  rule_name:   string
  triggered:   boolean
  score_delta: number
  severity:    'low' | 'medium' | 'high' | 'critical'
  detail:      string
}
 
export interface ClientDetectionResult {
  risk_score:       number          // 0–100, total accumulated score
  action:           'allowed' | 'flagged' | 'blocked'
  rules_triggered:  string[]        // list nama rule yang trigger
  rule_details:     ClientRuleResult[]
  scanned_at:       string
}
 
export interface ContentToScan {
  text?:          string       // isi teks / password / note
  filename?:      string       // nama file original
  mime_type?:     string       // MIME type file
  file_size?:     number       // ukuran file dalam bytes
  secret_type:    string       // 'text' | 'password' | 'file' | 'note'
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