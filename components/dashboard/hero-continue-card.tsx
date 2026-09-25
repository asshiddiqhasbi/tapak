'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { quickIncrementProgress } from '@/lib/actions/watch-entries'
import { getActiveSeasonStats } from '@/lib/utils'
import Toast from '@/components/ui/toast'

export type HeroContinueEntry = {
  id: string
  title: string
  type: string
  medium: string
  posterUrl: string | null
  currentEpisode: number
  totalEpisodes: number | null
  currentSeason: number | null
  totalSeasons: number | null
  seasonsDetail?: unknown
  isOngoing: boolean
  status: string
  rating: number | null
}

const TYPE_LABELS: Record<string, string> = {
  FILM: 'Film',
  SERIES: 'Series',
}

const MEDIUM_LABELS: Record<string, string> = {
  ANIME: 'Anime',
  LIVE_ACTION: 'Live Action',
  ANIMATION: 'Animasi',
}

export default function HeroContinueCard({ entry }: { entry: HeroContinueEntry }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const typeLabel = TYPE_LABELS[entry.type] || entry.type
  const mediumLabel = MEDIUM_LABELS[entry.medium] || entry.medium

  const stats = getActiveSeasonStats({
    type: entry.type,
    currentEpisode: entry.currentEpisode,
    totalEpisodes: entry.totalEpisodes,
    currentSeason: entry.currentSeason,
    totalSeasons: entry.totalSeasons,
    seasonsDetail: entry.seasonsDetail,
    isOngoing: entry.isOngoing,
  })

  // Quick action CTA label
  let ctaLabel = 'Lanjut Nonton'
  if (stats.isFilm) {
    ctaLabel = 'Tandai Selesai'
  } else if (stats.isLastEpisodeOfSeries) {
    ctaLabel = 'Tamatkan Series'
  } else if (stats.isLastEpisodeOfSeason) {
    ctaLabel = stats.isMultiSeason
      ? `Tamatkan S${stats.activeSeasonNumber}`
      : 'Tamatkan Series'
  } else {
    ctaLabel = stats.isMultiSeason
      ? `Lanjut S${stats.activeSeasonNumber} Ep ${stats.nextEpisodeNumber}`
      : `Lanjut Ep ${stats.nextEpisodeNumber}`
  }

  const handleQuickProgress = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    startTransition(async () => {
      try {
        const result = await quickIncrementProgress(entry.id)
        setToastType('success')
        setToastMessage(result.message)
        router.refresh()
      } catch (err) {
        console.error(err)
        setToastType('error')
        setToastMessage('Gagal memperbarui progres. Coba lagi.')
      }
    })
  }

  const remainingSeasonEpisodes =
    !stats.isFilm && stats.seasonTotalEpisodes > 0
      ? Math.max(0, stats.seasonTotalEpisodes - stats.seasonCurrentEpisode)
      : null

  return (
    <>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="w-full overflow-hidden rounded-2xl border border-border/80 bg-surface p-5 sm:p-6 shadow-md hover:border-border transition-colors duration-200">
        <div className="flex flex-col sm:flex-row gap-5 items-stretch">
          {/* 2:3 Portrait Poster */}
          <Link
            href={`/library/${entry.id}`}
            className="relative self-center sm:self-auto w-36 sm:w-40 md:w-44 aspect-[2/3] shrink-0 overflow-hidden rounded-xl border border-border/70 bg-surface-hover shadow-sm group/poster block"
          >
            {entry.posterUrl ? (
              <Image
                src={entry.posterUrl}
                alt={entry.title}
                fill
                sizes="(max-width: 640px) 150px, 180px"
                className="object-cover group-hover/poster:scale-105 transition-transform duration-300 ease-out"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-muted p-2 text-center">
                <svg className="h-8 w-8 mb-1.5 text-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                <span className="text-[11px] leading-tight line-clamp-2">{entry.title}</span>
              </div>
            )}

            {/* Rating Badge */}
            {entry.rating && (
              <div className="absolute bottom-2 left-2 z-10">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300 bg-background/90 border border-border/80 px-2 py-0.5 rounded shadow-sm">
                  ★ {entry.rating}
                </span>
              </div>
            )}
          </Link>

          {/* Details & Action Controls */}
          <div className="flex-1 min-w-0 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              {/* Badges Bar */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="inline-flex items-center text-[11px] font-medium text-muted bg-surface-hover border border-border/80 px-2.5 py-0.5 rounded-md">
                  {typeLabel} • {mediumLabel}
                </span>
                {entry.isOngoing && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Ongoing
                  </span>
                )}
              </div>

              {/* Title */}
              <Link href={`/library/${entry.id}`} className="block group/title">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground line-clamp-2 group-hover/title:text-accent transition-colors">
                  {entry.title}
                </h3>
              </Link>

              {/* Active Episode & Season Details */}
              <div className="text-xs sm:text-sm font-mono text-muted flex items-center gap-2 flex-wrap">
                {stats.displayEpisodeText ? (
                  <span className="text-foreground font-semibold">
                    {stats.displayEpisodeText}
                  </span>
                ) : (
                  <span>Film • Sedang Ditonton</span>
                )}
              </div>
            </div>

            {/* Progress Bar & Details */}
            <div className="pt-3 border-t border-border/60 space-y-2">
              {stats.progressPct !== null && (
                <>
                  <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${stats.progressPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-muted">
                      {remainingSeasonEpisodes !== null && remainingSeasonEpisodes > 0
                        ? `Sisa ${remainingSeasonEpisodes} episode ${stats.isMultiSeason ? `(S${stats.activeSeasonNumber})` : ''}`
                        : stats.isLastEpisodeOfSeason
                        ? 'Episode terakhir season'
                        : 'Dalam progres'}
                    </span>
                    <span className="font-semibold text-accent">{stats.progressPct}%</span>
                  </div>
                </>
              )}

              {/* Action Buttons: Quick Increment & Detail */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleQuickProgress}
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs sm:text-sm font-semibold text-background hover:bg-accent-hover active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  ) : (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                  <span>{ctaLabel}</span>
                </button>

                <Link
                  href={`/library/${entry.id}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-hover px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:border-accent/40 active:scale-[0.98] transition-all"
                >
                  <span>Detail</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
