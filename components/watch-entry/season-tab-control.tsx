'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateSeasonDetail, addNewSeasonToWatchEntry } from '@/lib/actions/watch-entries'
import Toast from '@/components/ui/toast'
import type { SeasonDetailItem } from '@/lib/utils'

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PLAN_TO_WATCH: { label: 'Plan to Watch', className: 'bg-blue-950/60 text-blue-300 border-blue-800/50' },
  WATCHING: { label: 'Watching', className: 'bg-amber-950/60 text-amber-300 border-amber-800/50' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50' },
  ON_HOLD: { label: 'On Hold', className: 'bg-purple-950/60 text-purple-300 border-purple-800/50' },
  DROPPED: { label: 'Dropped', className: 'bg-rose-950/60 text-rose-300 border-rose-800/50' },
}

const STATUS_OPTIONS = [
  { value: 'PLAN_TO_WATCH', label: 'Plan to Watch' },
  { value: 'WATCHING', label: 'Watching' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'DROPPED', label: 'Dropped' },
]

export default function SeasonTabControl({
  id,
  seasons,
  currentActiveSeasonNumber = 1,
  isOngoing = false,
}: {
  id: string
  seasons: SeasonDetailItem[]
  currentActiveSeasonNumber?: number
  isOngoing?: boolean
}) {
  const router = useRouter()
  const [activeSeasonNumber, setActiveSeasonNumber] = useState(currentActiveSeasonNumber)

  const activeSeason =
    seasons.find((s) => s.seasonNumber === activeSeasonNumber) || seasons[0]

  const [status, setStatus] = useState<string>(activeSeason.status)
  const [episode, setEpisode] = useState<number>(activeSeason.currentEpisode)
  const [rating, setRating] = useState<string>(
    activeSeason.rating ? activeSeason.rating.toString() : ''
  )
  const [notes, setNotes] = useState<string>(activeSeason.notes ?? '')

  const [loading, setLoading] = useState(false)
  const [isAddingSeason, setIsAddingSeason] = useState(false)
  const [showAddSeasonModal, setShowAddSeasonModal] = useState(false)
  const [newSeasonEps, setNewSeasonEps] = useState('12')

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    if (activeSeason) {
      setStatus(activeSeason.status)
      setEpisode(activeSeason.currentEpisode)
      setRating(activeSeason.rating ? activeSeason.rating.toString() : '')
      setNotes(activeSeason.notes ?? '')
    }
  }, [activeSeasonNumber, seasons])

  async function handleSaveSeason() {
    setLoading(true)
    setToastMessage(null)

    let ep = episode
    if (isNaN(ep) || ep < 0) ep = 0
    if (!isOngoing && activeSeason.episodes > 0 && ep > activeSeason.episodes) {
      ep = activeSeason.episodes
    }

    const parsedRating = rating ? parseFloat(rating) : null

    try {
      await updateSeasonDetail(id, activeSeasonNumber, {
        status,
        currentEpisode: ep,
        rating: parsedRating && !isNaN(parsedRating) ? Math.min(Math.max(parsedRating, 0), 10) : null,
        notes: notes || null,
      })
      setToastType('success')
      setToastMessage(`Berhasil memperbarui Season ${activeSeasonNumber}`)
      setLoading(false)
      router.refresh()
    } catch {
      setToastType('error')
      setToastMessage('Gagal menyimpan perubahan season')
      setLoading(false)
    }
  }

  async function handleConfirmAddSeason() {
    setIsAddingSeason(true)
    setToastMessage(null)
    const eps = parseInt(newSeasonEps) || 12

    try {
      const createdSeasonNum = await addNewSeasonToWatchEntry(id, eps)
      setShowAddSeasonModal(false)
      setIsAddingSeason(false)
      setActiveSeasonNumber(createdSeasonNum)
      setToastType('success')
      setToastMessage(`Berhasil menambahkan Season ${createdSeasonNum}`)
      router.refresh()
    } catch {
      setIsAddingSeason(false)
      setToastType('error')
      setToastMessage('Gagal menambahkan season baru')
    }
  }

  function handlePlusOne() {
    const maxEp = !isOngoing && activeSeason.episodes > 0 ? activeSeason.episodes : Infinity
    const nextEp = Math.min(episode + 1, maxEp)
    setEpisode(nextEp)
    if (!isOngoing && nextEp === activeSeason.episodes && status !== 'COMPLETED') {
      setStatus('COMPLETED')
    }
  }

  function handleStatusChange(newStatus: string) {
    setStatus(newStatus)
    if (newStatus === 'COMPLETED') {
      setEpisode(activeSeason.episodes)
    } else if (newStatus === 'PLAN_TO_WATCH') {
      setEpisode(0)
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border border-border/80 bg-surface/95 backdrop-blur-md p-5 shadow-xl shadow-black/40">
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage(null)}
      />

      {/* Modal Add Season */}
      {showAddSeasonModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowAddSeasonModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border/80 bg-surface p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-accent font-semibold text-xs">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-muted border border-accent/20 text-sm">
                  📺
                </span>
                <span>Tambah Season</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Tambah Season {seasons.length + 1}?
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Tambahkan season baru ke tontonan ini. Masukkan jumlah total episode untuk Season {seasons.length + 1}.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Total Episode Season {seasons.length + 1}
              </label>
              <input
                type="number"
                min={1}
                value={newSeasonEps}
                onChange={(e) => setNewSeasonEps(e.target.value)}
                disabled={isAddingSeason}
                className="w-full rounded-lg border border-border bg-surface-hover px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                placeholder="12"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddSeasonModal(false)}
                disabled={isAddingSeason}
                className="rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAddSeason}
                disabled={isAddingSeason}
                className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-background hover:bg-accent-hover transition-colors shadow-md disabled:opacity-50"
              >
                {isAddingSeason ? 'Menambahkan...' : `+ Tambah Season ${seasons.length + 1}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Tab Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
            <span>📺 Manajemen Season ({seasons.length} Season)</span>
          </h2>
          <button
            type="button"
            onClick={() => setShowAddSeasonModal(true)}
            className="inline-flex items-center gap-1 text-xs text-accent font-semibold hover:underline"
          >
            <span>+ Tambah Season</span>
          </button>
        </div>

        {/* Season Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {seasons.map((s) => {
            const isActive = s.seasonNumber === activeSeasonNumber
            const badge = STATUS_BADGES[s.status] || { label: s.status, className: 'bg-gray-800 text-gray-300' }

            return (
              <button
                key={s.seasonNumber}
                type="button"
                onClick={() => setActiveSeasonNumber(s.seasonNumber)}
                className={`flex-shrink-0 flex flex-col items-start gap-1 rounded-xl px-3.5 py-2 text-left border transition-all ${
                  isActive
                    ? 'border-accent bg-accent/15 text-foreground ring-2 ring-accent/30 shadow-md'
                    : 'border-border/80 bg-surface hover:bg-surface-hover text-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <span>Season {s.seasonNumber}</span>
                  {s.rating && (
                    <span className="text-amber-400 font-semibold text-[11px]">
                      ★ {s.rating}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className={`px-1.5 py-0.2 rounded border ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className="text-muted">
                    {s.currentEpisode}/{s.episodes} eps
                  </span>
                </div>
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => setShowAddSeasonModal(true)}
            disabled={loading || isAddingSeason}
            className="flex-shrink-0 flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-3 border border-dashed border-accent/60 bg-accent-muted/20 hover:bg-accent-muted/40 text-accent font-semibold text-xs transition-all shadow-sm"
          >
            <span>+ Season Baru</span>
          </button>
        </div>
      </div>

      {/* Active Season Edit Card */}
      <div className="rounded-xl border border-accent/30 bg-accent-muted/15 p-4 sm:p-5 space-y-5 animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Pengaturan Season {activeSeason.seasonNumber}
            </h3>
            <p className="text-xs text-muted">
              Ubah status, episode, rating, dan catatan khusus untuk Season {activeSeason.seasonNumber}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-accent block">
              {activeSeason.episodes} Episode Total
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Status Season */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Status Season {activeSeason.seasonNumber}
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-border bg-surface-hover px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Episode Progress in Season */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Progress Episode ({activeSeason.episodes > 0 ? `Eps ${episode}/${activeSeason.episodes}` : `Eps ${episode}`})
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={episode}
                onChange={(e) => setEpisode(parseInt(e.target.value) || 0)}
                disabled={loading}
                className="w-24 rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                min={0}
                max={activeSeason.episodes > 0 ? activeSeason.episodes : undefined}
              />
              <span className="text-xs text-muted font-medium">
                {activeSeason.episodes > 0 ? `/ ${activeSeason.episodes} eps` : 'eps'}
              </span>
              <button
                type="button"
                onClick={handlePlusOne}
                disabled={loading || episode >= activeSeason.episodes}
                className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-background hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-sm"
              >
                +1 Ep
              </button>
            </div>
          </div>
        </div>

        {/* Season Rating Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5 flex items-center justify-between">
            <span>Rating Khusus Season {activeSeason.seasonNumber}</span>
            {status === 'COMPLETED' && (
              <span className="text-[10px] text-accent font-normal border border-accent/30 bg-accent-muted px-2 py-0.5 rounded-full">
                ✨ Berikan nilai untuk Season {activeSeason.seasonNumber}
              </span>
            )}
          </label>
          <div className="space-y-2">
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                disabled={loading}
                placeholder="Contoh: 9.0 (1.0 - 10.0)"
                className="w-full rounded-lg border border-border bg-surface-hover px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent placeholder:text-muted/60"
              />
              {rating && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-amber-400">
                  ★ {rating} / 10
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-muted text-[10px]">Preset:</span>
              {['7.0', '7.5', '8.0', '8.5', '9.0', '9.5', '10'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRating(preset)}
                  disabled={loading}
                  className={`px-2 py-0.5 rounded-md border transition-colors ${
                    rating === preset
                      ? 'border-amber-500/80 bg-amber-950/60 text-amber-300 font-semibold'
                      : 'border-border/60 bg-surface-hover text-muted hover:text-foreground'
                  }`}
                >
                  ★ {preset}
                </button>
              ))}
              {rating && (
                <button
                  type="button"
                  onClick={() => setRating('')}
                  disabled={loading}
                  className="px-2 py-0.5 rounded-md text-muted hover:text-rose-400 transition-colors"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Season Notes Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
            Catatan / Review Season {activeSeason.seasonNumber} (opsional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            placeholder={`Kesan atau review pribadi untuk Season ${activeSeason.seasonNumber}...`}
            rows={2}
            className="w-full rounded-lg border border-border bg-surface-hover px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-accent placeholder:text-muted/60"
          />
        </div>

        {/* Submit Season Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveSeason}
            disabled={loading}
            className="w-full sm:w-auto rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-background hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? 'Menyimpan...' : `Simpan Perubahan Season ${activeSeason.seasonNumber}`}
          </button>
        </div>
      </div>
    </div>
  )
}
