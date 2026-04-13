'use client'

import { useEffect, useState } from 'react'
import { Lock, FileText, File, Check, Copy, Share2, Eye, Bell, Link } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import EmailWhitelist from '../../components/forms/EmailWhitelist'
import { createSecret } from '../../lib/api'
import type { CreateSecretPayload, CreateSecretResponse } from '../../types'
import { getFingerprint, getAnonSession, incrementAnonCount, getAnonRemainingQuota } from '../../lib/fingerprint'



type Tab = 'text' | 'file'
const VIEW_OPTIONS = [
  { label: '1 view (burn after reading)', value: 1 },
  { label: '3 views', value: 3 },
  { label: '5 views', value: 5 },
  { label: 'Unlimited', value: 9999 },
]

const EXPIRE_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '24 hours', value: 24 },
  { label: '7 days', value: 168 },
  { label: '30 days', value: 720 },
]



// ── Web Crypto helpers ─────────────────────────────────────────────────────

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  // Gunakan standard base64, bukan URL-safe
  // Pastikan padding benar
  return btoa(binary)
}



// ── Component ──────────────────────────────────────────────────────────────

export default function CreateForm() {
  const [tab, setTab] = useState<Tab>('text')
  const [content, setContent] = useState('')
  const [maxViews, setMaxViews] = useState(1)
  const [expiresInHours, setExpiresInHours] = useState(24)
  const [emails, setEmails] = useState<string[]>([])
  const [password, setPassword] = useState('')
  const [notifyOnOpen, setNotifyOnOpen] = useState(true)
  const [allowPreview, setAllowPreview] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CreateSecretResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [encryptedKey, setEncryptedKey] = useState('')
  const [encryptionPassword, setEncryptionPassword] = useState('')  // untuk enkripsi
  const [accessPassword, setAccessPassword] = useState('')          // untuk proteksi link
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [anonQuota, setAnonQuota] = useState(3)
  
  const handleSubmit = async () => {
    if (tab === 'text' && !content.trim()) { setError('Secret tidak boleh kosong'); return }
    if (tab === 'file' && !selectedFile) { setError('Pilih file terlebih dahulu'); return }
    if (!isLoggedIn && anonQuota <= 0) {
      setError('Kamu sudah mencapai batas 3 secret per hari. Login untuk membuat lebih banyak.')
      return
    }

    setError('')
    setLoading(true)

    try {
      // Step 1 — Generate fingerprint DULU sebelum enkripsi
      let fingerprintHash: string | undefined
      if (!isLoggedIn) {
        fingerprintHash = await getFingerprint()
      }

      // Step 2 — Enkripsi konten
      let encResult: {
        encrypted_payload: string
        encryption_iv: string
        encryption_tag: string
        encryption_salt: string
        raw_key_b64: string
      }
      let extraFields: Record<string, unknown> = {}

      if (tab === 'file' && selectedFile) {
        const { encryptFile } = await import('../../lib/encryptFile')
        const enc = await encryptFile(selectedFile, encryptionPassword || undefined)
        encResult = enc
        extraFields = {
          original_filename: enc.original_filename,
          mime_type: enc.mime_type,
          file_size_bytes: enc.file_size_bytes,
        }
      } else {
        const { encryptSecret } = await import('../../lib/encryptText')
        encResult = await encryptSecret(content, encryptionPassword || undefined)
      }

      setEncryptedKey(encResult.raw_key_b64)

      // Step 3 — Kirim ke API
      const payload = {
        secret_type: tab,
        encrypted_payload: encResult.encrypted_payload,
        encryption_iv: encResult.encryption_iv,
        encryption_tag: encResult.encryption_tag,
        encryption_salt: encResult.encryption_salt,
        max_views: maxViews,
        expires_in_hours: expiresInHours,
        email_whitelist: emails,
        notify_on_open: notifyOnOpen,
        allow_preview: allowPreview,
        ...(accessPassword ? { access_password: accessPassword } : {}),
        ...(fingerprintHash ? { fingerprint_hash: fingerprintHash } : {}),
        ...extraFields,
      }

      
      const res = await createSecret(payload as CreateSecretPayload)

      // Step 4 — Update quota anonymous
      if (!isLoggedIn && fingerprintHash) {
        incrementAnonCount(fingerprintHash)
        setAnonQuota(prev => Math.max(0, prev - 1))
      }

      setResult(res)

    } catch (e: any) {
      const data = e?.response?.data
      if (data?.errors) {
        const firstError = Object.values(data.errors)[0]
        setError(Array.isArray(firstError) ? firstError[0] as string : String(firstError))
      } else {
        setError(data?.message || 'Terjadi kesalahan, coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  const getFullLink = () => {
  const token = result?.links[0]?.token
  // encodeURIComponent supaya karakter +/= aman di URL
  const safeKey = encodeURIComponent(encryptedKey)
  return `${window.location.origin}/s/${token}#key=${safeKey}`
}

useEffect(() => {
  const token = localStorage.getItem('access_token')
  setIsLoggedIn(!!token)
  if (!token) {
    setAnonQuota(getAnonRemainingQuota())
  }
}, [])

const handleCopy = () => {
  navigator.clipboard.writeText(getFullLink())
  setCopied(true)
  setTimeout(() => setCopied(false), 2500)
}

  const handleReset = () => {
    setResult(null)
    setContent('')
    setEmails([])
    setEncryptionPassword('')
    setAccessPassword('')
    setPassword('')
    setCopied(false)
  }

  const selectClass =
    'w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-[#1d9e75] focus:ring-1 focus:ring-[#1d9e75] transition-all'

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-7 shadow-sm">

      {/* ANONYMOUS QUOTA BANNER */}
{!isLoggedIn && (
  <div className={`flex items-start gap-3 p-3.5 rounded-xl mb-5 border ${
    anonQuota === 0
      ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40'
      : anonQuota === 1
      ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40'
      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800'
  }`}>
    <div className="flex-1">
      <p className={`text-xs font-semibold mb-0.5 ${
        anonQuota === 0 ? 'text-red-600' : anonQuota === 1 ? 'text-amber-600' : 'text-gray-500'
      }`}>
        {anonQuota === 0
          ? 'Daily limit reached'
          : `${anonQuota} free secret${anonQuota !== 1 ? 's' : ''} remaining today`}
      </p>
      <p className="text-xs text-gray-400">
        {anonQuota === 0
          ? 'Login or sign up to create unlimited secrets.'
          : 'Anonymous users can create 3 secrets per day.'}
      </p>
    </div>
    <Link href="/login">
      <button className="text-xs font-medium text-[#0f6e56] hover:underline whitespace-nowrap">
        {anonQuota === 0 ? 'Login now →' : 'Login for more →'}
      </button>
    </Link>
  </div>
)}

      {/* TABS */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
        {([
          { key: 'text', label: 'Text / Secret', icon: FileText },
          { key: 'file', label: 'File / Data', icon: File },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 text-sm py-2 rounded-lg font-medium transition-all ${
              tab === key
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* CONTENT INPUT */}
      {tab === 'file' ? (
  <div className="mb-5">
    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 tracking-wide">
      Upload file
    </label>
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) setSelectedFile(file)
      }}
      onClick={() => document.getElementById('file-input')?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
        dragOver
          ? 'border-[#1d9e75] bg-[#e1f5ee]/30'
          : selectedFile
          ? 'border-[#1d9e75] bg-[#e1f5ee]/10'
          : 'border-gray-200 dark:border-gray-700 hover:border-[#1d9e75] hover:bg-[#e1f5ee]/10'
      }`}
    >
      <input
        id="file-input"
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) setSelectedFile(file)
        }}
      />
      {selectedFile ? (
        <div>
          <div className="w-10 h-10 rounded-xl bg-[#e1f5ee] dark:bg-[#0f3d30] flex items-center justify-center mx-auto mb-3">
            <File size={18} className="text-[#0f6e56]" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {selectedFile.name}
          </p>
          <p className="text-xs text-gray-400">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · {selectedFile.type || 'unknown type'}
          </p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
            className="mt-3 text-xs text-red-400 hover:text-red-600 underline"
          >
            Remove file
          </button>
        </div>
      ) : (
        <div>
          <File size={24} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">
            <span className="text-[#0f6e56] font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-400 mt-1">Any format — max 50MB</p>
        </div>
      )}
    </div>
  </div>
) : 
  // ... text textarea
      (
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 tracking-wide">
            Your secret message
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your password, API key, private note, or any confidential text here..."
            rows={5}
            className="w-full text-sm px-3.5 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-[#1d9e75] focus:ring-1 focus:ring-[#1d9e75] transition-all resize-none"
          />
        </div>
      ) }

      {/* DIVIDER */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
        <span className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">
          Security Options
        </span>
        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
      </div>

      {/* OPTIONS GRID */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5">
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Allowed views
          </label>
          <select value={maxViews} onChange={(e) => setMaxViews(Number(e.target.value))} className={selectClass}>
            {VIEW_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5">
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Link expires in
          </label>
          <select value={expiresInHours} onChange={(e) => setExpiresInHours(Number(e.target.value))} className={selectClass}>
            {EXPIRE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* EMAIL WHITELIST */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5 mb-4">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Email whitelist <span className="normal-case font-normal">(optional)</span>
        </label>
        <EmailWhitelist 
          emails={emails} 
          onChange={(newEmails) => {
            setEmails(newEmails)
          }} 
        />
      </div>

      {/* ENCRYPTION PASSWORD */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5 mb-4">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
          Encryption passphrase <span className="normal-case font-normal">(optional)</span>
        </label>
        <p className="text-[10px] text-gray-400 mb-2">Used to derive the encryption key. Share this with recipient separately.</p>
        <Input
          type="password"
          value={encryptionPassword}
          onChange={(e) => setEncryptionPassword(e.target.value)}
          placeholder="Passphrase untuk enkripsi konten"
        />
      </div>

      {/* ACCESS PASSWORD */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5 mb-4">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
          Link password <span className="normal-case font-normal">(optional)</span>
        </label>
        <p className="text-[10px] text-gray-400 mb-2">Recipient must enter this password to reveal the secret.</p>
        <Input
          type="password"
          value={accessPassword}
          onChange={(e) => setAccessPassword(e.target.value)}
          placeholder="Password untuk buka link"
        />
      </div>

      {/* TOGGLES */}
      <div className="space-y-3 mb-6">
        {[
          { icon: Eye, label: 'Allow recipient to preview metadata before revealing', value: allowPreview, onChange: setAllowPreview },
          { icon: Bell, label: 'Notify me by email when secret is opened', value: notifyOnOpen, onChange: setNotifyOnOpen },
        ].map(({ icon: Icon, label, value, onChange }) => (
          <label key={label} className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex-shrink-0">
              <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
              <div className={`w-8 rounded-full transition-colors ${value ? 'bg-[#1d9e75]' : 'bg-gray-300 dark:bg-gray-600'}`} style={{ height: '18px' }}>
                <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
              <Icon size={13} className="inline mr-1.5 opacity-60" />
              {label}
            </span>
          </label>
        ))}
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* RESULT */}
      {result ? (
        <div className="border border-[#9fe1cb] dark:border-[#1d9e75]/40 bg-[#e1f5ee]/40 dark:bg-[#0f3d30]/40 rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-[#0f6e56] uppercase tracking-widest mb-3">
            ✓ Secure link ready
          </p>
          <div className="flex gap-2 mb-3">
            <div className="flex-1 text-sm font-mono bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-gray-600 dark:text-gray-400 truncate">
              {`${window.location.origin}/s/${result.links[0]?.token}#key=***`}
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = `${window.location.origin}/s/${result.links[0]?.token}`
                if (navigator.share) {
                  navigator.share({ title: 'SecretDrop', url: link })
                } else {
                  navigator.clipboard.writeText(link)
                }
              }}
            >
              <Share2 size={13} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              `Expires in ${EXPIRE_OPTIONS.find(o => o.value === expiresInHours)?.label}`,
              `${maxViews === 9999 ? 'Unlimited' : maxViews + ' view' + (maxViews > 1 ? 's' : '')}`,
              emails.length > 0 ? `${emails.length} recipient${emails.length > 1 ? 's' : ''}` : null,
              password ? 'Password protected' : null,
            ]
              .filter(Boolean)
              .map((chip) => (
                <span
                  key={chip as string}
                  className="text-xs px-2.5 py-1 rounded-full bg-[#e1f5ee] dark:bg-[#0f3d30] text-[#0f6e56] dark:text-[#4ecca3]"
                >
                  {chip}
                </span>
              ))}
          </div>
          <button
            onClick={handleReset}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
          >
            Create another secret
          </button>
        </div>
      ) : (
        <Button variant="primary" size="lg" className="w-full" loading={loading} onClick={handleSubmit}>
          <Lock size={15} />
          Create Secure Link
        </Button>
      )}

    </div>
  )
}