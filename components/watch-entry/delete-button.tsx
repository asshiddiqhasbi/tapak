'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { deleteWatchEntry } from '@/lib/actions/watch-entries'

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [loading, setLoading] = useState(false)

  async function executeDelete() {
    setLoading(true)
    try {
      await deleteWatchEntry(id)
      router.push('/library')
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirmModal(true)}
        disabled={loading}
        className="rounded-md border border-rose-900/50 bg-rose-950/40 px-2.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-900/60 hover:text-rose-200 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Menghapus...' : 'Hapus'}
      </button>

      {showConfirmModal &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowConfirmModal(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-border/80 bg-surface p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-950/70 border border-rose-800/50 text-sm">
                    🗑️
                  </span>
                  <span>Konfirmasi Hapus</span>
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Hapus Tontonan Ini?
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Tontonan ini akan dihapus secara permanen dari perpustakaan Anda dan tidak dapat dikembalikan.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={loading}
                  className="rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false)
                    executeDelete()
                  }}
                  disabled={loading}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {loading ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}