// src/components/ui/Footer.tsx

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 mt-16">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1a6b5e]" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              SecretDrop
            </span>
            <span className="text-xs text-gray-400">
              — Share secrets that disappear
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
            <Link
              href="/login"
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Register
            </Link>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1d9e75]" />
            End-to-end encrypted · Zero knowledge
          </div>

        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} SecretDrop. Your secrets never touch our servers in plaintext.
          </p>
        </div>
      </div>
    </footer>
  )
}