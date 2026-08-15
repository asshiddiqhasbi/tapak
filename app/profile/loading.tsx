export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-8 animate-pulse" aria-busy="true">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-surface-hover/80" />
        <div className="h-4 w-72 rounded bg-surface-hover/60" />
      </div>

      <div className="h-48 rounded-2xl bg-surface-hover/70 border border-border/40" />
      <div className="h-64 rounded-2xl bg-surface-hover/70 border border-border/40" />
    </div>
  )
}
