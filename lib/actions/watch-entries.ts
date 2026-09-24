'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { calculateGeneralStats, parseSeasonsDetail, type SeasonDetailItem } from '@/lib/utils'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function quickIncrementProgress(id: string) {
  const user = await getCurrentUser()

  const entry = await prisma.watchEntry.findUnique({ where: { id } })
  if (!entry || entry.userId !== user.id) throw new Error('Forbidden')

  if (entry.type === 'FILM') {
    await prisma.watchEntry.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })
    revalidatePath('/dashboard')
    revalidatePath('/library')
    revalidatePath(`/library/${id}`)
    revalidatePath('/profile')
    return {
      success: true,
      isCompleted: true,
      message: `Selamat! "${entry.title}" ditandai selesai! 🎉`,
    }
  }

  // Handle SERIES
  let seasons: SeasonDetailItem[] = parseSeasonsDetail(entry.seasonsDetail)

  // If seasonsDetail is empty, synthesize a 1-season or multi-season structure
  if (seasons.length === 0) {
    const totalS = entry.totalSeasons || 1
    const totalE = entry.totalEpisodes || 0
    const epsPerSeason = totalE > 0 ? Math.max(0, Math.floor(totalE / totalS)) : 0
    seasons = Array.from({ length: totalS }, (_, idx) => ({
      seasonNumber: idx + 1,
      title: null,
      episodes: epsPerSeason,
      currentEpisode:
        idx + 1 === (entry.currentSeason || 1)
          ? entry.currentEpisode
          : entry.status === 'COMPLETED'
          ? epsPerSeason
          : 0,
      status:
        idx + 1 === (entry.currentSeason || 1)
          ? entry.status
          : entry.status === 'COMPLETED'
          ? 'COMPLETED'
          : 'PLAN_TO_WATCH',
      rating: idx + 1 === (entry.currentSeason || 1) ? entry.rating : null,
      notes: idx + 1 === (entry.currentSeason || 1) ? entry.notes : null,
    }))
  }

  // Find the active season
  let activeIdx = seasons.findIndex((s) => s.seasonNumber === (entry.currentSeason || 1))
  if (activeIdx === -1) {
    activeIdx = seasons.findIndex((s) => s.status === 'WATCHING')
  }
  if (activeIdx === -1) {
    activeIdx = seasons.findIndex((s) => s.status !== 'COMPLETED')
  }
  if (activeIdx === -1) {
    activeIdx = seasons.length - 1
  }

  const activeSeason = seasons[activeIdx]
  const currentEp = activeSeason.currentEpisode || 0
  const totalSeasonEp = activeSeason.episodes || 0
  const nextEp = currentEp + 1

  let toastMsg = `Update ${seasons.length > 1 ? `S${activeSeason.seasonNumber} ` : ''}ke Episode ${nextEp}! 🍿`
  let isCompletedSeries = false

  if (!entry.isOngoing && totalSeasonEp > 0 && nextEp >= totalSeasonEp) {
    // Current season is completed!
    seasons[activeIdx] = {
      ...activeSeason,
      currentEpisode: totalSeasonEp,
      status: 'COMPLETED',
    }

    // Check if there is a next season
    if (activeIdx + 1 < seasons.length) {
      // Transition to next season
      const nextSeason = seasons[activeIdx + 1]
      seasons[activeIdx + 1] = {
        ...nextSeason,
        status: nextSeason.status === 'PLAN_TO_WATCH' ? 'WATCHING' : nextSeason.status,
      }
      toastMsg = `Selamat! Season ${activeSeason.seasonNumber} tamat! Lanjut ke Season ${nextSeason.seasonNumber} 🎉`
    } else {
      // Entire series completed!
      isCompletedSeries = true
      toastMsg = `Selamat! Tamat menonton "${entry.title}"! 🎉`
    }
  } else {
    // Regular episode increment in active season
    seasons[activeIdx] = {
      ...activeSeason,
      currentEpisode: nextEp,
      status: 'WATCHING',
    }
  }

  const stats = calculateGeneralStats(seasons)

  let startedAt = entry.startedAt || new Date()
  let completedAt = entry.completedAt
  if (stats.generalStatus === 'COMPLETED') {
    completedAt = completedAt || new Date()
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

  revalidatePath('/dashboard')
  revalidatePath('/library')
  revalidatePath(`/library/${id}`)
  revalidatePath('/profile')

  return {
    success: true,
    isCompleted: isCompletedSeries || stats.generalStatus === 'COMPLETED',
    message: toastMsg,
  }
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

  let seasonsDetail = entry.seasonsDetail
  let finalStatus = data.status ?? entry.status
  let finalCurrentEp = data.currentEpisode !== undefined ? data.currentEpisode : entry.currentEpisode
  let finalRating = data.rating !== undefined ? data.rating : entry.rating
  let finalSeason = data.currentSeason !== undefined ? data.currentSeason : entry.currentSeason

  // If entry has seasonsDetail, keep it strictly in sync!
  if (entry.type !== 'FILM' && Array.isArray(seasonsDetail) && seasonsDetail.length > 0) {
    const seasons = seasonsDetail as unknown as SeasonDetailItem[]
    const targetSeasonNum = data.currentSeason ?? entry.currentSeason ?? 1
    const idx = seasons.findIndex((s) => s.seasonNumber === targetSeasonNum)
    if (idx !== -1) {
      if (data.currentEpisode !== undefined) {
        seasons[idx].currentEpisode = data.currentEpisode
      }
      if (data.status !== undefined) {
        seasons[idx].status = data.status
      }
      if (data.rating !== undefined) {
        seasons[idx].rating = data.rating
      }
      if (data.notes !== undefined) {
        seasons[idx].notes = data.notes
      }
    }
    const stats = calculateGeneralStats(seasons)
    finalStatus = stats.generalStatus as any
    finalCurrentEp = stats.totalCurrentEpisodes
    finalRating = stats.generalRating
    finalSeason = stats.activeSeasonNumber
    seasonsDetail = seasons as any
  }

  const nextStatus = finalStatus
  let startedAt = entry.startedAt
  if (entry.type !== 'FILM' && nextStatus !== 'PLAN_TO_WATCH' && !startedAt) {
    startedAt = new Date()
  }

  let completedAt = entry.completedAt
  if (nextStatus === 'COMPLETED' && !completedAt) {
    completedAt = new Date()
  } else if (nextStatus !== 'COMPLETED') {
    completedAt = null
  }

  await prisma.watchEntry.update({
    where: { id },
    data: {
      currentEpisode: finalCurrentEp,
      currentSeason: finalSeason,
      status: nextStatus as any,
      rating: finalRating,
      notes: data.notes !== undefined ? data.notes : entry.notes,
      seasonsDetail: seasonsDetail as any,
      startedAt,
      completedAt,
    },
  })

  revalidatePath('/library')
  revalidatePath(`/library/${id}`)
  revalidatePath('/dashboard')
  revalidatePath('/profile')
}

