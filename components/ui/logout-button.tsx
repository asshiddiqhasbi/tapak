'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleConfirmLogout() {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const modalContent = showConfirm && (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => setShowConfirm(false)}
    >
      <div
        className="relative my-auto w-full max-w-sm rounded-2xl border border-border/80 bg-surface p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-950/70 border border-amber-800/50 text-sm">
              🚪
            </span>
            <span>Konfirmasi Logout</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Yakin ingin keluar?
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            Anda perlu masuk kembali untuk mengakses jurnal tontonan dan memperbarui progres episode.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            disabled={loading}
            className="rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirmLogout}
            disabled={loading}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Ya, Keluar'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-semibold text-muted hover:text-foreground hover:border-accent/60 hover:bg-surface-hover transition-colors shadow-sm"
      >
        Keluar
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  )
}