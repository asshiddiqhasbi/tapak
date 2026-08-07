import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase-server'
import DeleteButton from '@/components/watch-entry/delete-button'

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const entries = user
    ? await prisma.watchEntry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })
    : []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jejak Tontonan</h1>
        <Link
          href="/library/new"
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          + Tambah
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {entries.length === 0 && (
          <p className="text-gray-500">Belum ada tontonan.</p>
        )}

        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded border p-4"
          >
            <div>
              <p className="font-semibold">{entry.title}</p>
              <p className="text-sm text-gray-500">
                {entry.type} · {entry.status}
                {entry.totalEpisodes ? ` · ${entry.currentEpisode}/${entry.totalEpisodes} eps` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/library/${entry.id}/edit`}
                className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-900 hover:bg-gray-300"
              >
                Edit
              </Link>
              <DeleteButton id={entry.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}