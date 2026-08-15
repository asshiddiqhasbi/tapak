export default function DetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6 animate-pulse" aria-busy="true">
      <div className="h-6 w-28 rounded bg-surface-hover/80" />

      {/* Header Info Skeleton */}
      <div className="flex flex-col sm:flex-row gap-6 rounded-2xl border border-border/40 bg-surface-hover/70 p-6">
        <div className="h-44 w-32 flex-shrink-0 rounded-xl bg-surface-hover/90 mx-auto sm:mx-0" />
        <div className="flex-1 space-y-4 py-2">
          <div className="h-4 w-32 rounded bg-surface-hover/90" />
          <div className="h-8 w-2/3 rounded bg-surface-hover/90" />
          <div className="h-4 w-1/2 rounded bg-surface-hover/60" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 h-64 rounded-2xl bg-surface-hover/70 border border-border/40" />
        <div className="h-64 rounded-2xl bg-surface-hover/70 border border-border/40" />
      </div>
    </div>
  )
}
