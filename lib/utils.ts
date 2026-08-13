export function formatEpisodeText(
  type: string,
  currentEpisode: number,
  totalEpisodes?: number | null
): string | null {
  if (type === 'FILM') return null
  if (!totalEpisodes || totalEpisodes <= 0) {
    return `Ep ${currentEpisode} (Ongoing)`
  }
  return `Ep ${currentEpisode}/${totalEpisodes}`
}
