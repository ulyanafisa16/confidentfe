// src/app/page.tsx

import { Shield, Clock, Eye, Mail } from 'lucide-react'
import CreateForm from '../components/forms/CreateForm'

const FEATURES = [
  { icon: Shield, title: 'End-to-end encrypted', desc: 'Your secret is encrypted before it leaves your browser.' },
  { icon: Clock, title: 'Auto-expires', desc: 'Set expiry from 1 hour to 30 days. Destroyed automatically.' },
  { icon: Eye, title: 'Burn after reading', desc: 'Secret is permanently deleted after it is viewed.' },
  { icon: Mail, title: 'Email whitelist', desc: 'Restrict access to specific email addresses only.' },
]

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">

      {/* HERO */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-[#e1f5ee] dark:bg-[#0f3d30] text-[#0f6e56] dark:text-[#4ecca3] border border-[#9fe1cb]/50 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1d9e75] animate-pulse" />
          End-to-end encrypted
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">
          Share secrets that{' '}
          <span className="text-[#1a6b5e] dark:text-[#4ecca3]">disappear</span>{' '}
          after reading
        </h1>

        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-lg mx-auto mb-8 leading-relaxed">
          Send passwords, API keys, or confidential notes through a secure link — only the intended recipient can open it, once.
        </p>

        {/* STEPS */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-10">
          {['Create secret', 'Set options', 'Share link'].map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              {i > 0 && <span className="text-gray-300 dark:text-gray-700">→</span>}
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#e1f5ee] dark:bg-[#0f3d30] text-[#0f6e56] text-xs font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                {step}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* FORM */}
      <div className="max-w-xl mx-auto mb-16">
        <CreateForm />
      </div>

      {/* FEATURES */}
      <div id="how-it-works" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-[#9fe1cb]/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#e1f5ee] dark:bg-[#0f3d30] flex items-center justify-center mb-3">
              <Icon size={15} className="text-[#0f6e56]" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

    </div>
  )
}