'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import DeleteButton from '@/components/watch-entry/delete-button'
import { formatEpisodeText } from '@/lib/utils'
import { deleteMultipleWatchEntries } from '@/lib/actions/watch-entries'

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PLAN_TO_WATCH: { label: 'Plan to Watch', className: 'bg-blue-950/60 text-blue-300 border-blue-800/50' },
  WATCHING: { label: 'Watching', className: 'bg-amber-950/60 text-amber-300 border-amber-800/50' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50' },
  ON_HOLD: { label: 'On Hold', className: 'bg-purple-950/60 text-purple-300 border-purple-800/50' },
  DROPPED: { label: 'Dropped', className: 'bg-rose-950/60 text-rose-300 border-rose-800/50' },
}

function formatDateShort(date: Date | string) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export interface WatchEntryItem {
  id: string
  title: string
  type: string
  medium?: string
  status: string
  posterUrl?: string | null
  totalEpisodes?: number | null
  currentEpisode: number
  totalSeasons?: number | null
  currentSeason?: number | null
  rating?: number | null
  startedAt?: Date | null
  completedAt?: Date | null
}

const MEDIUM_BADGES: Record<string, { label: string; icon: string }> = {
  ANIME: { label: 'Anime', icon: '🍿' },
  LIVE_ACTION: { label: 'Live Action', icon: '📽' },
  ANIMATION: { label: 'Animasi', icon: '🎨' },
}

const TYPE_ICONS: Record<string, string> = {
  FILM: '🎬',
  SERIES: '📺',
  ANIME: '🍿',
}

