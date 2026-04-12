// src/components/secret/ViewExpired.tsx

import { XCircle } from 'lucide-react'
import Link from 'next/link'
import Button from '../ui/Button'

export default function ViewExpired() {
  return (
    <div className="max-w-md mx-auto px-6 py-16 text-center">

      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-5">
        <XCircle size={26} className="text-red-500" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        This link is no longer valid
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
        This secret has already been opened or has expired. For security reasons, it has been permanently destroyed and cannot be recovered.
      </p>

      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4 mb-8 text-left">
        <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">What happened?</p>
        <p className="text-xs text-red-500 dark:text-red-400/80 leading-relaxed">
          Either the secret was already viewed by someone, the link expired before it was opened, or it was revoked by the sender.
          Contact the person who sent it and ask them to create a new link.
        </p>
      </div>

      <Link href="/">
        <Button variant="outline" size="md" className="w-full">
          Create your own secure link →
        </Button>
      </Link>

    </div>
  )
}