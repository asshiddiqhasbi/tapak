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

export async function updateProgress(
  id: string,
  data: {
    currentEpisode?: number
    status?: string
    rating?: number | null
    notes?: string | null
  }
) {
  const user = await getCurrentUser()

  const entry = await prisma.watchEntry.findUnique({ where: { id } })
  if (!entry || entry.userId !== user.id) throw new Error('Forbidden')

  const nextStatus = data.status ?? entry.status
  let startedAt = entry.startedAt
  if (nextStatus !== 'PLAN_TO_WATCH' && !startedAt) {
    startedAt = new Date()
  }

  let completedAt = entry.completedAt
  if (nextStatus === 'COMPLETED' && !completedAt) {
    completedAt = new Date()
  }

  await prisma.watchEntry.update({
    where: { id },
    data: {
      currentEpisode: data.currentEpisode !== undefined ? data.currentEpisode : entry.currentEpisode,
      status: nextStatus as any,
      rating: data.rating !== undefined ? data.rating : entry.rating,
      notes: data.notes !== undefined ? data.notes : entry.notes,
      startedAt,
      completedAt,
    },
  })

  revalidatePath('/library')
  revalidatePath(`/library/${id}`)
  revalidatePath('/dashboard')
}

export async function createWatchEntry(formData: {
  title: string
  type: 'ANIME' | 'SERIES' | 'FILM'
  posterUrl?: string
  totalEpisodes?: number
  currentEpisode?: number
  status?: string
}) {
  const user = await getCurrentUser()

  const status = formData.status || 'PLAN_TO_WATCH'
  const currentEpisode = formData.type === 'FILM' ? 0 : (formData.currentEpisode ?? 0)

  let startedAt: Date | null = null
  if (status !== 'PLAN_TO_WATCH') {
    startedAt = new Date()
  }

  let completedAt: Date | null = null
  if (status === 'COMPLETED') {
    completedAt = new Date()
  }

  await prisma.watchEntry.create({
    data: {
      userId: user.id,
      title: formData.title,
      type: formData.type,
      posterUrl: formData.posterUrl || null,
      totalEpisodes: formData.type === 'FILM' ? null : (formData.totalEpisodes || null),
      currentEpisode,
      status: status as any,
      startedAt,
      completedAt,
    },
  })

  revalidatePath('/library')
  revalidatePath('/dashboard')
}

export async function updateWatchEntry(
  id: string,
  formData: {
    title: string
    type: 'ANIME' | 'SERIES' | 'FILM'
    posterUrl?: string
    totalEpisodes?: number
    currentEpisode?: number
    status?: string
  }
) {
  const user = await getCurrentUser()

  const entry = await prisma.watchEntry.findUnique({ where: { id } })
  if (!entry || entry.userId !== user.id) throw new Error('Forbidden')

  const nextStatus = formData.status ?? entry.status
  let startedAt = entry.startedAt
  if (nextStatus !== 'PLAN_TO_WATCH' && !startedAt) {
    startedAt = new Date()
  }

  let completedAt = entry.completedAt
  if (nextStatus === 'COMPLETED' && !completedAt) {
    completedAt = new Date()
  }

  await prisma.watchEntry.update({
    where: { id },
    data: {
      title: formData.title,
      type: formData.type,
      posterUrl: formData.posterUrl !== undefined ? (formData.posterUrl || null) : entry.posterUrl,
      totalEpisodes: formData.type === 'FILM' ? null : (formData.totalEpisodes || null),
      currentEpisode: formData.type === 'FILM' ? 0 : (formData.currentEpisode !== undefined ? formData.currentEpisode : entry.currentEpisode),
      status: nextStatus as any,
      startedAt,
      completedAt,
    },
  })

  revalidatePath('/library')
  revalidatePath(`/library/${id}`)
  revalidatePath('/dashboard')
}

export async function deleteWatchEntry(id: string) {
  const user = await getCurrentUser()

  const entry = await prisma.watchEntry.findUnique({ where: { id } })
  if (!entry || entry.userId !== user.id) throw new Error('Forbidden')

  await prisma.watchEntry.delete({ where: { id } })

  revalidatePath('/library')
  revalidatePath('/dashboard')
}