export default function BulkDeleteManager({
  entries,
  searchQuery,
}: {
  entries: WatchEntryItem[]
  searchQuery?: string
}) {
  const router = useRouter()
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const isAllSelected = entries.length > 0 && selectedIds.length === entries.length

  function toggleSelectMode() {
    if (isSelectMode) {
      setIsSelectMode(false)
      setSelectedIds([])
    } else {
      setIsSelectMode(true)
    }
  }

  function toggleSelectEntry(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(entries.map((e) => e.id))
    }
  }

  async function handleBulkDelete() {
    if (!selectedIds.length) return
    setLoading(true)
    try {
      await deleteMultipleWatchEntries(selectedIds)
      setShowConfirmModal(false)
      setSelectedIds([])
      setIsSelectMode(false)
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header bar controls for Bulk Select Mode */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <div className="text-xs text-muted">
            {isSelectMode ? (
              <span className="text-accent font-medium">
                {selectedIds.length} dari {entries.length} tontonan dipilih
              </span>
            ) : (
              <span>Menampilkan {entries.length} tontonan</span>
            )}
          </div>

          <button
            type="button"
            onClick={toggleSelectMode}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isSelectMode
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border/80 bg-surface hover:bg-surface-hover text-muted hover:text-foreground'
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isSelectMode ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              )}
            </svg>
            <span>{isSelectMode ? 'Batal Kelola' : 'Pilih Beberapa'}</span>
          </button>
        </div>
      )}

      {/* Grid of Entries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map((entry) => {
          const isSelected = selectedIds.includes(entry.id)
          const badge = STATUS_BADGES[entry.status] ?? {
            label: entry.status,
            className: 'bg-gray-800 text-gray-300 border-gray-700',
          }
          const epText = formatEpisodeText(
            entry.type,
            entry.currentEpisode,
            entry.totalEpisodes,
            entry.currentSeason,
            entry.totalSeasons
          )
          const progressPct =
            entry.type !== 'FILM' && entry.totalEpisodes && entry.totalEpisodes > 0
              ? Math.min(Math.round((entry.currentEpisode / entry.totalEpisodes) * 100), 100)
              : null
          const typeIcon = TYPE_ICONS[entry.type] || '🎬'

          return (
            <div
              key={entry.id}
              onClick={() => {
                if (isSelectMode) toggleSelectEntry(entry.id)
              }}
              className={`group relative flex flex-col justify-between rounded-2xl border bg-surface/95 backdrop-blur-md p-4 transition-all duration-300 ease-out shadow-xl shadow-black/30 ${
                isSelectMode ? 'cursor-pointer select-none' : ''
              } ${
                isSelected
                  ? 'border-accent bg-accent/5 ring-2 ring-accent/30'
                  : 'border-border/80 hover:border-accent/60 hover:bg-surface hover:-translate-y-1'
              }`}
            >
              {/* Checkbox indicator when in Select Mode */}
              {isSelectMode && (
                <div className="absolute top-3.5 right-3.5 z-10">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                      isSelected
                        ? 'bg-accent border-accent text-background'
                        : 'border-border bg-surface-hover hover:border-accent'
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex gap-4">
                  {/* Opsi B: Hanya tampilkan bingkai gambar jika posterUrl benar-benar ada */}
                  {entry.posterUrl && (
                    <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface-hover shadow-sm">
                      <Image
                        src={entry.posterUrl}
                        alt={entry.title}
                        fill
                        sizes="80px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap pr-6">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent-muted border border-accent/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <span>{typeIcon} {entry.type}</span>
                        <span>•</span>
                        <span>{MEDIUM_BADGES[entry.medium || 'LIVE_ACTION']?.icon || '🍿'} {MEDIUM_BADGES[entry.medium || 'LIVE_ACTION']?.label || 'Live Action'}</span>
                      </span>
                      <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded border ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>

                    {isSelectMode ? (
                      <span className="font-semibold text-foreground text-base line-clamp-1 block">
                        {entry.title}
                      </span>
                    ) : (
                      <Link
                        href={`/library/${entry.id}`}
                        className="font-semibold text-foreground text-base line-clamp-1 group-hover:text-accent transition-colors block"
                      >
                        {entry.title}
                      </Link>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted">
                      {epText && <span>{epText}</span>}
                      {entry.rating && (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          ★ {entry.rating}/10
                        </span>
                      )}
                    </div>

                    {/* Display dates: For FILM, only show Selesai date */}
                    <div className="flex items-center gap-3 text-[11px] text-muted/80 pt-0.5 flex-wrap">
                      {entry.type !== 'FILM' && entry.startedAt && (
                        <span>Mulai {formatDateShort(entry.startedAt)}</span>
                      )}
                      {entry.type !== 'FILM' && entry.startedAt && entry.completedAt && <span>•</span>}
                      {entry.completedAt && (
                        <span>Selesai {formatDateShort(entry.completedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {progressPct !== null && (
                  <div className="h-1.5 w-full rounded-full bg-border/80 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>

              {!isSelectMode && (
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                  <Link
                    href={`/library/${entry.id}`}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Detail & Progress &rarr;
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/library/${entry.id}/edit`}
                      className="rounded-md bg-surface-hover border border-border/60 px-2.5 py-1 text-xs text-foreground hover:bg-border transition-colors"
                    >
                      Edit
                    </Link>
                    <DeleteButton id={entry.id} />
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Ghost Card Placeholder when library items are few */}
        {entries.length < 4 && !searchQuery && !isSelectMode && (
          <Link
            href="/library/new"
            className="group flex items-center gap-4 rounded-2xl border-2 border-dashed border-border/80 bg-surface/40 hover:bg-surface/70 hover:border-accent/60 transition-all duration-300 p-4 shadow-sm"
          >
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent font-bold text-xl group-hover:scale-110 transition-transform">
              +
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-foreground text-sm group-hover:text-accent transition-colors block">
                Tambah Tontonan Baru
              </span>
              <span className="text-xs text-muted block mt-0.5">
                Klik untuk menambahkan judul anime, series, atau film baru ke perpustakaan Anda
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* Floating Action Bar when items selected */}
      {isSelectMode && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg animate-in slide-in-from-bottom-6 duration-300">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-surface/95 backdrop-blur-xl p-3 sm:px-4 shadow-2xl shadow-black/60 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="rounded-lg bg-surface-hover px-2.5 py-1.5 font-medium text-foreground hover:bg-border transition-colors"
              >
                {isAllSelected ? 'Batal Semua' : 'Pilih Semua'}
              </button>
              <span className="font-semibold text-accent hidden sm:inline">
                {selectedIds.length} dipilih
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-accent sm:hidden">
                {selectedIds.length} dipilih
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedIds([])
                  setIsSelectMode(false)
                }}
                className="rounded-xl border border-border px-3 py-1.5 font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 font-semibold text-white hover:bg-rose-500 transition-colors shadow-md disabled:opacity-50"
              >
                <span>🗑️ Hapus</span>
                <span className="bg-rose-800/80 px-1.5 py-0.5 rounded-md text-[10px]">
                  {selectedIds.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal Confirmation */}
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
                  <span>Konfirmasi Hapus Banyak</span>
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Hapus {selectedIds.length} Tontonan Terpilih?
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {selectedIds.length} judul tontonan yang dipilih akan dihapus secara permanen dari perpustakaan Anda dan tidak dapat dikembalikan.
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
                  onClick={handleBulkDelete}
                  disabled={loading}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {loading ? 'Menghapus...' : `Ya, Hapus (${selectedIds.length})`}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
