'use client'

import { useEffect, useState } from 'react'
import { Lock, FileText, File, Check, Copy, Eye, Bell } from 'lucide-react'
import Link from 'next/link'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import EmailWhitelist from '../../components/forms/EmailWhitelist'
import { createSecret, fetchQuotaStatus, invalidateQuotaCache } from '../../lib/api'
import type { CreateSecretPayload, CreateSecretResponse, QuotaStatus } from '../../types'
import { getFingerprint, incrementAnonCount } from '../../lib/fingerprint'
import { runClientDetection } from '../../lib/clientDetection'
import type { ContentToScan } from '../../types'

type Tab = 'text' | 'file'

const VIEW_OPTIONS = [
  { label: '1 view (burn after reading)', value: 1 },
  { label: '3 views', value: 3 },
  { label: '5 views', value: 5 },
  { label: 'Unlimited', value: 9999 },
]

const EXPIRE_OPTIONS = [
  { label: '1 minute', value: 0.0167 },
  { label: '5 minutes', value: 0.0833 },
  { label: '1 hour', value: 1 },
  { label: '24 hours', value: 24 },
  { label: '7 days', value: 168 },
]


const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', 
  '.vbs', '.msi', '.dmg', '.app', '.jar', '.dll', '.so']

export default function CreateForm() {
  const [tab, setTab] = useState<Tab>('text')
  const [content, setContent] = useState('')
  const [maxViews, setMaxViews] = useState(1)
  const [expiresInHours, setExpiresInHours] = useState(24)
  const [emails, setEmails] = useState<string[]>([])
  const [domains, setDomains] = useState<string[]>([])
  const [notifyOnOpen, setNotifyOnOpen] = useState(false)
  const [allowPreview, setAllowPreview] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CreateSecretResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [encryptedKey, setEncryptedKey] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null)
  const [configLoaded, setConfigLoaded] = useState(false)
  const [usePassphrase, setUsePassphrase] = useState(false)
  const [encPassphrase, setEncPassphrase] = useState('')
  const [encryptionMode, setEncryptionMode] = useState<'url-key' | 'passphrase'>('url-key')
  const [fileError, setFileError] = useState('')
  const [customViews, setCustomViews] = useState(false)

  const anonQuota = quotaStatus?.remaining ?? 3
  const maxPerDay = quotaStatus?.max_per_day ?? 3

  const maxFileSizeMB = quotaStatus?.max_file_size_mb ?? (isLoggedIn ? 50 : 10)
  const maxRecipients = quotaStatus?.max_recipients ?? (isLoggedIn ? 50 : 5)
  const maxExpiryDays = quotaStatus?.max_expiry_days ?? (isLoggedIn ? 30 : 3)
  const maxExpiryHours = maxExpiryDays * 24


  const dynamicExpireOption = {
  label: `${maxExpiryDays} day${maxExpiryDays > 1 ? 's' : ''}`,
  value: maxExpiryHours,
}
const availableExpireOptions = [
  ...EXPIRE_OPTIONS.filter(o => o.value <= maxExpiryHours),
  ...(maxExpiryDays > 1 && !EXPIRE_OPTIONS.some(o => o.value === maxExpiryHours)
    ? [dynamicExpireOption]
    : [])
]
  // ── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('access_token')
      setIsLoggedIn(!!token)
      let fp: string | undefined
      if (!token) fp = await getFingerprint()
      invalidateQuotaCache()
      const quota = await fetchQuotaStatus(fp)
      if (quota) setQuotaStatus(quota)
      setConfigLoaded(true)
    }
    init()
  }, [])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getFullLink = () => {
    const token = result?.links[0]?.token
    if (encryptionMode === 'passphrase') {
      return `${window.location.origin}/s/${token}`
    }
    const safeKey = encodeURIComponent(encryptedKey)
    return `${window.location.origin}/s/${token}#key=${safeKey}`
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getFullLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleReset = () => {
    setResult(null)
    setContent('')
    setEmails([])
    setDomains([])
    setCopied(false)
    setSelectedFile(null)
    setFileError('')
    setEncryptedKey('')
    setUsePassphrase(false)
    setEncPassphrase('')
    setEncryptionMode('url-key')
    setCustomViews(false)
  }

  const handleFileSelect = (file: File) => {
    setFileError('')

    // Cek ekstensi
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      setFileError(`File type "${ext}" is not allowed. Executable files cannot be uploaded.`)
      return
    }

    // Cek ukuran
    const maxMB = maxFileSizeMB
    const maxBytes = maxMB * 1024 * 1024
    if (file.size > maxBytes) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1)
      const registeredMaxMB = quotaStatus?.registered_max_file_size_mb ?? 0
      setFileError(
        `File too large (${sizeMB} MB). Maximum allowed size is ${maxMB} MB${
          !isLoggedIn && registeredMaxMB
            ? ` for anonymous users. Login for up to ${registeredMaxMB} MB.`
            : '.'
        }`
      )
      return
    }

    setSelectedFile(file)
  }
  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {

    if (tab === 'text' && !content.trim()) {
      setError('Secret cannot be empty')
      return
    }

    if (tab === 'file') {
      if (!selectedFile) {
        setError('Please select a file')
        return
      }

      if (selectedFile.size <= 0) {
        setError('File cannot be empty.')
        return
      }
    }
    if (!isLoggedIn && quotaStatus !== null && (quotaStatus.remaining ?? 1) <= 0) {
      setError('Daily limit reached. Please login to create more secrets.')
      return
    }
    if (expiresInHours > maxExpiryHours) {
    setError(`Maximum expiry is ${maxExpiryDays} day${maxExpiryDays > 1 ? 's' : ''}.`)
    return
  }

  if (emails.length + domains.length > maxRecipients) {
    setError(`Maximum recipients allowed is ${maxRecipients}.`)
    return
  }

    setError('')
    setLoading(true)

    try {
      // Step 1 — Fingerprint
      let fingerprintHash: string | undefined
      if (!isLoggedIn) {
        fingerprintHash = await getFingerprint()
      }
      
      let clientRiskScore = 0
      let clientRulesTriggered: string[] = []

      const contentToScan: ContentToScan = {
        secret_type: tab,
        text: tab === 'text' ? content : undefined,
        filename: tab === 'file' ? selectedFile?.name : undefined,
        mime_type: tab === 'file' ? selectedFile?.type : undefined,
        file_size: tab === 'file' ? selectedFile?.size : undefined,
      }
      const detectionResult = runClientDetection(contentToScan)

      clientRiskScore = detectionResult.risk_score
      clientRulesTriggered = detectionResult.rules_triggered

      if (detectionResult.action === 'blocked') {
        setError(
          'Content blocked by security scan. This content appears to contain sensitive data that cannot be shared.'
        )
        setLoading(false)
        return
      }

      if (detectionResult.action === 'flagged') {
        
      }

      // Step 2 — Encrypt
      let encResult: {
        encrypted_payload: string
        encryption_iv: string
        encryption_tag: string
        encryption_salt: string
        raw_key_b64: string | null
        mode: 'url-key' | 'passphrase'
      }
      let extraFields: Record<string, unknown> = {}

      const passphraseToUse = usePassphrase && encPassphrase.trim()
        ? encPassphrase.trim()
        : undefined

      if (tab === 'file' && selectedFile) {
        const { encryptFile } = await import('../../lib/encryptFile')
        const enc = await encryptFile(selectedFile, passphraseToUse)
        encResult = enc
        extraFields = {
          original_filename: enc.original_filename,
          mime_type: enc.mime_type,
          file_size_bytes: enc.file_size_bytes,
        }
      } else {
        const { encryptSecret } = await import('../../lib/encryptText')
        encResult = await encryptSecret(content, passphraseToUse)
      }

      const keyForLink = encResult.raw_key_b64 || ''
      setEncryptionMode(encResult.mode)
      setEncryptedKey(keyForLink)
      
      // Step 3 — Build payload
      const payload: CreateSecretPayload = {
        secret_type: tab,
        encrypted_payload: encResult.encrypted_payload,
        encryption_iv: encResult.encryption_iv,
        encryption_tag: encResult.encryption_tag,
        encryption_salt: encResult.encryption_salt,
        encryption_mode: encResult.mode,
        max_views: maxViews,
        expires_in_hours: expiresInHours,
        email_whitelist: emails,
        domain_whitelist: domains,
        notify_on_open: notifyOnOpen,
        allow_preview: allowPreview,
        client_risk_score: clientRiskScore,           // ← tambah
        client_rules_triggered: clientRulesTriggered, 
        ...(fingerprintHash ? { fingerprint_hash: fingerprintHash } : {}),
        ...extraFields,
      }
      const res = await createSecret(payload)
      setResult(res)

      const token = res.links[0]?.token

      if (token && keyForLink && encResult.mode === 'url-key') {
        localStorage.setItem(
          `secret_link_${token}`,
          `${window.location.origin}/s/${token}#key=${encodeURIComponent(keyForLink)}`
        )
      }
      // Step 4 — Refresh quota
      if (!isLoggedIn) {
        incrementAnonCount(fingerprintHash || '')
        invalidateQuotaCache()
        const fp = await getFingerprint()
        const freshQuota = await fetchQuotaStatus(fp)
        if (freshQuota) setQuotaStatus(freshQuota)
      }

    } catch (e: any) {
      const data = e?.response?.data
      const parseErrorDetail = (val: any): string => {
        if (typeof val === 'string') return val
        if (val?.string) return val.string
        if (Array.isArray(val)) {
          const first = val[0]
          if (typeof first === 'string') return first
          if (first?.string) return first.string
          return String(first)
        }
        return String(val)
      }
      if (data?.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
        setError(parseErrorDetail(Object.values(data.errors)[0]))
      } else if (data?.message) {
        setError(data.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const selectClass = 'w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-[#1d9e75] focus:ring-1 focus:ring-[#1d9e75] transition-all'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-7 shadow-sm">

      {/* QUOTA BANNER */}
      {!isLoggedIn && configLoaded && (
        <div className={`flex items-start gap-3 p-3.5 rounded-xl mb-5 border ${
          anonQuota === 0
            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40'
            : anonQuota <= 1
            ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40'
            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800'
        }`}>
          <div className="flex-1">
            <p className={`text-xs font-semibold mb-0.5 ${
              anonQuota === 0 ? 'text-red-600' : anonQuota <= 1 ? 'text-amber-600' : 'text-gray-500'
            }`}>
              {anonQuota === 0
                ? 'Daily limit reached'
                : `${anonQuota} free secret${anonQuota !== 1 ? 's' : ''} remaining today`}
            </p>
            <p className="text-xs text-gray-400">
              {anonQuota === 0
                ? 'Login or sign up to create unlimited secrets.'
                : `Anonymous users can create ${maxPerDay} secrets per day.`}
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

      {/* CONTENT */}
      {tab === 'file' ? (
      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 tracking-wide">
          Upload file
        </label>

        {/* Max size info */}
        <p className="text-xs text-gray-400 mb-2">
          Max size: <span className="font-medium">{maxFileSizeMB} MB</span>
          {' · '}PDF, Word, Excel, images, ZIP, TXT, CSV, XML
          {' · '}Executable files not allowed (.exe, .bat, .sh, etc)
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFileSelect(file)
          }}
          onClick={() => document.getElementById('file-input')?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragOver ? 'border-[#1d9e75] bg-[#e1f5ee]/30'
            : selectedFile ? 'border-[#1d9e75] bg-[#e1f5ee]/10'
            : fileError ? 'border-red-300 dark:border-red-700 bg-red-50/30'
            : 'border-gray-200 dark:border-gray-700 hover:border-[#1d9e75] hover:bg-[#e1f5ee]/10'
          }`}
        >
          <input
            id="file-input"
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.xml,.jpg,.jpeg,.png,.gif,.webp,.zip,.dbml"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
              // Reset input supaya bisa pilih file yang sama lagi
              e.target.value = ''
            }}
          />
          {selectedFile ? (
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#e1f5ee] dark:bg-[#0f3d30] flex items-center justify-center mx-auto mb-3">
                <File size={18} className="text-[#0f6e56]" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{selectedFile.name}</p>
              <p className="text-xs text-gray-400">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · {selectedFile.type || 'unknown type'}
              </p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setFileError('') }}
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
              <p className="text-xs text-gray-400 mt-1">
                Max {maxFileSizeMB} MB
              </p>
            </div>
          )}
        </div>

        {/* File error */}
        {fileError && (
          <div className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <span className="text-red-500 text-xs mt-0.5">⚠</span>
            <p className="text-xs text-red-600 dark:text-red-400">{fileError}</p>
          </div>
        )}
      </div>
      ) : (
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
      )}

      {/* DIVIDER */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
        <span className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">Security Options</span>
        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
      </div>

      {/* OPTIONS GRID */}
      <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Allowed views
        </label>
        
        {/* Preset options */}
        <div className="flex gap-1 flex-wrap mb-2">
          {[1, 3, 5, 10].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => { setMaxViews(v); setCustomViews(false) }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                maxViews === v && !customViews
                  ? 'bg-[#1d9e75] text-white border-[#1d9e75]'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-[#1d9e75]'
              }`}
            >
              {v}×
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustomViews(true)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
              customViews
                ? 'bg-[#1d9e75] text-white border-[#1d9e75]'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-[#1d9e75]'
            }`}
          >
            Custom
          </button>
          <button
            type="button"
            onClick={() => { setMaxViews(9999); setCustomViews(false) }}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
              maxViews === 9999 && !customViews
                ? 'bg-[#1d9e75] text-white border-[#1d9e75]'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-[#1d9e75]'
            }`}
          >
            Unlimited
          </button>
        </div>

        {/* Custom input */}
        {customViews && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              value={maxViews === 9999 ? '' : maxViews}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                if (!isNaN(val) && val >= 1 && val <= 100) setMaxViews(val)
              }}
              placeholder="Enter number (1-100)"
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-[#1d9e75] focus:ring-1 focus:ring-[#1d9e75]"
            />
            <span className="text-xs text-gray-400 whitespace-nowrap">max 100</span>
          </div>
        )}

        {/* Info */}
        <p className="text-[10px] text-gray-400 mt-1.5">
          {maxViews === 9999 ? 'No limit — link stays active until expired' 
          : maxViews === 1 ? 'Burn after reading — destroyed after 1 view'
          : `Link destroyed after ${maxViews} views`}
        </p>
      </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5">
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Link expires in</label>
          <select
          value={expiresInHours}
          onChange={(e) => setExpiresInHours(Number(e.target.value))}
          className={selectClass}
        >
          {availableExpireOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
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
          domains={domains}
          onEmailsChange={(newEmails) => {
            setEmails(newEmails)
          }}
          onDomainsChange={(newDomains) => {
            setDomains(newDomains)
          }}
        />
      </div>

      {/* ENCRYPTION MODE */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5 mb-4">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Additional Password Protection
        </label>
        <label className="flex items-start gap-3 cursor-pointer group mb-3">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={usePassphrase}
              onChange={(e) => {
                setUsePassphrase(e.target.checked)
                if (!e.target.checked) setEncPassphrase('')
              }}
              className="sr-only"
            />
            <div className={`w-8 rounded-full transition-colors ${usePassphrase ? 'bg-[#1d9e75]' : 'bg-gray-300 dark:bg-gray-600'}`} style={{ height: '18px' }}>
              <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${usePassphrase ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              Protect with additional password
            </span>
            <p className="text-xs text-gray-400 mt-0.5">
              {usePassphrase
              ? 'Recipient must enter this password to decrypt the secret. Share it through a separate channel.'
              : 'No additional password. A random key is stored in the URL fragment.'}</p>
          </div>
        </label>
        {usePassphrase && (
          <div className="space-y-2">
            <Input
              type="password"
              value={encPassphrase}
              onChange={(e) => setEncPassphrase(e.target.value)}
              placeholder="Enter a strong passphrase..."
              hint="Share this passphrase with the recipient via a separate channel"
            />
            {encPassphrase && encPassphrase.length < 12 && (
              <p className="text-xs text-amber-500">
                ⚠ Too short — use at least 12 characters for optimal security
              </p>
            )}
          </div>
        )}
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

          <div className="flex gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 mb-3">
            <span className="text-amber-500 text-xs">⚠</span>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              <span className="font-semibold">Save this link now.</span> It will not be shown again. If you lose the full link, the secret cannot be decrypted.
            </p>
          </div>
          <div className="flex gap-2 mb-3">
            <div className="flex-1 ...">
              {encryptionMode === 'passphrase'
                ? `${window.location.origin}/s/${result.links[0]?.token}`
                : `${window.location.origin}/s/${result.links[0]?.token}#key=***`
              }
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          {encryptionMode === 'passphrase' ? (
            <div className="flex gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 mb-3">
              <span className="text-amber-500 text-xs">⚠</span>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                <span className="font-semibold">Passphrase required.</span> Share the passphrase with recipient via a separate channel. Without it, the secret cannot be decrypted.
              </p>
            </div>
          ) : (
            <div className="flex gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 mb-3">
              <span className="text-blue-500 text-xs">ℹ</span>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                The decryption key is in the URL. Keep the full link private.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {[
              `Expires in ${EXPIRE_OPTIONS.find(o => o.value === expiresInHours)?.label}`,
              `${maxViews === 9999 ? 'Unlimited' : maxViews + ' view' + (maxViews > 1 ? 's' : '')}`,
              emails.length > 0 ? `${emails.length} recipient${emails.length > 1 ? 's' : ''}` : null,
              domains.length > 0 ? `${domains.length} domain${domains.length > 1 ? 's' : ''}` : null,
              usePassphrase && encPassphrase ? 'Passphrase protected' : null,
            ].filter(Boolean).map((chip) => (
              <span key={chip as string} className="text-xs px-2.5 py-1 rounded-full bg-[#e1f5ee] dark:bg-[#0f3d30] text-[#0f6e56] dark:text-[#4ecca3]">
                {chip}
              </span>
            ))}
          </div>
          <button onClick={handleReset} className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
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