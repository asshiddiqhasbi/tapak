'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateProgress } from '@/lib/actions/watch-entries'
import Toast from '@/components/ui/toast'

type Props = {
  id: string
  type: string
  currentEpisode?: number
  totalEpisodes?: number | null
  currentSeason?: number | null
  totalSeasons?: number | null
  status: string
  isOngoing?: boolean
  rating?: number | null
  notes?: string | null
}

const STATUS_OPTIONS = [
  { value: 'PLAN_TO_WATCH', label: 'Plan to Watch' },
  { value: 'WATCHING', label: 'Watching' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'DROPPED', label: 'Dropped' },
]

export default function ProgressControl({
  id,
  status,
  rating = null,
  notes = null,
}: Props) {
  const router = useRouter()

  const [selectedStatus, setSelectedStatus] = useState(status)
  const [selectedRating, setSelectedRating] = useState<string>(rating ? rating.toString() : '')
  const [noteText, setNoteText] = useState(notes ?? '')

  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setSelectedStatus(status)
    setSelectedRating(rating ? rating.toString() : '')
    setNoteText(notes ?? '')
  }, [status, rating, notes])

  async function handleSaveAll() {
    setLoading(true)
    setMessage(null)

    const numericRating = selectedRating ? parseFloat(selectedRating) : null

    try {
      await updateProgress(id, {
        status: selectedStatus,
        rating: numericRating && !isNaN(numericRating) ? Math.min(Math.max(numericRating, 0), 10) : null,
        notes: noteText,
      })
      router.push('/library')
      router.refresh()
    } catch {
      setMessage('Gagal menyimpan perubahan')
      setLoading(false)
    }
  }

  async function handleMarkCompleted() {
    setLoading(true)
    setMessage(null)
    const numericRating = selectedRating ? parseFloat(selectedRating) : null

    try {
      await updateProgress(id, {
        status: 'COMPLETED',
        rating: numericRating && !isNaN(numericRating) ? Math.min(Math.max(numericRating, 0), 10) : null,
        notes: noteText,
      })
      setSelectedStatus('COMPLETED')
      router.push('/library')
      router.refresh()
    } catch {
      setMessage('Gagal memperbarui status')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 rounded-xl border border-border/80 bg-surface/98 p-5 shadow-xl shadow-black/40">
      <Toast
        message={message}
        type={message?.includes('Gagal') ? 'error' : 'success'}
        onClose={() => setMessage(null)}
      />

      {/* Confirmation Save Modal */}
      {showSaveConfirmModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowSaveConfirmModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border/80 bg-surface p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-accent font-semibold text-xs">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-muted border border-accent/20 text-sm">
                  💾
                </span>
                <span>Konfirmasi Simpan</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Simpan perubahan ini?
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Perubahan status, rating, dan catatan tontonan Anda akan disimpan ke perpustakaan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveConfirmModal(false)}
                disabled={loading}
                className="rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSaveConfirmModal(false)
                  handleSaveAll()
                }}
                disabled={loading}
                className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-background hover:bg-accent-hover transition-colors shadow-md"
              >
                {loading ? 'Menyimpan...' : 'Ya, Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Mark Completed banner if not yet completed */}
      {selectedStatus !== 'COMPLETED' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-muted/20 p-4 text-xs shadow-md">
          <div className="flex items-center gap-2.5 text-foreground font-medium">
            <span className="text-base">🎬</span>
            <span>Sudah selesai menonton film ini? Tandai langsung sebagai tamat.</span>
          </div>
          <button
            type="button"
            onClick={handleMarkCompleted}
            disabled={loading}
            className="flex-shrink-0 rounded-lg bg-accent hover:bg-accent-hover px-3.5 py-1.5 font-bold text-background shadow transition-colors active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : '✓ Tandai Selesai'}
          </button>
        </div>
      )}

      {/* Update Status */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
          Status Tontonan
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          disabled={loading}
          className="w-full rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Update Rating */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
          Rating Personal (Format Desimal, e.g. 8.5)
        </label>
        <div className="space-y-2">
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="1"
              max="10"
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              disabled={loading}
              placeholder="Contoh: 8.5 (1.0 - 10.0)"
              className="w-full rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent placeholder:text-muted/60"
            />
            {selectedRating && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-amber-400">
                ★ {selectedRating} / 10
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-muted text-[10px]">Preset:</span>
            {['7.0', '7.5', '8.0', '8.5', '9.0', '9.5', '10'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setSelectedRating(preset)}
                disabled={loading}
                className={`px-2 py-0.5 rounded-md border transition-colors ${
                  selectedRating === preset
                    ? 'border-amber-500/80 bg-amber-950/60 text-amber-300 font-semibold'
                    : 'border-border/60 bg-surface-hover text-muted hover:text-foreground'
                }`}
              >
                ★ {preset}
              </button>
            ))}
            {selectedRating && (
              <button
                type="button"
                onClick={() => setSelectedRating('')}
                disabled={loading}
                className="px-2 py-0.5 rounded-md text-muted hover:text-rose-400 transition-colors"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Update Notes */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
          Catatan Pribadi
        </label>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Tulis catatan, kesan, atau review pribadi..."
          rows={3}
          className="w-full rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent placeholder:text-muted/60"
        />
      </div>

      {/* Single Save Button with Confirmation Modal Trigger */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={() => setShowSaveConfirmModal(true)}
          disabled={loading}
          className="w-full sm:w-auto rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-background hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  )
}