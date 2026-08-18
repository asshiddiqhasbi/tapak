import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase-server'
import WatchEntryForm from '@/components/watch-entry/watch-entry-form'

export default async function EditWatchEntryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [entry, groupTitleEntries] = await Promise.all([
    prisma.watchEntry.findUnique({ where: { id } }),
    prisma.watchEntry.findMany({
      where: { userId: user.id, groupTitle: { not: null } },
      select: { groupTitle: true },
      distinct: ['groupTitle'],
    }),
  ])

  if (!entry || entry.userId !== user.id) notFound()

  const existingGroupTitles = groupTitleEntries
    .map((e) => e.groupTitle)
    .filter((g): g is string => Boolean(g && g.trim().length > 0))

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <WatchEntryForm
        existingGroupTitles={existingGroupTitles}
        initialData={{
          id: entry.id,
          title: entry.title,
          groupTitle: entry.groupTitle,
          type: entry.type,
          posterUrl: entry.posterUrl,
          totalEpisodes: entry.totalEpisodes,
          currentEpisode: entry.currentEpisode,
          status: entry.status,
        }}
      />
    </div>
  )
}