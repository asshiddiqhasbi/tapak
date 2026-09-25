import Link from 'next/link'

export type JourneyEvent = {
  id: string
  entryId: string
  title: string
  date: Date
  type: 'COMPLETED' | 'RATED' | 'PROGRESS' | 'ADDED'
  actionText: string
  badge: string
  badgeClass: string
  icon: string
  meta?: string
}

export function formatJourneyRelativeTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 5) return 'Baru saja'
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`
  if (diffHours < 24 && d.getDate() === now.getDate()) return 'Hari ini'
  if (diffDays === 1 || (diffHours < 48 && d.getDate() === now.getDate() - 1)) return 'Kemarin'
  if (diffDays < 7) return `${diffDays} hari lalu`
  if (diffDays < 14) return '1 minggu lalu'
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`

  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function EventPinIcon({ type }: { type: JourneyEvent['type'] }) {
  if (type === 'COMPLETED') {
    return (
      <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  if (type === 'RATED') {
    return (
      <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    )
  }
  return (
    <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

export default function YourJourneyTimeline({ events }: { events: JourneyEvent[] }) {
  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Aktivitas Terbaru
        </h2>
        <span className="text-xs text-muted font-mono">
          {events.length} aktivitas
        </span>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-surface/30 p-8 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface-hover border border-border text-muted">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Belum ada aktivitas tercatat</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Setiap kali kamu menambah atau menyelesaikan tontonan, riwayatnya akan muncul di sini.
            </p>
          </div>
          <Link
            href="/library/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-background hover:bg-accent-hover transition-colors shadow-sm"
          >
            + Tambah Tontonan
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-surface p-5 sm:p-6 shadow-md">
          <div className="relative space-y-4">
            {events.map((event, index) => {
              const isLast = index === events.length - 1
              const timeLabel = formatJourneyRelativeTime(event.date)

              return (
                <div key={event.id} className="relative flex gap-4 sm:gap-5">
                  {/* Left Column: Event Icon Pin & Continuous Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-hover shadow-sm">
                      <EventPinIcon type={event.type} />
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 bg-border/80 my-1.5 min-h-[32px]" />
                    )}
                  </div>

                  {/* Right Column: Time label + Event Card */}
                  <div className="flex-1 pb-2 min-w-0">
                    <div className="text-[11px] font-mono font-medium text-muted mb-1.5 flex items-center gap-2">
                      <span>{timeLabel}</span>
                      {event.meta && (
                        <>
                          <span>•</span>
                          <span className="opacity-80">{event.meta}</span>
                        </>
                      )}
                    </div>

                    <Link
                      href={`/library/${event.entryId}`}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface-hover/60 p-3 sm:p-3.5 hover:border-accent/40 hover:bg-surface-hover transition-all duration-200"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="text-xs sm:text-sm text-muted min-w-0">
                          <span className="text-muted/90">{event.actionText} </span>
                          <strong className="text-foreground font-semibold group-hover:text-accent transition-colors">
                            {event.title}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                        <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-md border font-mono ${event.badgeClass}`}>
                          {event.badge}
                        </span>
                        <svg
                          className="h-4 w-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
