// src/components/ui/ConfirmDialog.tsx

'use client'

import { AlertTriangle } from 'lucide-react'
import Button from './Button'

interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-xl w-full max-w-sm">

        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
          variant === 'danger'
            ? 'bg-red-50 dark:bg-red-900/20'
            : 'bg-amber-50 dark:bg-amber-900/20'
        }`}>
          <AlertTriangle
            size={18}
            className={variant === 'danger' ? 'text-red-500' : 'text-amber-500'}
          />
        </div>

        {/* Content */}
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="md"
            className="flex-1"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="danger"
            size="md"
            className="flex-1"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>

      </div>
    </div>
  )
}