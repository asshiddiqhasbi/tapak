export function parseSeasonsDetail(raw: unknown): SeasonDetailItem[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as SeasonDetailItem[]
  try {
    if (typeof raw === 'string') {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as SeasonDetailItem[]) : []
    }
  } catch {
    return []
  }
  return []
}

export function formatEpisodeText(
  type: string,
  currentEpisode: number,
  totalEpisodes?: number | null,
  currentSeason?: number | null,
  totalSeasons?: number | null,
  isOngoing?: boolean,
  seasonsDetail?: unknown
): string | null {
  if (type === 'FILM') return null

  if (seasonsDetail) {
    const stats = getActiveSeasonStats({
      type,
      currentEpisode,
      totalEpisodes,
      currentSeason,
      totalSeasons,
      seasonsDetail,
      isOngoing,
    })
    return stats.displayEpisodeText
  }

  const hasTotal = totalEpisodes !== undefined && totalEpisodes !== null && totalEpisodes > 0
  const epPart = hasTotal
    ? `Eps ${currentEpisode}/${totalEpisodes}`
    : `Eps ${currentEpisode}`

  const ongoingSuffix = isOngoing ? ' (Ongoing)' : ''

  if (totalSeasons && totalSeasons > 1) {
    const sNum = currentSeason || 1
    return `S${sNum} • ${epPart}${ongoingSuffix}`
  }

  if (currentSeason && currentSeason > 1) {
    return `Season ${currentSeason} • ${epPart}${ongoingSuffix}`
  }

  return `${epPart}${ongoingSuffix}`
}

export interface SeasonDetailItem {
  seasonNumber: number
  title?: string | null
  episodes: number
  currentEpisode: number
  status: string
  rating?: number | null
  notes?: string | null
}

export function calculateGeneralStats(seasons: SeasonDetailItem[]) {
  if (!seasons || seasons.length === 0) {
    return {
      totalEpisodes: 0,
      totalCurrentEpisodes: 0,
      generalRating: null,
      generalStatus: 'PLAN_TO_WATCH',
      activeSeasonNumber: 1,
    }
  }

  let totalEpisodes = 0
  let totalCurrentEpisodes = 0
  let ratedCount = 0
  let ratingSum = 0

  let completedCount = 0
  let planToWatchCount = 0

  for (const s of seasons) {
    totalEpisodes += s.episodes || 0
    totalCurrentEpisodes += s.currentEpisode || 0

    if (s.rating && typeof s.rating === 'number' && !isNaN(s.rating) && s.rating > 0) {
      ratingSum += s.rating
      ratedCount++
    }

    if (s.status === 'COMPLETED') completedCount++
    else if (s.status === 'PLAN_TO_WATCH') planToWatchCount++
  }

  const generalRating = ratedCount > 0 ? parseFloat((ratingSum / ratedCount).toFixed(1)) : null

  let generalStatus = 'WATCHING'
  let activeSeasonNumber = 1

  if (seasons.length === 1) {
    generalStatus = seasons[0].status
    activeSeasonNumber = seasons[0].seasonNumber
  } else if (completedCount === seasons.length) {
    generalStatus = 'COMPLETED'
    activeSeasonNumber = seasons[seasons.length - 1].seasonNumber
  } else if (planToWatchCount === seasons.length) {
    generalStatus = 'PLAN_TO_WATCH'
    activeSeasonNumber = 1
  } else {
    // Multi-season mixed status: find latest started / active season
    const startedSeasons = seasons.filter(
      (s) => s.status !== 'PLAN_TO_WATCH' || (s.currentEpisode || 0) > 0
    )

    if (startedSeasons.length === 0) {
      generalStatus = 'PLAN_TO_WATCH'
      activeSeasonNumber = 1
    } else {
      const latestSeason = startedSeasons[startedSeasons.length - 1]
      activeSeasonNumber = latestSeason.seasonNumber

      if (latestSeason.status === 'DROPPED') {
        generalStatus = 'DROPPED'
      } else if (latestSeason.status === 'ON_HOLD') {
        generalStatus = 'ON_HOLD'
      } else if (latestSeason.status === 'WATCHING') {
        generalStatus = 'WATCHING'
      } else if (latestSeason.status === 'COMPLETED') {
        // Season ini completed, tapi season setelahnya masih plan to watch / belum selesai
        generalStatus = 'WATCHING'
      } else {
        generalStatus = latestSeason.status
      }
    }
  }

  return {
    totalEpisodes,
    totalCurrentEpisodes,
    generalRating,
    generalStatus,
    activeSeasonNumber,
  }
}

