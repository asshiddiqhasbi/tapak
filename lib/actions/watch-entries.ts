'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function createWatchEntry(formData: {
  title: string
  type: 'ANIME' | 'SERIES' | 'FILM'
  posterUrl?: string
  totalEpisodes?: number
}) {
  const user = await getCurrentUser()

  await prisma.watchEntry.create({
    data: {
      userId: user.id,
      title: formData.title,
      type: formData.type,
      posterUrl: formData.posterUrl || null,
      totalEpisodes: formData.totalEpisodes || null,
      status: 'PLAN_TO_WATCH',
    },
  })

  revalidatePath('/library')
}

export async function updateWatchEntry(
  id: string,
  formData: {
    title: string
    type: 'ANIME' | 'SERIES' | 'FILM'
    posterUrl?: string
    totalEpisodes?: number
  }
) {
  const user = await getCurrentUser()

  const entry = await prisma.watchEntry.findUnique({ where: { id } })
  if (!entry || entry.userId !== user.id) throw new Error('Forbidden')

  await prisma.watchEntry.update({
    where: { id },
    data: {
      title: formData.title,
      type: formData.type,
      posterUrl: formData.posterUrl || null,
      totalEpisodes: formData.totalEpisodes || null,
    },
  })

  revalidatePath('/library')
}

export async function deleteWatchEntry(id: string) {
  const user = await getCurrentUser()

  const entry = await prisma.watchEntry.findUnique({ where: { id } })
  if (!entry || entry.userId !== user.id) throw new Error('Forbidden')

  await prisma.watchEntry.delete({ where: { id } })

  revalidatePath('/library')
}