import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase-server'
import LogoutButton from '@/components/ui/logout-button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [continueWatching, recentlyAdded] = await Promise.all([
    prisma.watchEntry.findMany({
      where: { userId: user.id, status: 'WATCHING' },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.watchEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link
            href="/library/new"
            className="rounded bg-black px-4 py-2 text-sm text-white"
          >
            + Tambah Tontonan
          </Link>
          <LogoutButton />
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Continue Watching</h2>
        {continueWatching.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada yang sedang ditonton.</p>
        ) : (
          <div className="space-y-2">
            {continueWatching.map((entry) => (
              <Link
                key={entry.id}
                href={`/library/${entry.id}/edit`}
                className="block rounded border p-4 hover:bg-gray-50"
              >
                <p className="font-semibold">{entry.title}</p>
                <p className="text-sm text-gray-500">
                  {entry.type} · {entry.currentEpisode}/{entry.totalEpisodes ?? '?'} eps
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recently Added</h2>
        {recentlyAdded.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada tontonan.</p>
        ) : (
          <div className="space-y-2">
            {recentlyAdded.map((entry) => (
              <div key={entry.id} className="rounded border p-4">
                <p className="font-semibold">{entry.title}</p>
                <p className="text-sm text-gray-500">
                  {entry.type} · {entry.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}