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

const TYPE_ICONS: Record<string, string> = {
  FILM: '🎬',
  SERIES: '📺',
}

const MEDIUM_BADGES: Record<string, { label: string; icon: string }> = {
  ANIME: { label: 'Anime', icon: '🍿' },
  LIVE_ACTION: { label: 'Live Action', icon: '📽' },
  ANIMATION: { label: 'Animasi', icon: '🎨' },
}

export default function HeroContinueCard({ entry }: { entry: HeroContinueEntry }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const typeIcon = TYPE_ICONS[entry.type] || '🎬'
  const mediumInfo = MEDIUM_BADGES[entry.medium] || { label: 'Live Action', icon: '📽' }

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

      <div className="group relative w-full overflow-hidden rounded-2xl border border-border/80 bg-surface/95 p-4 sm:p-6 shadow-xl shadow-black/30 hover:border-accent/50 transition-all duration-300">
        {/* Ambient Blurred Backdrop from artwork */}
        {entry.posterUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-125 pointer-events-none transition-opacity duration-500 group-hover:opacity-30"
            style={{ backgroundImage: `url(${entry.posterUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/85 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row gap-5 items-stretch">
          {/* Uncropped 2:3 Portrait Poster */}
          <Link
            href={`/library/${entry.id}`}
            className="relative self-center sm:self-auto w-36 sm:w-40 md:w-44 aspect-[2/3] shrink-0 overflow-hidden rounded-xl border border-border/80 bg-surface-hover shadow-lg group/poster block"
          >
            {entry.posterUrl ? (
              <Image
                src={entry.posterUrl}
                alt={entry.title}
                fill
                sizes="(max-width: 640px) 150px, 180px"
                className="object-cover group-hover/poster:scale-105 transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-muted p-2 text-center">
                <span className="text-3xl mb-1">🎬</span>
                <span className="text-[10px] font-mono leading-tight">{entry.title}</span>
              </div>
            )}

            {/* Subtle Rating Badge on Poster corner */}
            {entry.rating && (
              <div className="absolute bottom-2 left-2 z-10">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-black/80 backdrop-blur-md border border-amber-400/30 px-2 py-0.5 rounded shadow-sm">
                  ★ {entry.rating}
                </span>
              </div>
            )}
          </Link>

          {/* Details & Action Controls */}
          <div className="flex-1 min-w-0 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              {/* Badges Bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-accent bg-accent-muted border border-accent/20 px-2.5 py-0.5 rounded-md shadow-sm">
                  <span>{typeIcon} {entry.type}</span>
                  <span>•</span>
                  <span>{mediumInfo.icon} {mediumInfo.label}</span>
                </span>
                {entry.isOngoing && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-0.5 rounded-md shadow-sm">
                    🟢 ONGOING
                  </span>
                )}
              </div>

              {/* Title */}
              <Link href={`/library/${entry.id}`} className="block group/title">
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground line-clamp-2 group-hover/title:text-accent transition-colors">
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
            <div className="pt-2 border-t border-border/70 space-y-2">
              {stats.progressPct !== null && (
                <>
                  <div className="h-2 w-full rounded-full bg-border/80 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
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
                    <span className="font-bold text-accent">{stats.progressPct}%</span>
                  </div>
                </>
              )}

              {/* Action Buttons: Quick Increment & Detail */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleQuickProgress}
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs sm:text-sm font-bold text-background hover:bg-accent-hover active:scale-[0.98] transition-all shadow-md shadow-accent/20 disabled:opacity-50 cursor-pointer"
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
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/90 bg-surface-hover/80 px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-surface-hover hover:border-accent/40 active:scale-[0.98] transition-all shadow-sm"
                >
                  <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
