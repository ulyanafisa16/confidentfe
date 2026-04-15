// src/app/security/page.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Shield, Server, Eye, Lock, AlertTriangle,
  CheckCircle, ArrowRight, X
} from 'lucide-react'

const SECURITY_ITEMS = [
  {
    icon: Shield,
    title: 'AES-256-GCM Encryption',
    content: 'All content is encrypted using AES-256-GCM — the same standard used by governments, banks, and military institutions. Encryption runs locally in your browser via the Web Crypto API before any data is transmitted.',
    color: 'green',
  },
  {
    icon: Server,
    title: 'Zero-knowledge by design',
    content: 'Our servers store only ciphertext. The decryption key lives exclusively in the URL fragment (#key=…), which browsers do not send to servers. Even if our database were compromised, attackers would find only meaningless encrypted bytes.',
    color: 'green',
  },
  {
    icon: Eye,
    title: 'Permanent destruction',
    content: 'When a secret reaches its view limit or expires, the ciphertext is hard-deleted from our database — not archived, not soft-deleted, not recoverable. This happens at the database level, not just the application layer.',
    color: 'green',
  },
  {
    icon: Lock,
    title: 'Transport security (TLS)',
    content: 'All traffic between your browser and our servers uses HTTPS/TLS 1.3. Even intercepted traffic reveals only encrypted data — useless without the key that never left your URL fragment.',
    color: 'green',
  },
  {
    icon: AlertTriangle,
    title: 'What we cannot protect against',
    content: "No system protects against a recipient taking a screenshot, a keylogger on the recipient's device, or the recipient choosing to share the content. SecretDrop controls transit and storage security — not what happens after decryption on the recipient's screen.",
    color: 'amber',
  },
]

const DO_LIST = [
  'Sharing temporary credentials and passwords',
  'Sending API keys, tokens, and secrets',
  'One-time sensitive document transfer',
  'Setting the shortest possible expiry',
  'Adding email or domain whitelists',
  'Combining password + whitelist for critical data',
]

const DONT_LIST = [
  'Long-term secret storage (use a password manager)',
  'Content that needs to be accessed repeatedly',
  'Assuming the link channel is secure on its own',
  'Sending the link and its password via the same channel',
]

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function SecurityCard({
  item,
  index,
}: {
  item: typeof SECURITY_ITEMS[0]
  index: number
}) {
  const { ref, inView } = useInView()
  const Icon = item.icon
  const isWarning = item.color === 'amber'
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${index * 80}ms, transform 0.5s ease ${index * 80}ms`,
      }}
      className={`p-6 rounded-2xl border ${
        isWarning
          ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40'
          : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-[#1d9e75]/40'
      } transition-all duration-300`}
    >
      <div className="flex gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isWarning ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-[#e1f5ee] dark:bg-[#0a2e24]'
        }`}>
          <Icon size={18} className={isWarning ? 'text-amber-600' : 'text-[#0f6e56]'} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.content}</p>
        </div>
      </div>
    </div>
  )
}

export default function SecurityPage() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(16px)'
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    })
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">

      {/* Hero */}
      <div ref={heroRef} className="text-center mb-20">
        <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-[#e1f5ee] dark:bg-[#0a2e24] text-[#0f6e56] border border-[#9fe1cb]/40 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1d9e75] animate-pulse" />
          Security & Privacy
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-5 tracking-tight leading-tight">
          Transparent about
          <br />
          <span className="text-[#1a6b5e] dark:text-[#4ecca3]">what we protect</span>
          {' '}— and what we don't.
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
          We believe security without transparency is theater.
          Here is exactly how SecretDrop works and where its limits are.
        </p>
      </div>

      {/* Security cards */}
      <div className="space-y-4 mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Security model
          </span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
        </div>
        {SECURITY_ITEMS.map((item, i) => (
          <SecurityCard key={item.title} item={item} index={i} />
        ))}
      </div>

      {/* Do's and Don'ts */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Best practices
          </span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle size={15} className="text-[#0f6e56]" />
              Use SecretDrop for
            </h3>
            <ul className="space-y-2.5">
              {DO_LIST.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1d9e75] flex-shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <X size={15} className="text-red-400" />
              Don't use SecretDrop for
            </h3>
            <ul className="space-y-2.5">
              {DONT_LIST.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center p-10 bg-[#e1f5ee] dark:bg-[#0a2e24] rounded-2xl border border-[#9fe1cb]/40">
        <Shield size={24} className="text-[#0f6e56] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          See the full picture
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Want to understand the step-by-step flow? Read how SecretDrop works in detail.
        </p>
        <Link
          href="/how-it-works"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a6b5e] text-white text-sm font-medium rounded-xl hover:bg-[#0f5347] transition-colors"
        >
          How it works <ArrowRight size={14} />
        </Link>
      </div>

    </div>
  )
}