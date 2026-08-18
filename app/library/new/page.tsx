import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase-server'
import WatchEntryForm from '@/components/watch-entry/watch-entry-form'

export default async function NewWatchEntryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const groupTitleEntries = await prisma.watchEntry.findMany({
    where: { userId: user.id, groupTitle: { not: null } },
    select: { groupTitle: true },
    distinct: ['groupTitle'],
  })
  const existingGroupTitles = groupTitleEntries
    .map((e) => e.groupTitle)
    .filter((g): g is string => Boolean(g && g.trim().length > 0))

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <WatchEntryForm existingGroupTitles={existingGroupTitles} />
    </div>
  )
}