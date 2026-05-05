// src/components/ui/Footer.tsx

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-300 dark:border-gray-800 mt-16">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1a6b5e]" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              OneTimeUnlock
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Create secret
            </Link>
            <Link href="/how-it-works" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              How it works
            </Link>
            <Link href="/security" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              Security
            </Link>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1d9e75]" />
            Secure by design
          </div>

        </div>

        <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} OneTimeUnlock. Your secrets never touch our servers in plaintext.
          </p>
        </div>
      </div>
    </footer>
  )
}