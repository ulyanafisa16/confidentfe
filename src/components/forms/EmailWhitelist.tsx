// src/components/forms/EmailWhitelist.tsx

'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'

interface Props {
  emails: string[]
  onChange: (emails: string[]) => void
}

export default function EmailWhitelist({ emails, onChange }: Props) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const isValid = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // Di EmailWhitelist.tsx, ganti fungsi add:
  const add = () => {
    const val = input.trim().toLowerCase()
    if (!val) return
    if (!isValid(val)) { setError('Email tidak valid'); return }
    if (emails.includes(val)) { setError('Email sudah ditambahkan'); return }
    const newEmails = [...emails, val]
    onChange(newEmails)
    setInput('')
    setError('')
  }

  const remove = (email: string) => {
    onChange(emails.filter((e) => e !== email))
  }

  return (
  <div>
    <p className="text-[10px] text-gray-400 mb-2">
      Ketik email lalu klik <span className="font-medium text-gray-500">+ Add</span> atau tekan <span className="font-medium text-gray-500">Enter</span>
    </p>
    <div className="flex gap-2">
      <input
        type="email"
        value={input}
        onChange={(e) => { setInput(e.target.value); setError('') }}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
        placeholder="recipient@example.com"
        className="flex-1 text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-[#1d9e75] focus:ring-1 focus:ring-[#1d9e75] transition-all"
      />
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
      >
        <Plus size={14} /> Add
      </button>
    </div>

    {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}

    {emails.length > 0 && (
      <div className="flex flex-wrap gap-2 mt-3">
        {emails.map((email) => (
          <span
            key={email}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#e1f5ee] dark:bg-[#0f3d30] text-[#0f6e56] dark:text-[#4ecca3] font-medium"
          >
            {email}
            <button
              type="button"
              onClick={() => remove(email)}
              className="hover:opacity-70 transition-opacity"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    )}
  </div>
  )
}