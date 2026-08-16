'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateProgress } from '@/lib/actions/watch-entries'
import Toast from '@/components/ui/toast'
import { formatEpisodeText } from '@/lib/utils'

type Props = {
  id: string
  type: string
  currentEpisode: number
  totalEpisodes: number | null
  status: string
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
  type,
  currentEpisode,
  totalEpisodes,
  status,
  rating = null,
  notes = null,
}: Props) {
  const router = useRouter()

  const [episode, setEpisode] = useState(currentEpisode)
  const [selectedStatus, setSelectedStatus] = useState(status)
  const [selectedRating, setSelectedRating] = useState<string>(rating ? rating.toString() : '')
  const [noteText, setNoteText] = useState(notes ?? '')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setEpisode(currentEpisode)
    setSelectedStatus(status)
    setSelectedRating(rating ? rating.toString() : '')
    setNoteText(notes ?? '')
  }, [currentEpisode, status, rating, notes])

  async function handleSaveAll() {
    setLoading(true)
    setMessage(null)

    let ep = episode
    if (isNaN(ep) || ep < 0) ep = 0
    if (type !== 'FILM' && totalEpisodes && totalEpisodes > 0 && ep > totalEpisodes) {
      ep = totalEpisodes
    }

    const numericRating = selectedRating ? parseInt(selectedRating, 10) : null

    try {
      await updateProgress(id, {
        currentEpisode: ep,
        status: selectedStatus,
        rating: numericRating,
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
    const targetEp = totalEpisodes && totalEpisodes > 0 ? totalEpisodes : episode
    const numericRating = selectedRating ? parseInt(selectedRating, 10) : null

    try {
      await updateProgress(id, {
        currentEpisode: targetEp,
        status: 'COMPLETED',
        rating: numericRating,
        notes: noteText,
      })
      router.push('/library')
      router.refresh()
    } catch {
      setMessage('Gagal memperbarui status')
      setLoading(false)
    }
  }

  async function handlePlusOne() {
    const maxEp = totalEpisodes && totalEpisodes > 0 ? totalEpisodes : Infinity
    const nextEp = Math.min(episode + 1, maxEp)
    setEpisode(nextEp)

    setLoading(true)
    setMessage(null)

    const numericRating = selectedRating ? parseInt(selectedRating, 10) : null

    try {
      await updateProgress(id, {
        currentEpisode: nextEp,
        status: selectedStatus,
        rating: numericRating,
        notes: noteText,
      })
      router.refresh()
      setMessage('Progress +1 tersimpan!')
      setTimeout(() => setMessage(null), 2500)
    } catch {
      setMessage('Gagal menyimpan progress')
    } finally {
      setLoading(false)
    }
  }

  const isPlusOneDisabled =
    loading || (type === 'FILM') || (totalEpisodes !== null && totalEpisodes > 0 && episode >= totalEpisodes)

  const episodeText = formatEpisodeText(type, episode, totalEpisodes)

  // Smart suggestion condition:
  // Non-film, currently WATCHING, totalEpisodes exists & > 0, currentEpisode >= totalEpisodes
  const showCompletionBanner =
    type !== 'FILM' &&
    selectedStatus === 'WATCHING' &&
    totalEpisodes !== null &&
    totalEpisodes > 0 &&
    episode >= totalEpisodes

  return (
    <div className="space-y-6 rounded-xl border border-border/80 bg-surface/95 backdrop-blur-md p-5 shadow-xl shadow-black/40">
      <Toast
        message={message}
        type={message?.includes('Gagal') ? 'error' : 'success'}
        onClose={() => setMessage(null)}
      />

      {/* Smart Suggestion Banner */}
      {showCompletionBanner && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-emerald-800/60 bg-emerald-950/80 p-4 text-xs shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-emerald-200 font-medium">
            <span className="text-base">🎉</span>
            <span>
              Kamu sudah menonton semua episode ({episode}/{totalEpisodes})! Tandai sebagai selesai?
            </span>
          </div>
          <button
            type="button"
            onClick={handleMarkCompleted}
            disabled={loading}
            className="flex-shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 font-semibold text-white shadow transition-colors active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Tandai Selesai'}
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

      {/* Update Progress Episode (Hidden for FILM) */}
      {type !== 'FILM' && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
            Progress Episode ({episodeText})
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              value={episode}
              onChange={(e) => setEpisode(parseInt(e.target.value) || 0)}
              className="w-24 rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              min={0}
              max={totalEpisodes && totalEpisodes > 0 ? totalEpisodes : undefined}
            />
            <span className="text-sm font-medium text-muted">
              / {totalEpisodes && totalEpisodes > 0 ? `${totalEpisodes} eps` : 'Ongoing'}
            </span>
            <button
              type="button"
              onClick={handlePlusOne}
              disabled={isPlusOneDisabled}
              className="rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-background hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-sm"
            >
              +1 Episode
            </button>
          </div>
        </div>
      )}

      {/* Update Rating */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
          Rating Personal (1 - 10)
        </label>
        <select
          value={selectedRating}
          onChange={(e) => setSelectedRating(e.target.value)}
          disabled={loading}
          className="w-full rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
        >
          <option value="">-- Belum Dinilai --</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <option key={num} value={num.toString()}>
              ★ {num} / 10
            </option>
          ))}
        </select>
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

      {/* Single Save Button */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={loading}
          className="w-full sm:w-auto rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-background hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  )
}