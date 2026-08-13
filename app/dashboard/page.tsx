import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase-server'
import { formatEpisodeText } from '@/lib/utils'

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PLAN_TO_WATCH: { label: 'Plan to Watch', className: 'bg-blue-950/60 text-blue-300 border-blue-800/50' },
  WATCHING: { label: 'Watching', className: 'bg-amber-950/60 text-amber-300 border-amber-800/50' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50' },
  ON_HOLD: { label: 'On Hold', className: 'bg-purple-950/60 text-purple-300 border-purple-800/50' },
  DROPPED: { label: 'Dropped', className: 'bg-rose-950/60 text-rose-300 border-rose-800/50' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [dbUser, continueWatching, recentlyAdded, episodeSum] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id } }),
    prisma.watchEntry.findMany({
      where: { userId: user.id, status: 'WATCHING' },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.watchEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.watchEntry.aggregate({
      where: { userId: user.id },
      _sum: { currentEpisode: true },
    }),
  ])

  const totalEpisodesWatched = episodeSum._sum.currentEpisode ?? 0
  const username = dbUser?.username ?? 'Penonton'

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-12">
      {/* Header & Personal Greeting (Tanpa Garis Divider) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Selamat datang kembali, {username}! 👋
          </h1>
          <div className="mt-2.5 flex items-center gap-3 text-xs text-muted font-medium">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface/95 border border-border/80 shadow-md">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <strong className="text-foreground font-semibold">{continueWatching.length}</strong> tontonan aktif
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface/95 border border-border/80 shadow-md">
              🎬 <strong className="text-foreground font-semibold">{totalEpisodesWatched}</strong> episode ditonton
            </span>
          </div>
        </div>

        <Link
          href="/library/new"
          title="Tambah Tontonan Baru"
          aria-label="Tambah Tontonan Baru"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-background font-bold text-2xl leading-none select-none hover:bg-accent-hover hover:scale-105 active:scale-95 transition-all shadow-md shadow-accent/20 pb-0.5"
        >
          +
        </Link>
      </div>

      {/* Continue Watching */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <span className="h-5 w-1 rounded-full bg-accent flex-shrink-0" />
            Lanjutkan Nonton (Continue Watching)
          </h2>
          <span className="text-xs text-muted font-medium">
            {continueWatching.length} judul aktif
          </span>
        </div>

        {continueWatching.length === 0 ? (
          <div className="rounded-2xl border border-border/80 bg-surface/95 backdrop-blur-md p-10 text-center shadow-xl shadow-black/30 space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted text-accent text-2xl border border-accent/20">
              📺
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Belum ada tontonan aktif</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Tontonan dengan status Watching akan otomatis muncul di sini untuk akses cepat update episode.
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {continueWatching.map((entry) => {
              const epText = formatEpisodeText(entry.type, entry.currentEpisode, entry.totalEpisodes)
              const progressPct =
                entry.type !== 'FILM' && entry.totalEpisodes && entry.totalEpisodes > 0
                  ? Math.min(Math.round((entry.currentEpisode / entry.totalEpisodes) * 100), 100)
                  : null

              return (
                <Link
                  key={entry.id}
                  href={`/library/${entry.id}`}
                  className="group flex flex-col justify-between rounded-xl border border-border/80 bg-surface/95 backdrop-blur-md p-3 hover:border-accent/60 hover:bg-surface hover:-translate-y-1 transition-all duration-300 ease-out shadow-xl shadow-black/30"
                >
                  <div className="space-y-2.5">
                    {/* Portrait Poster */}
                    {entry.posterUrl ? (
                      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface-hover shadow-inner">
                        <img
                          src={entry.posterUrl}
                          alt={entry.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-surface-hover text-muted text-xs font-semibold uppercase">
                        {entry.type}
                      </div>
                    )}

                    <div>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-accent bg-accent-muted border border-accent/20 px-2 py-0.5 rounded">
                        {entry.type}
                      </span>
                      <h3 className="font-semibold text-foreground text-sm line-clamp-1 mt-1 group-hover:text-accent transition-colors">
                        {entry.title}
                      </h3>
                    </div>
                  </div>

                  {epText && (
                    <div className="mt-3 pt-2.5 border-t border-border/60 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted text-[11px]">Progres</span>
                        <span className="font-semibold text-foreground text-xs">{epText}</span>
                      </div>

                      {progressPct !== null && (
                        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              )
            })}

            {/* Ghost Card Placeholder when items are few */}
            {continueWatching.length < 5 && (
              <Link
                href="/library/new"
                className="group flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed border-border/80 bg-surface/40 hover:bg-surface/70 hover:border-accent/60 transition-all duration-300 p-4 min-h-[220px] shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-accent font-bold text-xl group-hover:scale-110 transition-transform">
                  +
                </div>
                <span className="text-xs font-semibold text-foreground mt-3 group-hover:text-accent transition-colors">
                  Tambah Tontonan
                </span>
                <span className="text-[10px] text-muted mt-1">
                  Klik untuk catat judul baru
                </span>
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Recently Added */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <span className="h-5 w-1 rounded-full bg-accent flex-shrink-0" />
            Baru Ditambahkan (Recently Added)
          </h2>
          <Link href="/library" className="text-xs text-accent hover:underline font-medium">
            Lihat Library &rarr;
          </Link>
        </div>

        {recentlyAdded.length === 0 ? (
          <div className="rounded-2xl border border-border/80 bg-surface/95 backdrop-blur-md p-10 text-center shadow-xl shadow-black/30 space-y-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {recentlyAdded.map((entry) => {
              const badge = STATUS_BADGES[entry.status] ?? {
                label: entry.status,
                className: 'bg-gray-800 text-gray-300 border-gray-700',
              }
              const epText = formatEpisodeText(entry.type, entry.currentEpisode, entry.totalEpisodes)

              return (
                <Link
                  key={entry.id}
                  href={`/library/${entry.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-border/80 bg-surface/95 backdrop-blur-md p-3.5 hover:border-accent/60 hover:bg-surface hover:-translate-y-1 transition-all duration-300 ease-out shadow-xl shadow-black/30"
                >
                  {entry.posterUrl ? (
                    <img
                      src={entry.posterUrl}
                      alt={entry.title}
                      className="h-16 w-12 flex-shrink-0 object-cover rounded-md bg-surface-hover shadow-sm group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-16 w-12 flex-shrink-0 items-center justify-center rounded-md bg-surface-hover text-[10px] text-muted font-semibold">
                      {entry.type}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold uppercase text-muted tracking-wider">
                      {entry.type}
                    </span>
                    <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-accent transition-colors">
                      {entry.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded border ${badge.className}`}>
                        {badge.label}
                      </span>
                      {epText && <span className="text-xs text-muted">{epText}</span>}
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* Ghost Card Placeholder when items are few */}
            {recentlyAdded.length < 6 && (
              <Link
                href="/library/new"
                className="group flex items-center gap-3 rounded-xl border-2 border-dashed border-border/80 bg-surface/40 hover:bg-surface/70 hover:border-accent/60 transition-all duration-300 p-3.5 shadow-sm"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent font-bold text-lg group-hover:scale-110 transition-transform">
                  +
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-foreground text-xs group-hover:text-accent transition-colors block">
                    Tambah Tontonan Baru
                  </span>
                  <span className="text-[10px] text-muted block mt-0.5">
                    Klik untuk mengisi slot ini
                  </span>
                </div>
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  )
}