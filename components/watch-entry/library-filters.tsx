'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LibraryFilters({
  currentStatus,
  currentType,
  currentSort,
  currentQuery = '',
}: {
  currentStatus: string
  currentType: string
  currentSort: string
  currentQuery?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchTerm, setSearchTerm] = useState(
    currentQuery || searchParams.get('q') || searchParams.get('query') || ''
  )

  // Debounced Search (350ms) to avoid request spams on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentParamVal = searchParams.get('q') || searchParams.get('query') || ''
      if (searchTerm.trim() !== currentParamVal.trim()) {
        const params = new URLSearchParams(searchParams.toString())
        if (searchTerm.trim()) {
          params.set('q', searchTerm.trim())
        } else {
          params.delete('q')
          params.delete('query')
        }
        startTransition(() => {
          router.replace(`/library?${params.toString()}`, { scroll: false })
        })
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [searchTerm, router, searchParams])

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'ALL') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    startTransition(() => {
      router.replace(`/library?${params.toString()}`, { scroll: false })
    })
  }

  function handleClearSearch() {
    setSearchTerm('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    params.delete('query')
    startTransition(() => {
      router.replace(`/library?${params.toString()}`, { scroll: false })
    })
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
    <div className={`flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 transition-opacity duration-200 ${isPending ? 'opacity-70' : 'opacity-100'}`}>
      {/* Search Input Bar */}
      <div className="relative flex-1 min-w-[220px]">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari berdasarkan judul..."
          className="w-full rounded-xl border border-border/80 bg-surface-hover pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent transition-all"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchTerm && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted hover:text-foreground p-0.5"
            aria-label="Bersihkan pencarian"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Status Pills */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
        {statuses.map((s) => {
          const isActive = currentStatus === s.value || (s.value === 'ALL' && !currentStatus)
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => updateFilter('status', s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-accent text-background font-semibold shadow-sm'
                  : 'text-muted hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Filter Type & Sort Dropdowns */}
      <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60">
        <select
          value={currentType || 'ALL'}
          onChange={(e) => updateFilter('type', e.target.value)}
          className="rounded-xl border border-border/80 bg-surface-hover px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
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
          className="rounded-xl border border-border/80 bg-surface-hover px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
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
