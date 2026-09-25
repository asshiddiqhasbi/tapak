import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/supabase-server'
import HeroContinueCard from '@/components/dashboard/hero-continue-card'
import SecondaryContinueCard from '@/components/dashboard/secondary-continue-card'
import YourJourneyTimeline, { type JourneyEvent } from '@/components/dashboard/your-journey-timeline'
import RecentlyAddedGrid from '@/components/dashboard/recently-added-grid'

export default async function DashboardPage() {
  const user = await getAuthUser()

  if (!user) redirect('/login')

  const [dbUser, continueWatching, recentlyAdded, recentRatings, recentCompletions, episodeSum] =
    await Promise.all([
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
      prisma.watchEntry.findMany({
        where: { userId: user.id, rating: { not: null } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.watchEntry.findMany({
        where: { userId: user.id, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        take: 5,
      }),
      prisma.watchEntry.aggregate({
        where: { userId: user.id },
        _sum: { currentEpisode: true },
      }),
    ])

  const totalEpisodesWatched = episodeSum._sum.currentEpisode ?? 0
  const username = dbUser?.username ?? 'Penonton'

  // Construct "Your Journey" timeline events with intelligent deduplication
  const journeyEventsMap = new Map<string, JourneyEvent>()

  // 1. Process recent completions (Highest priority milestone)
  for (const entry of recentCompletions) {
    const hasRating = entry.rating && entry.rating > 0
    journeyEventsMap.set(entry.id, {
      id: `${entry.id}-completed`,
      entryId: entry.id,
      title: entry.title,
      date: entry.completedAt || entry.updatedAt,
      type: 'COMPLETED',
      actionText: hasRating
        ? `Selesai menonton & memberi rating ${entry.rating}/10 untuk`
        : 'Selesai menonton',
      badge: hasRating ? `Tamat • ★ ${entry.rating}` : 'Tamat',
      badgeClass: 'text-emerald-300 bg-emerald-950/70 border-emerald-800/60',
      icon: '🎉',
      meta: entry.type === 'FILM' ? 'Film' : `${entry.totalEpisodes || entry.currentEpisode} Episode`,
    })
  }

  // 2. Process rated events (if not already completed)
  for (const entry of recentRatings) {
    if (!journeyEventsMap.has(entry.id) && entry.rating) {
      journeyEventsMap.set(entry.id, {
        id: `${entry.id}-rated`,
        entryId: entry.id,
        title: entry.title,
        date: entry.updatedAt,
        type: 'RATED',
        actionText: `Memberi rating ${entry.rating}/10 untuk`,
        badge: `★ ${entry.rating}`,
        badgeClass: 'text-amber-300 bg-amber-950/70 border-amber-800/60',
        icon: '⭐',
        meta: entry.type === 'FILM' ? 'Film' : 'Series',
      })
    }
  }

  // 3. Process recently added events (if not already completed or rated)
  for (const entry of recentlyAdded) {
    if (!journeyEventsMap.has(entry.id)) {
      const statusLabel =
        entry.status === 'PLAN_TO_WATCH'
          ? 'Watchlist'
          : entry.status === 'WATCHING'
          ? 'Watching'
          : 'Library'

      journeyEventsMap.set(entry.id, {
        id: `${entry.id}-added`,
        entryId: entry.id,
        title: entry.title,
        date: entry.createdAt,
        type: 'ADDED',
        actionText: `Menambahkan ke ${statusLabel}:`,
        badge: entry.type === 'FILM' ? 'Film' : 'Series',
        badgeClass: 'text-zinc-300 bg-zinc-800/80 border-zinc-700',
        icon: '＋',
        meta: entry.medium.replace('_', ' '),
      })
    }
  }

  // Convert map values to array and sort chronologically descending
  const displayJourneyEvents = Array.from(journeyEventsMap.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4)

  // Split Continue Watching into Hero and Secondary stack
  const heroEntry = continueWatching[0] || null
  const secondaryEntries = continueWatching.slice(1, 4)

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-12">
      {/* Header & Personal Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
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

      {/* 1. Continue Watching Section (Cinematic Hero + Secondary Split) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-5 w-1 rounded-full bg-accent flex-shrink-0" />
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              Lanjutkan Nonton <span className="text-xs font-mono font-normal text-muted uppercase tracking-wider">(Continue Watching)</span>
            </h2>
          </div>
          <span className="text-xs text-muted font-mono">
            {continueWatching.length} judul aktif
          </span>
        </div>

        {!heroEntry ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-surface/40 p-10 text-center shadow-xl shadow-black/20 space-y-3">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Main Hero Card (Large 16:9 cinematic preview) */}
            <div className={secondaryEntries.length > 0 ? 'lg:col-span-7 xl:col-span-8 flex' : 'lg:col-span-12 flex'}>
              <div className="w-full flex">
                <HeroContinueCard entry={heroEntry as any} />
              </div>
            </div>

            {/* Secondary Continue Stack (Right side on desktop, stacked below on mobile) */}
            {secondaryEntries.length > 0 && (
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between gap-3">
                <div className="space-y-3">
                  {secondaryEntries.map((sec) => (
                    <SecondaryContinueCard key={sec.id} entry={sec as any} />
                  ))}
                </div>

                {/* If secondary items are fewer than 3, provide a dashed slot */}
                {secondaryEntries.length < 3 && (
                  <Link
                    href="/library/new"
                    className="group flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-surface/40 p-3 hover:bg-surface/70 hover:border-accent/60 transition-all text-xs font-semibold text-muted hover:text-accent"
                  >
                    <span className="text-base font-bold">+</span>
                    <span>Tambah Judul Aktif Lainnya</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. Your Journey / Jejak Tontonan Timeline */}
      <YourJourneyTimeline events={displayJourneyEvents} />

      {/* 3. Recently Added (Editorial Grid) */}
      <RecentlyAddedGrid entries={recentlyAdded as any} />
    </div>
  )
}