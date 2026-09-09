export function formatEpisodeText(
  type: string,
  currentEpisode: number,
  totalEpisodes?: number | null,
  currentSeason?: number | null,
  totalSeasons?: number | null,
  isOngoing?: boolean
): string | null {
  if (type === 'FILM') return null

  const hasTotal = totalEpisodes !== undefined && totalEpisodes !== null && totalEpisodes > 0
  const epPart = hasTotal
    ? `Eps ${currentEpisode}/${totalEpisodes}`
    : `Eps ${currentEpisode}`

  const ongoingSuffix = isOngoing ? ' (Ongoing)' : ''

  if (totalSeasons && totalSeasons > 1) {
    const sNum = currentSeason || 1
    return `S${sNum}/${totalSeasons} • ${epPart}${ongoingSuffix}`
  }

  if (currentSeason && currentSeason > 1) {
    return `Season ${currentSeason} • ${epPart}${ongoingSuffix}`
  }

  return `${epPart}${ongoingSuffix}`
}

export interface SeasonDetailItem {
  seasonNumber: number
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
