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

const TYPE_ICONS: Record<string, string> = {
  FILM: '🎬',
  SERIES: '📺',
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PLAN_TO_WATCH: { label: 'Plan to Watch', className: 'text-blue-300 bg-blue-950/70 border-blue-800/50' },
  WATCHING: { label: 'Watching', className: 'text-amber-300 bg-amber-950/70 border-amber-800/50' },
  COMPLETED: { label: 'Completed', className: 'text-emerald-300 bg-emerald-950/70 border-emerald-800/50' },
  ON_HOLD: { label: 'On Hold', className: 'text-purple-300 bg-purple-950/70 border-purple-800/50' },
  DROPPED: { label: 'Dropped', className: 'text-rose-300 bg-rose-950/70 border-rose-800/50' },
}

export default function RecentlyAddedGrid({ entries }: { entries: RecentlyAddedEntry[] }) {
  return (
    <section className="space-y-4">
      {/* Header with VIEW ALL -> */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-full bg-accent flex-shrink-0" />
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            Baru Ditambahkan <span className="text-xs font-mono font-normal text-muted uppercase tracking-wider">(Recently Added)</span>
          </h2>
        </div>
        <Link
          href="/library"
          className="group inline-flex items-center gap-1.5 text-xs font-mono font-bold text-accent hover:text-accent-hover uppercase tracking-wider transition-colors"
        >
          <span>Lihat Semua</span>
          <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-surface/40 p-10 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-hover text-muted text-2xl border border-border">
            📂
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">Library masih kosong</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Mulai buat koleksi jurnal tontonan Anda dengan menambahkan judul anime, series, atau film pertama.
            </p>
          </div>
          <Link
            href="/library/new"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-background hover:bg-accent-hover transition-colors shadow-md mt-2"
          >
            + Tambah Tontonan Baru
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {entries.map((entry) => {
            const statusInfo = STATUS_BADGES[entry.status] || {
              label: entry.status,
              className: 'text-zinc-300 bg-zinc-800/80 border-zinc-700',
            }
            const typeIcon = TYPE_ICONS[entry.type] || '🎬'

            return (
              <Link
                key={entry.id}
                href={`/library/${entry.id}`}
                className="group flex flex-col justify-between rounded-xl border border-border/80 bg-surface/90 p-2.5 hover:border-accent/60 hover:bg-surface-hover hover:-translate-y-1 transition-all duration-200 shadow-md"
              >
                <div className="space-y-2">
                  {/* Portrait Poster Frame (Aspect 2:3) */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface-hover border border-border/50 shadow-inner">
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
                        <span className="text-2xl mb-1">🎬</span>
                        <span className="text-[10px] font-mono leading-tight">{entry.title}</span>
                      </div>
                    )}

                    {/* Corner Tag */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className="inline-block text-[9px] font-mono font-bold tracking-wider text-white bg-black/80 backdrop-blur-md border border-white/20 px-1.5 py-0.5 rounded shadow-sm">
                        {entry.type === 'FILM' ? 'FILM' : 'SERIES'}
                      </span>
                    </div>

                    {/* Rating badge if available */}
                    {entry.rating && (
                      <div className="absolute bottom-2 left-2 z-10">
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold text-amber-300 bg-black/80 backdrop-blur-md border border-amber-400/30 px-1.5 py-0.5 rounded shadow-sm">
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
