export default function LibraryLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6 animate-pulse" aria-busy="true">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-lg bg-surface-hover/80" />
          <div className="h-4 w-72 rounded bg-surface-hover/60" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-surface-hover/80" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="h-16 rounded-2xl bg-surface-hover/70 border border-border/40" />

      {/* Grid List Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex gap-4 rounded-2xl border border-border/40 bg-surface-hover/70 p-4 h-36"
          >
            <div className="h-28 w-20 flex-shrink-0 rounded-lg bg-surface-hover/90" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-4 w-24 rounded bg-surface-hover/90" />
              <div className="h-5 w-3/4 rounded bg-surface-hover/90" />
              <div className="h-3 w-1/2 rounded bg-surface-hover/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
