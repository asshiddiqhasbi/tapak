import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase-server'
import UsernameForm from '@/components/ui/username-form'
import AvatarUpload from '@/components/ui/avatar-upload'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PLAN_TO_WATCH: { label: 'Plan to Watch', color: 'text-blue-400 bg-blue-950/70 border-blue-800/60' },
  WATCHING: { label: 'Watching', color: 'text-amber-400 bg-amber-950/70 border-amber-800/60' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-400 bg-emerald-950/70 border-emerald-800/60' },
  ON_HOLD: { label: 'On Hold', color: 'text-purple-400 bg-purple-950/70 border-purple-800/60' },
  DROPPED: { label: 'Dropped', color: 'text-rose-400 bg-rose-950/70 border-rose-800/60' },
}

const ALL_STATUSES = ['PLAN_TO_WATCH', 'WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED']

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [dbUser, totalEntries, statusGroup, episodeSum] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id } }),
    prisma.watchEntry.count({ where: { userId: user.id } }),
    prisma.watchEntry.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: { status: true },
    }),
    prisma.watchEntry.aggregate({
      where: { userId: user.id },
      _sum: { currentEpisode: true },
    }),
  ])

  const statusCounts: Record<string, number> = {}
  ALL_STATUSES.forEach((s) => {
    statusCounts[s] = 0
  })
  statusGroup.forEach((group) => {
    statusCounts[group.status] = group._count.status
  })

  const totalEpisodesWatched = episodeSum._sum.currentEpisode ?? 0

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <span className="h-6 w-1 rounded-full bg-accent flex-shrink-0" />
          Profil Pengguna
        </h1>
        <p className="text-sm text-muted mt-1 pl-3.5">
          Informasi akun dan ringkasan statistik tontonan Anda
        </p>
      </div>

      {/* Avatar Section & Info User */}
      <div className="space-y-6 rounded-2xl border border-border/80 bg-surface/95 backdrop-blur-md p-6 shadow-xl shadow-black/40">
        <h2 className="text-base font-semibold text-foreground border-b border-border/60 pb-3">
          Foto Profil & Informasi Akun
        </h2>

        <AvatarUpload
          initialAvatarUrl={dbUser?.avatarUrl}
          username={dbUser?.username ?? 'User'}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-border/60">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Email
            </label>
            <p className="text-sm font-medium text-foreground bg-surface-hover border border-border/80 px-3.5 py-2.5 rounded-xl shadow-inner">
              {dbUser?.email ?? user.email}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Username
            </label>
            <UsernameForm initialUsername={dbUser?.username ?? ''} />
          </div>
        </div>
      </div>

      {/* Statistik Nonton */}
      <div className="space-y-6 rounded-2xl border border-border/80 bg-surface/95 backdrop-blur-md p-6 shadow-xl shadow-black/40">
        <h2 className="text-base font-semibold text-foreground border-b border-border/60 pb-3">
          Statistik Nonton
        </h2>

        {/* Big Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
          <div className="rounded-xl border border-border/80 bg-surface-hover/90 p-6 shadow-md">
            <span className="text-4xl font-extrabold text-accent tracking-tight block">
              {totalEntries}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted mt-2 block">
              Total Judul Tontonan
            </span>
          </div>

          <div className="rounded-xl border border-border/80 bg-surface-hover/90 p-6 shadow-md">
            <span className="text-4xl font-extrabold text-foreground tracking-tight block">
              {totalEpisodesWatched}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted mt-2 block">
              Total Episode Ditonton
            </span>
          </div>
        </div>

        {/* Breakdown Status */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Breakdown Berdasarkan Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ALL_STATUSES.map((statusKey) => {
              const meta = STATUS_LABELS[statusKey]
              const count = statusCounts[statusKey]
              const pct = totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0

              return (
                <div
                  key={statusKey}
                  className={`rounded-xl border p-4 flex flex-col justify-between shadow-md hover:scale-[1.02] transition-transform duration-200 ${meta.color}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold">{meta.label}</span>
                    <span className="text-xl font-bold">{count}</span>
                  </div>
                  <div className="mt-3 flex justify-between items-center text-[10px] opacity-80">
                    <span>{pct}% dari total</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}