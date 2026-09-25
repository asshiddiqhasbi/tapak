import Link from 'next/link'
import Image from 'next/image'
import { getActiveSeasonStats } from '@/lib/utils'

export type SecondaryContinueEntry = {
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
}

export default function SecondaryContinueCard({ entry }: { entry: SecondaryContinueEntry }) {
  const stats = getActiveSeasonStats({
    type: entry.type,
    currentEpisode: entry.currentEpisode,
    totalEpisodes: entry.totalEpisodes,
    currentSeason: entry.currentSeason,
    totalSeasons: entry.totalSeasons,
    seasonsDetail: entry.seasonsDetail,
    isOngoing: entry.isOngoing,
  })

  return (
    <Link
      href={`/library/${entry.id}`}
      className="group flex items-center gap-3.5 rounded-xl border border-border/80 bg-surface/90 p-3 hover:border-accent/60 hover:bg-surface-hover hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
    >
      {/* 2:3 Portrait Thumbnail box */}
      <div className="relative h-16 w-12 sm:h-[72px] sm:w-[48px] shrink-0 overflow-hidden rounded-lg bg-surface-hover border border-border/60 shadow-inner">
        {entry.posterUrl ? (
          <Image
            src={entry.posterUrl}
            alt={entry.title}
            fill
            sizes="48px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted/60">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 py-0.5">
        <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-accent transition-colors">
          {entry.title}
        </h4>
        <p className="text-xs text-muted font-mono truncate mt-0.5">
          {stats.displayEpisodeText || (stats.isFilm ? 'Film • Sedang Ditonton' : `Episode ${entry.currentEpisode}`)}
        </p>

        {stats.progressPct !== null ? (
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${stats.progressPct}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-muted">
              <span>{stats.isMultiSeason ? `Season ${stats.activeSeasonNumber}` : 'Progres'}</span>
              <span className="font-semibold text-accent">{stats.progressPct}%</span>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-[10px] font-mono text-muted">
            Sedang aktif ditonton
          </div>
        )}
      </div>
    </Link>
  )
}
