'use client'

import { useState, useEffect } from 'react'
import { Lock, Clock, Eye, ShieldAlert } from 'lucide-react'
import type { SecretMetaResponse } from '../../types'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

interface Props {
  meta: SecretMetaResponse
  onReveal: (password?: string, email?: string) => void
  loading: boolean
  error: string
}

function timeUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d ${h % 24}h`
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function ViewLocked({ meta, onReveal, loading, error }: Props) {
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [hasKey, setHasKey] = useState(false)
  const [encPassphrase, setEncPassphrase] = useState('')
  const [mode, setMode] = useState<'url-key' | 'passphrase'>('url-key')

useEffect(() => {
  const hash = window.location.hash
  const hashContent = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(hashContent)
  const hasKey = !!params.get('key')
  setHasKey(hasKey)
  setMode(hasKey ? 'url-key' : 'passphrase')
}, [])

  const handleSubmit = () => {
    if (!confirmed) return
    if (mode === 'passphrase' && !encPassphrase.trim()) {
    // Tampilkan error
      return
    }
    onReveal(
      meta.is_password_protected ? password : undefined,
      meta.is_email_restricted ? email : undefined,
      mode === 'passphrase' ? encPassphrase : undefined,
    )
  }

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <div className="w-14 h-14 rounded-2xl bg-[#e1f5ee] dark:bg-[#0f3d30] flex items-center justify-center mx-auto mb-5">
        <Lock size={24} className="text-[#0f6e56]" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
        You received a secret
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm text-center leading-relaxed mb-6">
        Someone sent you a confidential message via SecretDrop.
      </p>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {meta.expires_at && (
          <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500">
            <Clock size={11} />
            Expires in {timeUntil(meta.expires_at)}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500">
          <Eye size={11} />
          {meta.views_remaining} view{meta.views_remaining !== 1 ? 's' : ''} remaining
        </span>
        {meta.is_password_protected && (
          <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500">
            <Lock size={11} />
            Password protected
          </span>
        )}
      </div>

      {/* Warning */}
      <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 mb-6">
        <ShieldAlert size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-500 mb-1">
            Burn after reading
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500/80 leading-relaxed">
            This secret will be permanently destroyed after you reveal it.
            Make sure you are ready before proceeding.
          </p>
        </div>
      </div>

      {/* No key warning */}
      {mode === 'url-key' && !hasKey && (
        <div className="flex gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 mb-6">
          <ShieldAlert size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
            Decryption key not found in URL. Make sure you opened the complete link including the <code className="font-mono">#key=...</code> part.
          </p>
        </div>
      )}

      {/* Form */}
      <div className="space-y-3 mb-5">

        {mode === 'passphrase' && (
          <div className="mb-4">
            <Input
              label="Decryption passphrase"
              type="password"
              value={encPassphrase}
              onChange={(e) => setEncPassphrase(e.target.value)}
              placeholder="Enter the passphrase from the sender"
              hint="The sender should have shared this with you separately"
            />
          </div>
        )}

        {meta.is_email_restricted && (
          <Input
            label="Your email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter the email you received this on"
          />
        )}
        {meta.is_password_protected && (
          <Input
            label="Passphrase"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter the passphrase you received"
          />
        )}
      </div>

      {/* Confirm checkbox */}
      <label className="flex items-start gap-3 mb-5 cursor-pointer group">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[#1d9e75] flex-shrink-0 cursor-pointer"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          I understand this secret will be permanently destroyed after I view it
        </span>
      </label>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={
          !confirmed ||
          (mode === 'url-key' && !hasKey)
        }
        loading={loading}
        onClick={handleSubmit}
      >
        <Eye size={15} />
        Reveal Secret
      </Button>

      <p className="text-xs text-gray-400 text-center mt-4">
        Powered by SecretDrop · End-to-end encrypted · Zero knowledge
      </p>
    </div>
  )
}