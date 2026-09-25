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

  // Construct "Aktivitas Terbaru" timeline events with intelligent deduplication
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
        ? `Selesai menonton dan memberi rating ${entry.rating}/10 untuk`
        : 'Selesai menonton',
      badge: hasRating ? `Tamat • ★ ${entry.rating}` : 'Tamat',
      badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: 'completed',
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
        badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        icon: 'rated',
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
          : 'Koleksi'

      journeyEventsMap.set(entry.id, {
        id: `${entry.id}-added`,
        entryId: entry.id,
        title: entry.title,
        date: entry.createdAt,
        type: 'ADDED',
        actionText: `Menambahkan ke ${statusLabel}:`,
        badge: entry.type === 'FILM' ? 'Film' : 'Series',
        badgeClass: 'text-zinc-300 bg-zinc-800 border-zinc-700/80',
        icon: 'added',
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
      {/* Header & Clean Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Selamat datang kembali, {username}
          </h1>
          <div className="flex items-center gap-3 text-xs text-muted font-medium">
            <span>
              <strong className="text-foreground font-semibold">{continueWatching.length}</strong> tontonan aktif
            </span>
            <span className="text-border">•</span>
            <span>
              <strong className="text-foreground font-semibold">{totalEpisodesWatched}</strong> episode ditonton
            </span>
          </div>
        </div>

        <Link
          href="/library/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs sm:text-sm font-semibold text-background hover:bg-accent-hover transition-all shadow-sm active:scale-[0.98] w-fit"
        >
          <span className="text-base leading-none font-bold">+</span>
          <span>Tambah Tontonan</span>
        </Link>
      </div>

      {/* 1. Continue Watching Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Lanjutkan Menonton
          </h2>
          <span className="text-xs text-muted font-mono">
            {continueWatching.length} judul aktif
          </span>
        </div>

        {!heroEntry ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-surface/30 p-10 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-surface-hover border border-border text-muted">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Belum ada tontonan aktif</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Tontonan dengan status Watching akan otomatis muncul di sini.
              </p>
            </div>
            <Link
              href="/library/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-background hover:bg-accent-hover transition-colors shadow-sm mt-2"
            >
              + Tambah Judul Baru
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Main Hero Card */}
            <div className={secondaryEntries.length > 0 ? 'lg:col-span-7 xl:col-span-8 flex' : 'lg:col-span-12 flex'}>
              <div className="w-full flex">
                <HeroContinueCard entry={heroEntry as any} />
              </div>
            </div>

            {/* Secondary Continue Stack */}
            {secondaryEntries.length > 0 && (
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between gap-3">
                <div className="space-y-3">
                  {secondaryEntries.map((sec: any) => (
                    <SecondaryContinueCard key={sec.id} entry={sec as any} />
                  ))}
                </div>

                {secondaryEntries.length < 3 && (
                  <Link
                    href="/library/new"
                    className="group flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-surface/30 p-3 hover:bg-surface/60 hover:border-accent/50 transition-all text-xs font-medium text-muted hover:text-foreground"
                  >
                    <span className="text-base font-bold">+</span>
                    <span>Tambah Judul Lainnya</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. Aktivitas Terbaru Timeline */}
      <YourJourneyTimeline events={displayJourneyEvents} />

      {/* 3. Koleksi Terbaru */}
      <RecentlyAddedGrid entries={recentlyAdded as any} />
    </div>
  )
}