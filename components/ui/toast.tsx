'use client'

import { useEffect } from 'react'

type ToastProps = {
  message: string | null
  type?: 'error' | 'success'
  onClose: () => void
  duration?: number
}

export default function Toast({
  message,
  type = 'error',
  onClose,
  duration = 4500,
}: ToastProps) {
  useEffect(() => {
    if (!message) return

    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  if (!message) return null

  const isError = type === 'error'

  return (
    <div
      className={`rounded-xl border p-3.5 text-xs font-semibold flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-300 ${
        isError
          ? 'bg-rose-950/85 border-rose-800/60 text-rose-200'
          : 'bg-emerald-950/85 border-emerald-800/60 text-emerald-200'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span>{isError ? '⚠️' : '✓'}</span>
        <span className="break-words">{message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex-shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 hover:bg-white/10 transition-opacity"
        aria-label="Tutup notifikasi"
      >
        ✕
      </button>
    </div>
  )
}
