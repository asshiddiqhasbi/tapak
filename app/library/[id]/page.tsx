import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase-server'
import ProgressControl from '@/components/watch-entry/progress-control'
import DeleteButton from '@/components/watch-entry/delete-button'
import { formatEpisodeText } from '@/lib/utils'

export default async function WatchEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const entry = await prisma.watchEntry.findUnique({ where: { id } })
  if (!entry || entry.userId !== user.id) notFound()

  const epText = formatEpisodeText(entry.type, entry.currentEpisode, entry.totalEpisodes)

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-accent transition-colors"
        >
          &larr; Kembali ke Library
        </Link>
      </div>

      {/* Header Info Card */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-2xl border border-border/80 bg-surface/95 backdrop-blur-md p-6 shadow-xl shadow-black/40">
        <div className="flex gap-4">
          {entry.posterUrl ? (
            <img
              src={entry.posterUrl}
              alt={entry.title}
              className="h-36 w-24 flex-shrink-0 object-cover rounded-xl border border-border/80 shadow-md"
            />
          ) : (
            <div className="flex h-36 w-24 flex-shrink-0 items-center justify-center rounded-xl border border-border/80 bg-surface-hover text-xs font-bold text-muted uppercase">
              {entry.type}
            </div>
          )}

          <div className="space-y-1.5">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-accent bg-accent-muted border border-accent/20 px-2 py-0.5 rounded">
              {entry.type}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{entry.title}</h1>
            <div className="flex items-center gap-3 text-xs text-muted">
              {epText && <span>{epText}</span>}
              {entry.rating && (
                <span className="text-amber-400 font-semibold">★ {entry.rating}/10</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Link
            href={`/library/${entry.id}/edit`}
            className="rounded-md border border-border/80 bg-surface-hover px-3 py-1.5 text-xs font-medium text-foreground hover:bg-border transition-colors shadow-sm"
          >
            Edit
          </Link>
          <DeleteButton id={entry.id} />
        </div>
      </div>

      {/* Ringkasan Metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-border/80 bg-surface/95 backdrop-blur-md p-4 text-xs shadow-xl shadow-black/30">
        <div>
          <span className="text-muted block font-medium">Total Episode</span>
          <span className="font-semibold text-foreground mt-0.5 block">
            {entry.type === 'FILM' ? '-' : (entry.totalEpisodes ?? 'Ongoing')}
          </span>
        </div>
        <div>
          <span className="text-muted block font-medium">Rating Personal</span>
          <span className="font-semibold text-foreground mt-0.5 block">
            {entry.rating ? `★ ${entry.rating} / 10` : 'Belum dinilai'}
          </span>
        </div>
        <div>
          <span className="text-muted block font-medium">Tanggal Mulai</span>
          <span className="font-semibold text-foreground mt-0.5 block">
            {entry.startedAt ? new Date(entry.startedAt).toLocaleDateString('id-ID') : '-'}
          </span>
        </div>
        <div>
          <span className="text-muted block font-medium">Tanggal Selesai</span>
          <span className="font-semibold text-foreground mt-0.5 block">
            {entry.completedAt ? new Date(entry.completedAt).toLocaleDateString('id-ID') : '-'}
          </span>
        </div>
      </div>

      {/* Control Update Progress, Status, Rating & Notes */}
      <ProgressControl
        id={entry.id}
        type={entry.type}
        currentEpisode={entry.currentEpisode}
        totalEpisodes={entry.totalEpisodes}
        status={entry.status}
        rating={entry.rating}
        notes={entry.notes}
      />
    </div>
  )
}