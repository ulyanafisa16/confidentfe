// src/app/error.tsx

'use client'

import { useEffect } from 'react'
import Button from '../components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl font-bold text-red-400">500</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Terjadi kesalahan
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
          Terjadi kesalahan yang tidak terduga. Coba refresh halaman atau kembali ke beranda.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" size="md" onClick={reset}>
            Coba lagi
          </Button>
          <Button variant="primary" size="md" onClick={() => window.location.href = '/'}>
            Ke beranda
          </Button>
        </div>
      </div>
    </div>
  )
}