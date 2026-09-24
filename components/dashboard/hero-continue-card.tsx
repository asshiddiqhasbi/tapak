'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { updateProgress } from '@/lib/actions/watch-entries'
import { formatEpisodeText } from '@/lib/utils'
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

  const isFilm = entry.type === 'FILM'
  const hasTotal = entry.totalEpisodes !== null && entry.totalEpisodes > 0
  const progressPct =
    !isFilm && hasTotal && entry.totalEpisodes
      ? Math.min(Math.round((entry.currentEpisode / entry.totalEpisodes) * 100), 100)
      : null

  const epFormatted = formatEpisodeText(
    entry.type,
    entry.currentEpisode,
    entry.totalEpisodes,
    entry.currentSeason,
    entry.totalSeasons,
    entry.isOngoing
  )

  const typeIcon = TYPE_ICONS[entry.type] || '🎬'
  const mediumInfo = MEDIUM_BADGES[entry.medium] || { label: 'Live Action', icon: '📽' }

  // Episode calculations
  const nextEpisode = entry.currentEpisode + 1
  const isLastEpisode = hasTotal && entry.totalEpisodes ? entry.currentEpisode >= entry.totalEpisodes : false

  const remainingEpisodes =
    hasTotal && entry.totalEpisodes && !isFilm
      ? Math.max(0, entry.totalEpisodes - entry.currentEpisode)
      : null

  const handleQuickProgress = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    startTransition(async () => {
      try {
        if (isFilm) {
          await updateProgress(entry.id, { status: 'COMPLETED' })
          setToastMessage(`Selamat! "${entry.title}" ditandai selesai! 🎉`)
        } else if (isLastEpisode) {
          await updateProgress(entry.id, {
            currentEpisode: entry.totalEpisodes || entry.currentEpisode,
            status: 'COMPLETED',
          })
          setToastMessage(`Selamat! Tamat menonton "${entry.title}"! 🎉`)
        } else {
          await updateProgress(entry.id, { currentEpisode: nextEpisode })
          setToastMessage(`Update ke Episode ${nextEpisode}! 🍿`)
        }
        router.refresh()
      } catch (err) {
        console.error(err)
        setToastMessage('Gagal memperbarui progres. Coba lagi.')
      }
    })
  }

  return (
    <>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastMessage.includes('Gagal') ? 'error' : 'success'}
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-surface/95 p-4 sm:p-5 shadow-xl shadow-black/25 hover:border-accent/40 transition-all duration-300">
        <Link href={`/library/${entry.id}`} className="block space-y-4">
          {/* 16:9 Cinematic Landscape Frame */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface-hover border border-border/60">
            {entry.posterUrl ? (
              <>
                {/* Ambient Blurred Backdrop */}
                <div
                  className="absolute inset-0 bg-cover bg-center filter blur-xl scale-125 opacity-35"
                  style={{ backgroundImage: `url(${entry.posterUrl})` }}
                />
                {/* Gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-surface/60 via-transparent to-transparent" />

                {/* Sharp Center / Covered Artwork */}
                <Image
                  src={entry.posterUrl}
                  alt={entry.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-surface to-surface-hover text-muted">
                <span className="text-4xl opacity-50 mb-2">🎬</span>
                <span className="text-xs font-mono">Belum ada gambar poster</span>
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white bg-black/75 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-md shadow-sm">
                <span>{typeIcon} {entry.type}</span>
                <span>•</span>
                <span>{mediumInfo.label}</span>
              </span>
              {entry.isOngoing && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-black/75 backdrop-blur-md border border-emerald-500/40 px-2 py-1 rounded-md shadow-sm">
                  🟢 ONGOING
                </span>
              )}
            </div>

            {/* Resolution / Format Tag (Editorial detail from reference) */}
            <div className="absolute top-3 right-3 z-10">
              <span className="inline-block text-[9px] font-mono font-bold tracking-widest text-zinc-300 bg-black/80 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded shadow-sm">
                HD
              </span>
            </div>

            {/* Quick Play overlay icon on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-background shadow-lg shadow-accent/30 scale-90 group-hover:scale-100 transition-transform">
                <svg className="h-6 w-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Title & Metadata */}
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground line-clamp-1 group-hover:text-accent transition-colors">
              {entry.title}
            </h3>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted font-mono">
              {epFormatted ? (
                <span>{epFormatted}</span>
              ) : (
                <span>Film • Sedang Ditonton</span>
              )}
              {entry.rating && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    ★ {entry.rating}
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>

        {/* Progress Bar & Details */}
        <div className="mt-4 pt-3 border-t border-border/70 space-y-2">
          {progressPct !== null && (
            <>
              <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-muted">
                  {remainingEpisodes !== null && remainingEpisodes > 0
                    ? `Sisa ${remainingEpisodes} episode`
                    : isLastEpisode
                    ? 'Episode terakhir'
                    : 'Dalam progres'}
                </span>
                <span className="font-bold text-accent">{progressPct}%</span>
              </div>
            </>
          )}

          {/* Action CTAs: [▶ CONTINUE] and [ⓘ DETAILS] */}
          <div className="pt-2 flex items-center gap-3">
            <button
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
              <span>
                {isFilm
                  ? 'Tandai Selesai'
                  : isLastEpisode
                  ? 'Tamatkan Series'
                  : `Lanjut Eps ${nextEpisode}`}
              </span>
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
    </>
  )
}
