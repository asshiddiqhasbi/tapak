export function formatEpisodeText(
  type: string,
  currentEpisode: number,
  totalEpisodes?: number | null,
  currentSeason?: number | null,
  totalSeasons?: number | null
): string | null {
  if (type === 'FILM') return null

  const epPart = !totalEpisodes || totalEpisodes <= 0
    ? `Ep ${currentEpisode}`
    : `Ep ${currentEpisode}/${totalEpisodes}`

  if (totalSeasons && totalSeasons > 1) {
    const sNum = currentSeason || 1
    return `S${sNum}/${totalSeasons} • ${epPart}`
  }

  if (currentSeason && currentSeason > 1) {
    return `Season ${currentSeason} • ${epPart}`
  }

  if (!totalEpisodes || totalEpisodes <= 0) {
    return `${epPart} (Ongoing)`
  }

  return epPart
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
  let droppedCount = 0
  let activeSeasonNumber = 1
  let foundActiveSeason = false

  for (const s of seasons) {
    totalEpisodes += s.episodes || 0
    totalCurrentEpisodes += s.currentEpisode || 0

    if (s.rating && typeof s.rating === 'number' && !isNaN(s.rating) && s.rating > 0) {
      ratingSum += s.rating
      ratedCount++
    }

    if (s.status === 'COMPLETED') completedCount++
    else if (s.status === 'PLAN_TO_WATCH') planToWatchCount++
    else if (s.status === 'DROPPED') droppedCount++

    if (!foundActiveSeason && (s.status === 'WATCHING' || s.status === 'ON_HOLD')) {
      activeSeasonNumber = s.seasonNumber
      foundActiveSeason = true
    }
  }

  if (!foundActiveSeason) {
    const firstUnfinished = seasons.find((s) => s.status !== 'COMPLETED')
    activeSeasonNumber = firstUnfinished ? firstUnfinished.seasonNumber : (seasons[0]?.seasonNumber || 1)
  }

  const generalRating = ratedCount > 0 ? parseFloat((ratingSum / ratedCount).toFixed(1)) : null

  let generalStatus = 'WATCHING'
  if (completedCount === seasons.length) {
    generalStatus = 'COMPLETED'
  } else if (planToWatchCount === seasons.length) {
    generalStatus = 'PLAN_TO_WATCH'
  } else if (droppedCount === seasons.length) {
    generalStatus = 'DROPPED'
  }

  return {
    totalEpisodes,
    totalCurrentEpisodes,
    generalRating,
    generalStatus,
    activeSeasonNumber,
  }
}
