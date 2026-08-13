'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function LibraryFilters({
  currentStatus,
  currentType,
  currentSort,
}: {
  currentStatus: string
  currentType: string
  currentSort: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'ALL') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/library?${params.toString()}`)
  }

  const statuses = [
    { value: 'ALL', label: 'Semua Status' },
    { value: 'WATCHING', label: 'Watching' },
    { value: 'PLAN_TO_WATCH', label: 'Plan to Watch' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ON_HOLD', label: 'On Hold' },
    { value: 'DROPPED', label: 'Dropped' },
  ]

  const types = [
    { value: 'ALL', label: 'Semua Tipe' },
    { value: 'ANIME', label: 'Anime' },
    { value: 'SERIES', label: 'Series' },
    { value: 'FILM', label: 'Film' },
  ]

  const sortOptions = [
    { value: 'newest', label: 'Terbaru Ditambahkan' },
    { value: 'updated', label: 'Terakhir Diperbarui' },
    { value: 'title', label: 'Judul (A-Z)' },
    { value: 'rating', label: 'Rating Tertinggi' },
  ]

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
      {/* Filter Status */}
      <div className="flex flex-wrap items-center gap-1.5">
        {statuses.map((s) => {
          const isActive = currentStatus === s.value || (s.value === 'ALL' && !currentStatus)
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => updateFilter('status', s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-accent text-background font-semibold'
                  : 'text-muted hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Filter Type & Sort */}
      <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
        <select
          value={currentType || 'ALL'}
          onChange={(e) => updateFilter('type', e.target.value)}
          className="rounded-lg border border-border bg-surface-hover px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
        >
          {types.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={currentSort || 'newest'}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="rounded-lg border border-border bg-surface-hover px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
