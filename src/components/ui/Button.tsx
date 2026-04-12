// src/components/ui/Button.tsx

import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          // variant
          'bg-[#1a6b5e] text-white hover:bg-[#0f5347] focus:ring-[#1a6b5e]':
            variant === 'primary',
          'border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-300 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800':
            variant === 'outline',
          'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-300 dark:text-gray-400 dark:hover:bg-gray-800':
            variant === 'ghost',
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500':
            variant === 'danger',
          // size
          'text-xs px-3 py-1.5': size === 'sm',
          'text-sm px-4 py-2.5': size === 'md',
          'text-base px-5 py-3': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}