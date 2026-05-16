'use client'

import { useState } from 'react'
import { X, Plus, AtSign, Mail } from 'lucide-react'

interface Props {
  emails: string[]
  domains: string[]
  onEmailsChange: (emails: string[]) => void
  onDomainsChange: (domains: string[]) => void
}

export default function EmailWhitelist({ emails, domains, onEmailsChange, onDomainsChange }: Props) {
  const [emailInput, setEmailInput] = useState('')
  const [domainInput, setDomainInput] = useState('')
  const [emailError, setEmailError] = useState('')
  const [domainError, setDomainError] = useState('')
  const [mode, setMode] = useState<'email' | 'domain'>('email')

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const isValidDomain = (v: string) => {
    const d = v.replace('@', '').trim()
    return d.includes('.') && d.length > 3
  }

  const addEmail = () => {
    const val = emailInput.trim().toLowerCase()
    if (!val) return
    if (!isValidEmail(val)) { setEmailError('Email tidak valid'); return }
    if (emails.includes(val)) { setEmailError('Email sudah ditambahkan'); return }
    onEmailsChange([...emails, val])
    setEmailInput('')
    setEmailError('')
  }

  const addDomain = () => {
    const val = domainInput.trim().toLowerCase().replace('@', '')
    if (!val) return
    if (!isValidDomain(val)) { setDomainError('Domain tidak valid. Contoh: companyabc.com'); return }
    if (domains.includes(val)) { setDomainError('Domain sudah ditambahkan'); return }
    onDomainsChange([...domains, val])
    setDomainInput('')
    setDomainError('')
  }

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-3">
        <button
          type="button"
          onClick={() => setMode('email')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md font-medium transition-all ${
            mode === 'email'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500'
          }`}
        >
          <Mail size={11} /> Email spesifik
        </button>
        <button
          type="button"
          onClick={() => setMode('domain')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md font-medium transition-all ${
            mode === 'domain'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500'
          }`}
        >
          <AtSign size={11} /> Company Domain
        </button>
      </div>

      {mode === 'email' ? (
        <>
          <p className="text-[10px] text-gray-400 mb-2">
            Type an email, then click <span className="font-medium text-gray-500">+ Add</span> atau tekan <span className="font-medium text-gray-500">Enter</span>
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => { setEmailInput(e.target.value); setEmailError('') }}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
              placeholder="recipient@example.com"
              className="flex-1 text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-[#1d9e75] focus:ring-1 focus:ring-[#1d9e75] transition-all"
            />
            <button
              type="button"
              onClick={addEmail}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          {emailError && <p className="mt-1.5 text-xs text-red-500">{emailError}</p>}
          {emails.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {emails.map((email) => (
                <span key={email} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#e1f5ee] dark:bg-[#0f3d30] text-[#0f6e56] font-medium">
                  {email}
                  <button type="button" onClick={() => onEmailsChange(emails.filter(e => e !== email))} className="hover:opacity-70">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-[10px] text-gray-400 mb-2">
            Allow access for any email from this domain. Example: <span className="font-medium text-gray-500">@companyabc.com</span>
          </p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
              <input
                type="text"
                value={domainInput}
                onChange={(e) => { setDomainInput(e.target.value); setDomainError('') }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                placeholder="companyabc.com"
                className="w-full text-sm pl-7 pr-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-[#1d9e75] focus:ring-1 focus:ring-[#1d9e75] transition-all"
              />
            </div>
            <button
              type="button"
              onClick={addDomain}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          {domainError && <p className="mt-1.5 text-xs text-red-500">{domainError}</p>}
          {domains.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {domains.map((domain) => (
                <span key={domain} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">
                  @{domain}
                  <button type="button" onClick={() => onDomainsChange(domains.filter(d => d !== domain))} className="hover:opacity-70">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}