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
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none" aria-hidden="true">
      {/* Ambient Poster Backdrop - No Repetition */}
      <div
        className={`absolute inset-0 opacity-40 blur-lg scale-105 transform-gpu ${
          isFewPosters
            ? 'flex justify-around items-center p-12 gap-8'
            : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6'
        }`}
      >
        {posters.map((url, idx) => (
          <div
            key={`${idx}-${url.slice(-10)}`}
            className={`overflow-hidden rounded-2xl bg-surface/40 border border-white/5 shadow-2xl ${
              isFewPosters ? 'h-[360px] w-[240px] max-w-[40vw]' : 'aspect-[2/3] w-full'
            }`}
          >
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover saturate-[1.1]"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Dark Vignette Overlay for Crisp Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/65 to-background/90" />
    </div>
  )
}
