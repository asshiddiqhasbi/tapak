'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { calculateGeneralStats, type SeasonDetailItem } from '@/lib/utils'

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
    currentSeason?: number
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
  if (entry.type !== 'FILM' && nextStatus !== 'PLAN_TO_WATCH' && !startedAt) {
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
      currentSeason: data.currentSeason !== undefined ? data.currentSeason : entry.currentSeason,
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

export async function updateSeasonDetail(
  id: string,
  seasonNumber: number,
  data: {
    status?: string
    currentEpisode?: number
    rating?: number | null
    notes?: string | null
  }
) {
  const user = await getCurrentUser()

  const entry = await prisma.watchEntry.findUnique({ where: { id } })
  if (!entry || entry.userId !== user.id) throw new Error('Forbidden')

  let seasons: SeasonDetailItem[] = Array.isArray(entry.seasonsDetail)
    ? (entry.seasonsDetail as unknown as SeasonDetailItem[])
    : []

  if (seasons.length === 0) {
    // Fallback if no seasonsDetail yet
    const totalS = entry.totalSeasons || 1
    const totalE = entry.totalEpisodes || 12
    const epsPerSeason = Math.max(1, Math.floor(totalE / totalS))
    seasons = Array.from({ length: totalS }, (_, idx) => ({
      seasonNumber: idx + 1,
      episodes: epsPerSeason,
      currentEpisode: idx + 1 === entry.currentSeason ? entry.currentEpisode : (entry.status === 'COMPLETED' ? epsPerSeason : 0),
      status: idx + 1 === entry.currentSeason ? entry.status : (entry.status === 'COMPLETED' ? 'COMPLETED' : 'PLAN_TO_WATCH'),
      rating: idx + 1 === entry.currentSeason ? entry.rating : null,
      notes: idx + 1 === entry.currentSeason ? entry.notes : null,
    }))
  }

  const seasonIdx = seasons.findIndex((s) => s.seasonNumber === seasonNumber)
  if (seasonIdx !== -1) {
    const targetSeason = seasons[seasonIdx]
    const nextStatus = data.status !== undefined ? data.status : targetSeason.status
    let nextCurrentEp = data.currentEpisode !== undefined ? data.currentEpisode : targetSeason.currentEpisode

    if (nextStatus === 'COMPLETED') {
      nextCurrentEp = targetSeason.episodes
    } else if (nextStatus === 'PLAN_TO_WATCH') {
      nextCurrentEp = 0
    }

    seasons[seasonIdx] = {
      ...targetSeason,
      status: nextStatus,
      currentEpisode: Math.min(Math.max(nextCurrentEp, 0), targetSeason.episodes),
      rating: data.rating !== undefined ? data.rating : targetSeason.rating,
      notes: data.notes !== undefined ? data.notes : targetSeason.notes,
    }
  }

  const stats = calculateGeneralStats(seasons)

  let startedAt = entry.startedAt
  if (stats.generalStatus !== 'PLAN_TO_WATCH' && !startedAt) {
    startedAt = new Date()
  }

  let completedAt = entry.completedAt
  if (stats.generalStatus === 'COMPLETED') {
    if (!completedAt) completedAt = new Date()
  } else {
    completedAt = null
  }

  await prisma.watchEntry.update({
    where: { id },
    data: {
      seasonsDetail: seasons as any,
      rating: stats.generalRating,
      status: stats.generalStatus as any,
      currentEpisode: stats.totalCurrentEpisodes,
      totalEpisodes: stats.totalEpisodes,
      totalSeasons: seasons.length,
      currentSeason: stats.activeSeasonNumber,
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
  type: 'SERIES' | 'FILM'
  medium?: 'LIVE_ACTION' | 'ANIME' | 'ANIMATION'
  posterUrl?: string
  totalEpisodes?: number
  currentEpisode?: number
  totalSeasons?: number
  currentSeason?: number
  seasonsDetail?: any
  status?: string
  isOngoing?: boolean
  rating?: number | null
  notes?: string | null
}) {
  const user = await getCurrentUser()

  const status = formData.status || 'PLAN_TO_WATCH'
  const currentEpisode = formData.type === 'FILM' ? 0 : (formData.currentEpisode ?? 0)

  let seasonsDetail = formData.seasonsDetail
  if (formData.type !== 'FILM' && Array.isArray(seasonsDetail) && seasonsDetail.length > 0) {
    seasonsDetail = seasonsDetail.map((s: any) => ({
      seasonNumber: s.seasonNumber,
      episodes: s.episodes,
      currentEpisode: status === 'COMPLETED' ? s.episodes : 0,
      status: status,
      rating: formData.rating || null,
      notes: null,
    }))
  } else {
    seasonsDetail = null
  }

  const initialStats = seasonsDetail ? calculateGeneralStats(seasonsDetail) : null
  const effectiveStatus = initialStats ? initialStats.generalStatus : status

  let startedAt: Date | null = null
  if (formData.type !== 'FILM' && effectiveStatus !== 'PLAN_TO_WATCH') {
    startedAt = new Date()
  }

  let completedAt: Date | null = null
  if (effectiveStatus === 'COMPLETED') {
    completedAt = new Date()
  }

  await prisma.watchEntry.create({
    data: {
      userId: user.id,
      title: formData.title,
      type: formData.type as any,
      medium: (formData.medium || 'LIVE_ACTION') as any,
      posterUrl: formData.posterUrl || null,
      totalEpisodes: formData.type === 'FILM' ? null : (initialStats?.totalEpisodes ?? formData.totalEpisodes ?? null),
      currentEpisode: formData.type === 'FILM' ? 0 : (initialStats?.totalCurrentEpisodes ?? currentEpisode),
      totalSeasons: formData.type === 'FILM' ? null : (initialStats ? seasonsDetail.length : (formData.totalSeasons || null)),
      currentSeason: formData.type === 'FILM' ? null : (initialStats?.activeSeasonNumber ?? formData.currentSeason ?? 1),
      seasonsDetail: formData.type === 'FILM' ? null : seasonsDetail,
      status: effectiveStatus as any,
      isOngoing: formData.type === 'FILM' ? false : !!formData.isOngoing,
      rating: initialStats ? initialStats.generalRating : (formData.rating !== undefined ? formData.rating : null),
      notes: formData.notes !== undefined ? formData.notes : null,
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
    type: 'SERIES' | 'FILM'
    medium?: 'LIVE_ACTION' | 'ANIME' | 'ANIMATION'
    posterUrl?: string
    totalEpisodes?: number
    currentEpisode?: number
    totalSeasons?: number
    currentSeason?: number
    seasonsDetail?: any
    status?: string
    isOngoing?: boolean
    rating?: number | null
    notes?: string | null
  }
) {
  const user = await getCurrentUser()

  const entry = await prisma.watchEntry.findUnique({ where: { id } })
  if (!entry || entry.userId !== user.id) throw new Error('Forbidden')

  const seasonsDetail = formData.type === 'FILM' ? null : (formData.seasonsDetail !== undefined ? formData.seasonsDetail : (entry.seasonsDetail as any))
  const stats = seasonsDetail && Array.isArray(seasonsDetail) && seasonsDetail.length > 0 ? calculateGeneralStats(seasonsDetail) : null

  const nextStatus = stats ? stats.generalStatus : (formData.status ?? entry.status)
  let startedAt = entry.startedAt
  if (formData.type !== 'FILM' && nextStatus !== 'PLAN_TO_WATCH' && !startedAt) {
    startedAt = new Date()
  }

  let completedAt = entry.completedAt
  if (nextStatus === 'COMPLETED') {
    if (!completedAt) completedAt = new Date()
  } else {
    completedAt = null
  }

  await prisma.watchEntry.update({
    where: { id },
    data: {
      title: formData.title,
      type: formData.type as any,
      medium: formData.medium !== undefined ? (formData.medium as any) : entry.medium,
      posterUrl: formData.posterUrl !== undefined ? (formData.posterUrl || null) : entry.posterUrl,
      totalEpisodes: formData.type === 'FILM' ? null : (stats ? stats.totalEpisodes : (formData.totalEpisodes || null)),
      currentEpisode: formData.type === 'FILM' ? 0 : (stats ? stats.totalCurrentEpisodes : (formData.currentEpisode !== undefined ? formData.currentEpisode : entry.currentEpisode)),
      totalSeasons: formData.type === 'FILM' ? null : (stats ? seasonsDetail.length : (formData.totalSeasons !== undefined ? formData.totalSeasons : entry.totalSeasons)),
      currentSeason: formData.type === 'FILM' ? null : (stats ? stats.activeSeasonNumber : (formData.currentSeason !== undefined ? formData.currentSeason : entry.currentSeason)),
      seasonsDetail,
      status: nextStatus as any,
      isOngoing: formData.type === 'FILM' ? false : (formData.isOngoing !== undefined ? formData.isOngoing : entry.isOngoing),
      rating: stats ? stats.generalRating : (formData.rating !== undefined ? formData.rating : entry.rating),
      notes: formData.notes !== undefined ? formData.notes : entry.notes,
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

export async function deleteMultipleWatchEntries(ids: string[]) {
  if (!ids.length) return

  const user = await getCurrentUser()

  await prisma.watchEntry.deleteMany({
    where: {
      id: { in: ids },
      userId: user.id,
    },
  })

  revalidatePath('/library')
  revalidatePath('/dashboard')
}

