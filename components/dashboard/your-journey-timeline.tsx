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

  if (diffMinutes < 5) return 'BARU SAJA'
  if (diffMinutes < 60) return `${diffMinutes} MENIT LALU`
  if (diffHours < 24 && d.getDate() === now.getDate()) return 'HARI INI'
  if (diffDays === 1 || (diffHours < 48 && d.getDate() === now.getDate() - 1)) return 'KEMARIN'
  if (diffDays < 7) return `${diffDays} HARI LALU`
  if (diffDays < 14) return '1 MINGGU LALU'
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} MINGGU LALU`

  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  }).toUpperCase()
}

export default function YourJourneyTimeline({ events }: { events: JourneyEvent[] }) {
  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/15 border border-accent/25 text-accent text-sm">
            👣
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              Jejak Tontonan <span className="text-xs font-mono font-normal text-muted uppercase tracking-wider">(Your Journey)</span>
            </h2>
          </div>
        </div>
        <span className="text-xs text-muted font-mono">
          {events.length} jejak tercatat
        </span>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-surface/40 p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted text-accent text-xl">
            👣
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Belum ada jejak perjalanan</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Setiap kali kamu menambah tontonan, mengupdate episode, atau memberi rating, jejaknya akan tercatat rapi di sini.
            </p>
          </div>
          <Link
            href="/library/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-background hover:bg-accent-hover transition-colors shadow-sm"
          >
            + Mulai Tinggalkan Jejak
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-surface/90 backdrop-blur-md p-5 sm:p-6 shadow-xl shadow-black/20">
          <div className="relative space-y-4">
            {events.map((event, index) => {
              const isLast = index === events.length - 1
              const timeLabel = formatJourneyRelativeTime(event.date)

              return (
                <div key={event.id} className="relative flex gap-4 sm:gap-5">
                  {/* Left Column: Number Circle & Continuous Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border border-border/90 bg-surface-hover/90 text-xs font-mono font-bold text-accent shadow-sm group-hover:border-accent">
                      {index + 1}
                    </div>
                    {!isLast && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-border/90 via-border/50 to-border/20 my-1.5 min-h-[32px]" />
                    )}
                  </div>

                  {/* Right Column: Time label + Event Card */}
                  <div className="flex-1 pb-2 min-w-0">
                    <div className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-2">
                      <span>{timeLabel}</span>
                      {event.meta && (
                        <>
                          <span>•</span>
                          <span className="opacity-75">{event.meta}</span>
                        </>
                      )}
                    </div>

                    <Link
                      href={`/library/${event.entryId}`}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/70 bg-surface-hover/50 p-3 sm:p-3.5 hover:border-accent/60 hover:bg-surface-hover transition-all duration-200 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface border border-border text-sm shadow-inner">
                          {event.icon}
                        </span>
                        <div className="text-xs sm:text-sm text-muted min-w-0">
                          <span className="text-muted/90">{event.actionText} </span>
                          <strong className="text-foreground font-semibold group-hover:text-accent transition-colors">
                            {event.title}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono ${event.badgeClass}`}>
                          {event.badge}
                        </span>
                        <svg
                          className="h-4 w-4 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all"
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
