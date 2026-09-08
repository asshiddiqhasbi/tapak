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
