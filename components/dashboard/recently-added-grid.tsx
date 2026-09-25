import Link from 'next/link'
import Image from 'next/image'

export type RecentlyAddedEntry = {
  id: string
  title: string
  type: string
  medium: string
  posterUrl: string | null
  status: string
  rating: number | null
  currentEpisode: number
  totalEpisodes: number | null
}


const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PLAN_TO_WATCH: { label: 'Watchlist', className: 'text-zinc-400 bg-zinc-800/80 border-zinc-700/60' },
  WATCHING: { label: 'Watching', className: 'text-accent bg-accent/10 border-accent/20' },
  COMPLETED: { label: 'Tamat', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  ON_HOLD: { label: 'On Hold', className: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  DROPPED: { label: 'Dropped', className: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
}

export default function RecentlyAddedGrid({ entries }: { entries: RecentlyAddedEntry[] }) {
  return (
    <section className="space-y-4">
      {/* Header with VIEW ALL -> */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Koleksi Terbaru
        </h2>
        <Link
          href="/library"
          className="group inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
        >
          <span>Lihat Semua</span>
          <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-surface/30 p-10 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface-hover border border-border text-muted">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Koleksi masih kosong</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Tambahkan film, anime, atau series pertama kamu ke dalam daftar.
            </p>
          </div>
          <Link
            href="/library/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-background hover:bg-accent-hover transition-colors shadow-sm mt-2"
          >
            + Tambah Tontonan
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {entries.map((entry) => {
            const statusInfo = STATUS_BADGES[entry.status] || {
              label: entry.status,
              className: 'text-zinc-400 bg-zinc-800 border-zinc-700',
            }

            return (
              <Link
                key={entry.id}
                href={`/library/${entry.id}`}
                className="group flex flex-col justify-between rounded-xl border border-border/80 bg-surface p-2.5 hover:border-accent/40 hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
              >
                <div className="space-y-2">
                  {/* Portrait Poster Frame (Aspect 2:3) */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface-hover border border-border/50">
                    {entry.posterUrl ? (
                      <Image
                        src={entry.posterUrl}
                        alt={entry.title}
                        fill
                        sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 160px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-surface-hover text-muted text-center p-2">
                        <svg className="h-6 w-6 mb-1 text-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                        <span className="text-[10px] leading-tight line-clamp-2">{entry.title}</span>
                      </div>
                    )}

                    {/* Corner Tag */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className="inline-block text-[9px] font-mono font-medium tracking-wide text-zinc-300 bg-background/90 border border-border/80 px-1.5 py-0.5 rounded shadow-sm">
                        {entry.type === 'FILM' ? 'Film' : 'Series'}
                      </span>
                    </div>

                    {/* Rating badge if available */}
                    {entry.rating && (
                      <div className="absolute bottom-2 left-2 z-10">
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-amber-300 bg-background/90 border border-border/80 px-1.5 py-0.5 rounded shadow-sm">
                          ★ {entry.rating}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:text-accent transition-colors" title={entry.title}>
                      {entry.title}
                    </h3>
                    <p className="text-[11px] text-muted font-mono truncate mt-0.5">
                      {typeIcon} {entry.medium.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-2.5 pt-2 border-t border-border/60">
                  <span className={`inline-block text-[9px] font-mono font-semibold px-2 py-0.5 rounded border truncate w-full text-center ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </Link>
            )
          })}

          {/* Ghost Card Slot if less than 6 items */}
          {entries.length < 6 && (
            <Link
              href="/library/new"
              className="group flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed border-border/80 bg-surface/40 hover:bg-surface/70 hover:border-accent/60 transition-all duration-300 p-4 min-h-[180px] shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-accent font-bold text-xl group-hover:scale-110 transition-transform">
                +
              </div>
              <span className="text-xs font-semibold text-foreground mt-2.5 group-hover:text-accent transition-colors">
                Tambah Judul
              </span>
              <span className="text-[10px] text-muted font-mono mt-0.5">
                Isi slot koleksi
              </span>
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
