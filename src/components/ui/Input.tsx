// src/components/ui/Input.tsx

import { clsx } from 'clsx'
import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, type, ...props }, ref) => {
    const [show, setShow] = useState(false)
    const isPassword = type === 'password'

    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={isPassword && show ? 'text' : type}
            className={clsx(
              'w-full text-sm px-3.5 py-2.5 rounded-lg border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none transition-all duration-150',
              'focus:border-[#1d9e75] focus:ring-1 focus:ring-[#1d9e75] focus:bg-white dark:focus:bg-gray-950',
              error
                ? 'border-red-400 dark:border-red-600'
                : 'border-gray-200 dark:border-gray-700',
              isPassword && 'pr-10',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-500">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input