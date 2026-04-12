'use client'

import { useState, useEffect } from 'react'
import { Check, Copy, Download, AlertTriangle, Loader2 } from 'lucide-react'
import type { RevealSecretResponse } from '../../types'
import Button from '../../components/ui/Button'
import Link from 'next/link'

interface Props {
  data: RevealSecretResponse
}

function base64ToBuffer(b64: string): Uint8Array {
  // Normalize: URL-safe → standard, fix padding
  const standard = b64
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const padded = standard + '='.repeat((4 - standard.length % 4) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function decryptContent(data: RevealSecretResponse): Promise<{
  text?: string
  blob?: Blob
  filename?: string
}> {
  const hash = window.location.hash
  const hashContent = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(hashContent)
  const keyParam = params.get('key')
  if (!keyParam) throw new Error('Decryption key not found in URL')

  const rawKey = base64ToBuffer(keyParam)
  const iv = base64ToBuffer(data.encryption_iv)
  const tag = base64ToBuffer(data.encryption_tag)
  const ciphertext = base64ToBuffer(data.encrypted_payload)

  const key = await crypto.subtle.importKey(
    'raw', rawKey, { name: 'AES-GCM' }, false, ['decrypt']
  )

  const combined = new Uint8Array(ciphertext.length + tag.length)
  combined.set(ciphertext)
  combined.set(tag, ciphertext.length)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, key, combined
  )

  if (data.secret_type === 'file') {
    const blob = new Blob([decrypted], { type: data.mime_type || 'application/octet-stream' })
    return { blob, filename: data.original_filename || 'secret-file' }
  }

  return { text: new TextDecoder().decode(decrypted) }
}

export default function ViewRevealed({ data }: Props) {
  const [plaintext, setPlaintext] = useState<string | null>(null)
  const [fileBlob, setFileBlob] = useState<Blob | null>(null)
  const [filename, setFilename] = useState<string>('')
  const [decryptError, setDecryptError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
  decryptContent(data)
    .then((result) => {
      if (result.text !== undefined) setPlaintext(result.text)
      if (result.blob) { setFileBlob(result.blob); setFilename(result.filename || 'file') }
    })
    .catch((e) => setDecryptError(e?.message || 'Decryption failed'))
}, [data])

  const handleCopy = () => {
    if (!plaintext) return
    navigator.clipboard.writeText(plaintext)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDownload = () => {
    if (fileBlob) {
      const url = URL.createObjectURL(fileBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)  // ← penting untuk Firefox
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else if (plaintext) {
      const blob = new Blob([plaintext], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'secret.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }
  return (
    <div className="max-w-md mx-auto px-6 py-12">

      {/* Success banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#e1f5ee] dark:bg-[#0f3d30] border border-[#9fe1cb]/50 mb-5">
        <Check size={15} className="text-[#0f6e56] flex-shrink-0" />
        <p className="text-sm font-medium text-[#0f6e56]">
          Secret revealed — copy and save it now
        </p>
      </div>

      {/* Destroyed notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 mb-5">
        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
        <div>
          <p className="text-xs font-semibold text-red-600 dark:text-red-400">
            This secret has been permanently destroyed
          </p>
          <p className="text-xs text-red-500/80 dark:text-red-400/70 mt-0.5">
            It no longer exists on our servers and cannot be viewed again.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 mb-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Secret content
        </p>

        {decryptError ? (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            ⚠ {decryptError}
          </div>
        ) : fileBlob ? (
        // File mode
        <div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#e1f5ee] dark:bg-[#0f3d30] flex items-center justify-center flex-shrink-0">
              <Download size={16} className="text-[#0f6e56]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{filename}</p>
              <p className="text-xs text-gray-400">{(fileBlob.size / 1024).toFixed(1)} KB · Decrypted successfully</p>
            </div>
          </div>
          <Button variant="primary" size="md" className="w-full" onClick={handleDownload}>
            <Download size={14} />
            Download {filename}
          </Button>
        </div>
        ) : plaintext === null ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4 justify-center">
            <Loader2 size={14} className="animate-spin" />
            Decrypting...
          </div>
        ) : (
          <pre className="text-sm font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all leading-relaxed bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            {plaintext}
          </pre>
        )}
      </div>

      {/* Actions */}
      {plaintext && (
        <div className="flex gap-2 mb-5">
          <Button variant="outline" size="md" className="flex-1" onClick={handleCopy}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy content'}
          </Button>
          <Button variant="outline" size="md" className="flex-1" onClick={handleDownload}>
            <Download size={13} />
            Download
          </Button>
        </div>
      )}

      {/* Save warning */}
      <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 mb-6">
        <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-600 dark:text-amber-500/80 leading-relaxed">
          <span className="font-semibold">Save this before you close the tab.</span>{' '}
          Once you leave, the content is gone permanently.
        </p>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Need to send a secret?{' '}
        <Link href="/" className="text-[#0f6e56] hover:underline">
          Create one at SecretDrop →
        </Link>
      </p>

    </div>
  )
}