import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase-server'
import DeleteButton from '@/components/watch-entry/delete-button'
import LibraryFilters from '@/components/watch-entry/library-filters'
import { formatEpisodeText } from '@/lib/utils'

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PLAN_TO_WATCH: { label: 'Plan to Watch', className: 'bg-blue-950/60 text-blue-300 border-blue-800/50' },
  WATCHING: { label: 'Watching', className: 'bg-amber-950/60 text-amber-300 border-amber-800/50' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50' },
  ON_HOLD: { label: 'On Hold', className: 'bg-purple-950/60 text-purple-300 border-purple-800/50' },
  DROPPED: { label: 'Dropped', className: 'bg-rose-950/60 text-rose-300 border-rose-800/50' },
}

function formatDateShort(date: Date | string) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; sort?: string }>
}) {
  const { status, type, sort } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const whereClause: any = { userId: user.id }
  if (status && status !== 'ALL') {
    whereClause.status = status
  }
  if (type && type !== 'ALL') {
    whereClause.type = type
  }

  let orderBy: any = { createdAt: 'desc' }
  if (sort === 'updated') orderBy = { updatedAt: 'desc' }
  if (sort === 'title') orderBy = { title: 'asc' }
  if (sort === 'rating') orderBy = { rating: 'desc' }

  const entries = await prisma.watchEntry.findMany({
    where: whereClause,
    orderBy,
  })

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="h-6 w-1 rounded-full bg-accent flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Library Tontonan
            </h1>
          </div>
          <p className="text-sm text-muted pl-3.5">
            Kelola dan cari koleksi tontonan Anda ({entries.length} judul tersimpan)
          </p>
        </div>
        <Link
          href="/library/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:bg-accent-hover active:scale-[0.98] transition-all shadow-md shadow-accent/20"
        >
          <span className="text-base font-bold leading-none select-none">+</span>
          <span>Tambah Tontonan</span>
        </Link>
      </div>

      {/* Filter & Sort Bar */}
      <div className="rounded-2xl border border-border/80 bg-surface/95 backdrop-blur-md p-4 shadow-xl shadow-black/30">
        <LibraryFilters
          currentStatus={status ?? 'ALL'}
          currentType={type ?? 'ALL'}
          currentSort={sort ?? 'newest'}
        />
      </div>

      {/* Entries List / Grid */}
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-surface/95 backdrop-blur-md p-12 text-center shadow-xl shadow-black/30 space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-muted text-accent text-3xl border border-accent/20">
            🎬
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Tidak ada tontonan ditemukan</h2>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Tidak ada judul yang sesuai dengan kriteria filter saat ini. Coba ganti filter atau tambahkan tontonan baru.
            </p>
          </div>
          <Link
            href="/library/new"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-background hover:bg-accent-hover transition-colors shadow-md"
          >
            + Tambah Tontonan Baru
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((entry) => {
            const badge = STATUS_BADGES[entry.status] ?? {
              label: entry.status,
              className: 'bg-gray-800 text-gray-300 border-gray-700',
            }
            const epText = formatEpisodeText(entry.type, entry.currentEpisode, entry.totalEpisodes)
            const progressPct =
              entry.type !== 'FILM' && entry.totalEpisodes && entry.totalEpisodes > 0
                ? Math.min(Math.round((entry.currentEpisode / entry.totalEpisodes) * 100), 100)
                : null

            return (
              <div
                key={entry.id}
                className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-surface/95 backdrop-blur-md p-4 hover:border-accent/60 hover:bg-surface hover:-translate-y-1 transition-all duration-300 ease-out shadow-xl shadow-black/30"
              >
                <div className="space-y-3">
                  <div className="flex gap-4">
                    {entry.posterUrl ? (
                      <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface-hover shadow-sm">
                        <Image
                          src={entry.posterUrl}
                          alt={entry.title}
                          fill
                          sizes="80px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                        />
                      </div>
                    ) : (
                      <div className="flex h-28 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-surface-hover text-xs font-bold text-muted uppercase">
                        {entry.type}
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent-muted border border-accent/20 px-2 py-0.5 rounded">
                          {entry.type}
                        </span>
                        <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>

                      <Link
                        href={`/library/${entry.id}`}
                        className="font-semibold text-foreground text-base line-clamp-1 group-hover:text-accent transition-colors block"
                      >
                        {entry.title}
                      </Link>

                      <div className="flex items-center gap-3 text-xs text-muted">
                        {epText && <span>{epText}</span>}
                        {entry.rating && (
                          <span className="text-amber-400 font-semibold flex items-center gap-1">
                            ★ {entry.rating}/10
                          </span>
                        )}
                      </div>

                      {/* Display startedAt / completedAt dates */}
                      <div className="flex items-center gap-3 text-[11px] text-muted/80 pt-0.5 flex-wrap">
                        {entry.startedAt && (
                          <span>Mulai {formatDateShort(entry.startedAt)}</span>
                        )}
                        {entry.startedAt && entry.completedAt && <span>•</span>}
                        {entry.completedAt && (
                          <span>Selesai {formatDateShort(entry.completedAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Episode Progress Bar */}
                  {progressPct !== null && (
                    <div className="h-1.5 w-full rounded-full bg-border/80 overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                  <Link
                    href={`/library/${entry.id}`}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Detail & Progress &rarr;
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/library/${entry.id}/edit`}
                      className="rounded-md bg-surface-hover border border-border/60 px-2.5 py-1 text-xs text-foreground hover:bg-border transition-colors"
                    >
                      Edit
                    </Link>
                    <DeleteButton id={entry.id} />
                  </div>
                </div>
              </div>
            )
          })}

          {/* Ghost Card Placeholder when library items are few */}
          {entries.length < 4 && (
            <Link
              href="/library/new"
              className="group flex items-center gap-4 rounded-2xl border-2 border-dashed border-border/80 bg-surface/40 hover:bg-surface/70 hover:border-accent/60 transition-all duration-300 p-4 shadow-sm"
            >
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent font-bold text-xl group-hover:scale-110 transition-transform">
                +
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-foreground text-sm group-hover:text-accent transition-colors block">
                  Tambah Tontonan Baru
                </span>
                <span className="text-xs text-muted block mt-0.5">
                  Klik untuk menambahkan judul anime, series, atau film baru ke perpustakaan Anda
                </span>
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}