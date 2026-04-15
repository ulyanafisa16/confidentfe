// src/app/how-it-works/page.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Shield, Clock, Eye, Lock, Key, Globe,
  ArrowRight, CheckCircle
} from 'lucide-react'

const STEPS = [
  {
    number: '01',
    title: 'Write your secret',
    desc: 'Paste a password, API key, private note, or upload any file. Your content never leaves the browser in plaintext — encryption begins immediately on your device.',
    tag: 'Input',
  },
  {
    number: '02',
    title: 'Encrypted in your browser',
    desc: 'Before anything touches our servers, AES-256-GCM encryption runs locally via the Web Crypto API. We receive only ciphertext — mathematically unreadable without the key.',
    tag: 'Encryption',
  },
  {
    number: '03',
    title: 'Configure access rules',
    desc: 'Set view limits, expiry windows, email or domain whitelists, and an optional access password. Every option adds another layer of control over who sees what.',
    tag: 'Security',
  },
  {
    number: '04',
    title: 'Receive a secure link',
    desc: 'A unique link is generated. The decryption key lives only in the URL fragment (#key=…) — this part is never sent to our servers, never logged, never stored.',
    tag: 'Link',
  },
  {
    number: '05',
    title: 'Share with your recipient',
    desc: 'Send the full link via any channel. The key in the URL is what makes decryption possible — without it, the ciphertext on our server is worthless.',
    tag: 'Share',
  },
  {
    number: '06',
    title: 'Secret self-destructs',
    desc: "Once opened (or expired), the ciphertext is permanently deleted from our database. No backups. No recovery. Not even we can retrieve it.",
    tag: 'Destroy',
  },
]

const FEATURES = [
  {
    icon: Shield,
    title: 'Zero-knowledge architecture',
    desc: 'Our servers store only encrypted bytes. We have no mathematical ability to read your secrets — not now, not ever.',
  },
  {
    icon: Key,
    title: 'AES-256-GCM',
    desc: 'The same encryption standard used by governments and financial institutions. 256-bit keys with authenticated encryption.',
  },
  {
    icon: Eye,
    title: 'Burn after reading',
    desc: 'Ciphertext is deleted permanently after the view limit is reached. No soft-deletes, no archives — gone.',
  },
  {
    icon: Clock,
    title: 'Automatic expiry',
    desc: 'Set a time window from 1 hour to 30 days. Unopened secrets are purged automatically when time runs out.',
  },
  {
    icon: Globe,
    title: 'Domain-level access',
    desc: 'Restrict access to an entire company domain (@company.com) without listing every employee individually.',
  },
  {
    icon: Lock,
    title: 'Layered protection',
    desc: 'Stack encryption + access password + email whitelist for maximum security on your most sensitive data.',
  },
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

function AnimatedStep({ step, index }: { step: typeof STEPS[0]; index: number }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${index * 80}ms, transform 0.5s ease ${index * 80}ms`,
      }}
      className="group flex gap-5 p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-[#1d9e75]/40 hover:shadow-sm transition-all duration-300"
    >
      <div className="flex-shrink-0">
        <div className="w-11 h-11 rounded-xl bg-[#e1f5ee] dark:bg-[#0a2e24] flex items-center justify-center group-hover:bg-[#1d9e75] transition-colors duration-300">
          <span className="text-xs font-bold text-[#0f6e56] group-hover:text-white transition-colors duration-300">
            {step.number}
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{step.title}</h3>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
            {step.tag}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
      </div>
    </div>
  )
}

function AnimatedFeature({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const { ref, inView } = useInView()
  const Icon = feature.icon
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${index * 60}ms, transform 0.5s ease ${index * 60}ms`,
      }}
      className="group p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-[#1d9e75]/40 hover:shadow-sm transition-all duration-300"
    >
      <div className="w-9 h-9 rounded-lg bg-[#e1f5ee] dark:bg-[#0a2e24] flex items-center justify-center mb-3 group-hover:bg-[#1d9e75] transition-colors duration-300">
        <Icon size={15} className="text-[#0f6e56] group-hover:text-white transition-colors duration-300" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">{feature.title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
    </div>
  )
}

export default function HowItWorksPage() {
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
          How it works
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-5 tracking-tight leading-tight">
          Built so we{' '}
          <span className="text-[#1a6b5e] dark:text-[#4ecca3]">can't read</span>
          <br />your secrets. Ever.
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-lg mx-auto leading-relaxed mb-8">
          Every secret is encrypted in your browser before it reaches our servers.
          We store ciphertext — not secrets.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#0f6e56] hover:gap-3 transition-all duration-200"
        >
          Try it now <ArrowRight size={14} />
        </Link>
      </div>

      {/* Steps */}
      <div className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Step by step
          </span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <AnimatedStep key={step.number} step={step} index={i} />
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Security features
          </span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <AnimatedFeature key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center p-10 bg-[#e1f5ee] dark:bg-[#0a2e24] rounded-2xl border border-[#9fe1cb]/40">
        <CheckCircle size={24} className="text-[#0f6e56] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Ready to share your first secret?
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          No account required. Your secret stays encrypted from the moment you type it.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a6b5e] text-white text-sm font-medium rounded-xl hover:bg-[#0f5347] transition-colors"
        >
          Create a secret <ArrowRight size={14} />
        </Link>
      </div>

    </div>
  )
}