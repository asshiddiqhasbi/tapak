export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-12 animate-pulse" aria-busy="true">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-64 rounded-lg bg-surface-hover/80" />
        <div className="h-4 w-96 max-w-full rounded bg-surface-hover/60" />
        <div className="h-10 w-48 rounded-xl bg-surface-hover/70 mt-4" />
      </div>

      {/* Section 1 Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-44 rounded-md bg-surface-hover/80" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-2xl bg-surface-hover/70 border border-border/40" />
          ))}
        </div>
      </div>

      {/* Section 2 Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-44 rounded-md bg-surface-hover/80" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-2xl bg-surface-hover/70 border border-border/40" />
          ))}
        </div>
      </div>
    </div>
  )
}