export async function updateSeasonDetail(
  id: string,
  seasonNumber: number,
  data: {
    title?: string | null
    status?: string
    currentEpisode?: number
    episodes?: number
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
    const totalS = entry.totalSeasons || 1
    const totalE = entry.totalEpisodes || 0
    const epsPerSeason = totalE > 0 ? Math.max(0, Math.floor(totalE / totalS)) : 0
    seasons = Array.from({ length: totalS }, (_, idx) => ({
      seasonNumber: idx + 1,
      title: null,
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
      title: data.title !== undefined ? data.title : targetSeason.title,
      status: nextStatus,
      currentEpisode: Math.min(Math.max(nextCurrentEp, 0), targetSeason.episodes || Infinity),
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
  revalidatePath('/profile')
}

export async function addNewSeasonToWatchEntry(
  id: string,
  episodesCount: number = 0
) {
  const user = await getCurrentUser()

  const entry = await prisma.watchEntry.findUnique({ where: { id } })
  if (!entry || entry.userId !== user.id) throw new Error('Forbidden')

  let seasons: SeasonDetailItem[] = Array.isArray(entry.seasonsDetail)
    ? (entry.seasonsDetail as unknown as SeasonDetailItem[])
    : []

  if (seasons.length === 0) {
    const totalS = entry.totalSeasons || 1
    const totalE = entry.totalEpisodes || 0
    const epsPerSeason = totalE > 0 ? Math.max(0, Math.floor(totalE / totalS)) : 0
    seasons = Array.from({ length: totalS }, (_, idx) => ({
      seasonNumber: idx + 1,
      title: null,
      episodes: epsPerSeason,
      currentEpisode: idx + 1 === entry.currentSeason ? entry.currentEpisode : (entry.status === 'COMPLETED' ? epsPerSeason : 0),
      status: idx + 1 === entry.currentSeason ? entry.status : (entry.status === 'COMPLETED' ? 'COMPLETED' : 'PLAN_TO_WATCH'),
      rating: idx + 1 === entry.currentSeason ? entry.rating : null,
      notes: idx + 1 === entry.currentSeason ? entry.notes : null,
    }))
  }

  const newSeasonNumber = seasons.length + 1
  const newSeasonItem: SeasonDetailItem = {
    seasonNumber: newSeasonNumber,
    title: null,
    episodes: episodesCount > 0 ? episodesCount : 0,
    currentEpisode: 0,
    status: 'PLAN_TO_WATCH',
    rating: null,
    notes: null,
  }

  seasons.push(newSeasonItem)

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
  revalidatePath('/profile')
  return newSeasonNumber
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
    seasonsDetail = seasonsDetail.map((s: any) => {
      const seasonStatus = s.status || status
      const eps = s.episodes || 0
      return {
        seasonNumber: s.seasonNumber,
        title: s.title ? s.title.trim() : null,
        episodes: eps,
        currentEpisode: seasonStatus === 'COMPLETED' ? eps : 0,
        status: seasonStatus,
        rating: seasonsDetail.length === 1 ? (formData.rating || null) : null,
        notes: seasonsDetail.length === 1 ? (formData.notes || null) : null,
      }
    })
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
  revalidatePath('/profile')
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

  let rawSeasonsDetail = formData.type === 'FILM' ? null : (formData.seasonsDetail !== undefined ? formData.seasonsDetail : (entry.seasonsDetail as any))
  let seasonsDetail = rawSeasonsDetail

  if (formData.type !== 'FILM' && Array.isArray(rawSeasonsDetail) && rawSeasonsDetail.length > 0) {
    const existingMap = new Map(
      Array.isArray(entry.seasonsDetail)
        ? (entry.seasonsDetail as any[]).map((s) => [s.seasonNumber, s])
        : []
    )
    seasonsDetail = rawSeasonsDetail.map((s: any) => {
      const existing = existingMap.get(s.seasonNumber)
      const seasonStatus = s.status || existing?.status || 'PLAN_TO_WATCH'
      const eps = s.episodes || 0
      let currentEp = existing?.currentEpisode
      if (currentEp === undefined || seasonStatus === 'COMPLETED') {
        currentEp = seasonStatus === 'COMPLETED' ? eps : 0
      }
      return {
        seasonNumber: s.seasonNumber,
        title: s.title !== undefined ? (s.title ? s.title.trim() : null) : (existing?.title || null),
        episodes: eps,
        currentEpisode: currentEp,
        status: seasonStatus,
        rating: existing?.rating ?? null,
        notes: existing?.notes ?? null,
      }
    })
  }

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
  revalidatePath('/profile')
}

export async function deleteWatchEntry(id: string) {
  const user = await getCurrentUser()

  const entry = await prisma.watchEntry.findUnique({ where: { id } })
  if (!entry || entry.userId !== user.id) throw new Error('Forbidden')

  await prisma.watchEntry.delete({ where: { id } })

  revalidatePath('/library')
  revalidatePath('/dashboard')
  revalidatePath('/profile')
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
  revalidatePath('/profile')
}

