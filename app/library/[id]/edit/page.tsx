import { notFound } from 'next/navigation'
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
  if (!user) notFound()

  const entry = await prisma.watchEntry.findUnique({ where: { id } })
  if (!entry || entry.userId !== user.id) notFound()

  return (
    <div className="p-8">
      <WatchEntryForm
        initialData={{
          id: entry.id,
          title: entry.title,
          type: entry.type,
          posterUrl: entry.posterUrl,
          totalEpisodes: entry.totalEpisodes,
        }}
      />
    </div>
  )
}