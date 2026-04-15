// src/app/not-found.tsx

import Link from 'next/link'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl font-bold text-gray-400">404</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Page not found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <Link href="/">
          <Button variant="primary" size="md">Kembali ke beranda</Button>
        </Link>
      </div>
    </div>
  )
}