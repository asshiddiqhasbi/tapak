import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase-server'

const getBackdropPosters = cache(async (userId: string) => {
  const entriesWithPosters = await prisma.watchEntry.findMany({
    where: {
      userId,
      posterUrl: { not: null },
    },
    select: { id: true, posterUrl: true },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  })

  return entriesWithPosters
    .map((e) => e.posterUrl)
    .filter((url): url is string => Boolean(url && url.trim().length > 0))
})

export default async function AmbientBackdrop() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const posters = await getBackdropPosters(user.id)
  if (posters.length === 0) return null

  const isFewPosters = posters.length < 4

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none transform-gpu" aria-hidden="true">
      {/* Ambient Poster Backdrop - Lightweight GPU Layer */}
      <div
        className={`absolute inset-0 opacity-20 filter blur-md transform-gpu ${
          isFewPosters
            ? 'flex justify-around items-center p-12 gap-8'
            : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6'
        }`}
      >
        {posters.map((url, idx) => (
          <div
            key={`${idx}-${url.slice(-10)}`}
            className={`overflow-hidden rounded-2xl bg-surface/20 ${
              isFewPosters ? 'h-[360px] w-[240px] max-w-[40vw]' : 'aspect-[2/3] w-full'
            }`}
          >
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Dark Overlay for Clean Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
    </div>
  )
}
