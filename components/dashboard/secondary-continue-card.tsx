import Link from 'next/link'
import Image from 'next/image'
import { formatEpisodeText } from '@/lib/utils'

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
  isOngoing: boolean
}

export default function SecondaryContinueCard({ entry }: { entry: SecondaryContinueEntry }) {
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

  return (
    <Link
      href={`/library/${entry.id}`}
      className="group flex items-center gap-3.5 rounded-xl border border-border/80 bg-surface/90 p-3 hover:border-accent/60 hover:bg-surface-hover hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
    >
      {/* 16:9 Thumbnail box */}
      <div className="relative h-16 w-24 sm:h-[72px] sm:w-28 shrink-0 overflow-hidden rounded-lg bg-surface-hover border border-border/60 shadow-inner">
        {entry.posterUrl ? (
          <Image
            src={entry.posterUrl}
            alt={entry.title}
            fill
            sizes="112px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted text-lg">
            🎬
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 py-0.5">
        <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-accent transition-colors">
          {entry.title}
        </h4>
        <p className="text-xs text-muted font-mono truncate mt-0.5">
          {epFormatted || (isFilm ? 'Film • Sedang Ditonton' : `Episode ${entry.currentEpisode}`)}
        </p>

        {progressPct !== null ? (
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-muted">
              <span>{entry.totalEpisodes ? `Eps ${entry.currentEpisode}/${entry.totalEpisodes}` : `Eps ${entry.currentEpisode}`}</span>
              <span className="font-semibold text-accent">{progressPct}%</span>
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