export function getActiveSeasonStats(entry: {
  type: string
  currentEpisode: number
  totalEpisodes?: number | null
  currentSeason?: number | null
  totalSeasons?: number | null
  seasonsDetail?: unknown
  isOngoing?: boolean
}) {
  if (entry.type === 'FILM') {
    return {
      isFilm: true,
      displayEpisodeText: null,
      activeSeasonNumber: 1,
      activeSeasonTitle: null,
      seasonCurrentEpisode: 0,
      seasonTotalEpisodes: 0,
      totalCurrentEpisodes: 0,
      totalEpisodes: null,
      progressPct: null,
      nextEpisodeNumber: 1,
      isLastEpisodeOfSeason: false,
      isLastEpisodeOfSeries: false,
      isMultiSeason: false,
    }
  }

  const seasons = parseSeasonsDetail(entry.seasonsDetail)
  const isOngoing = !!entry.isOngoing

  if (seasons.length > 0) {
    const activeSeasonNumber = entry.currentSeason || 1
    const activeSeason = seasons.find((s) => s.seasonNumber === activeSeasonNumber) || seasons[0]
    const sNum = activeSeason.seasonNumber
    const sTitle = activeSeason.title ? activeSeason.title.trim() : null
    const sCur = activeSeason.currentEpisode || 0
    const sTotal = activeSeason.episodes || 0
    const hasTotalSeason = sTotal > 0

    const ongoingSuffix = isOngoing ? ' (Ongoing)' : ''
    const epSeasonPart = hasTotalSeason ? `Eps ${sCur}/${sTotal}` : `Eps ${sCur}`

    let displayEpisodeText = ''
    if (seasons.length > 1) {
      const seasonPrefix = sTitle ? `S${sNum} (${sTitle})` : `S${sNum}`
      displayEpisodeText = `${seasonPrefix} • ${epSeasonPart}${ongoingSuffix}`
    } else {
      const seasonPrefix = sTitle ? `${sTitle} • ` : ''
      displayEpisodeText = `${seasonPrefix}${epSeasonPart}${ongoingSuffix}`
    }

    const totalOverallEpisodes = seasons.reduce((acc, s) => acc + (s.episodes || 0), 0)
    const totalOverallCurrent = seasons.reduce((acc, s) => acc + (s.currentEpisode || 0), 0)

    const progressPct =
      totalOverallEpisodes > 0
        ? Math.min(Math.round((totalOverallCurrent / totalOverallEpisodes) * 100), 100)
        : null

    const isLastEpisodeOfSeason = hasTotalSeason && sCur >= sTotal
    const isLastEpisodeOfSeries = isLastEpisodeOfSeason && activeSeasonNumber === seasons.length

    return {
      isFilm: false,
      displayEpisodeText,
      activeSeasonNumber: sNum,
      activeSeasonTitle: sTitle,
      seasonCurrentEpisode: sCur,
      seasonTotalEpisodes: sTotal,
      totalCurrentEpisodes: totalOverallCurrent,
      totalEpisodes: totalOverallEpisodes > 0 ? totalOverallEpisodes : null,
      progressPct,
      nextEpisodeNumber: sCur + 1,
      isLastEpisodeOfSeason,
      isLastEpisodeOfSeries,
      isMultiSeason: seasons.length > 1,
    }
  }

  // Fallback for entry without seasonsDetail
  const hasTotal = entry.totalEpisodes !== undefined && entry.totalEpisodes !== null && entry.totalEpisodes > 0
  const epPart = hasTotal
    ? `Eps ${entry.currentEpisode}/${entry.totalEpisodes}`
    : `Eps ${entry.currentEpisode}`
  const ongoingSuffix = isOngoing ? ' (Ongoing)' : ''

  let displayEpisodeText = epPart + ongoingSuffix
  if (entry.totalSeasons && entry.totalSeasons > 1) {
    displayEpisodeText = `S${entry.currentSeason || 1} • ${epPart}${ongoingSuffix}`
  }

  const progressPct =
    hasTotal && entry.totalEpisodes
      ? Math.min(Math.round((entry.currentEpisode / entry.totalEpisodes) * 100), 100)
      : null

  const isLast = hasTotal && entry.totalEpisodes ? entry.currentEpisode >= entry.totalEpisodes : false

  return {
    isFilm: false,
    displayEpisodeText,
    activeSeasonNumber: entry.currentSeason || 1,
    activeSeasonTitle: null,
    seasonCurrentEpisode: entry.currentEpisode,
    seasonTotalEpisodes: entry.totalEpisodes || 0,
    totalCurrentEpisodes: entry.currentEpisode,
    totalEpisodes: entry.totalEpisodes || null,
    progressPct,
    nextEpisodeNumber: entry.currentEpisode + 1,
    isLastEpisodeOfSeason: isLast,
    isLastEpisodeOfSeries: isLast,
    isMultiSeason: (entry.totalSeasons || 1) > 1,
  }
}

