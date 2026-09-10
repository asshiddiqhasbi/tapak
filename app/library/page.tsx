import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase-server'
import LibraryFilters from '@/components/watch-entry/library-filters'
import BulkDeleteManager from '@/components/watch-entry/bulk-delete-manager'

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; medium?: string; sort?: string; q?: string; query?: string }>
}) {
  const { status, type, medium, sort, q, query } = await searchParams
  const searchQuery = (q || query || '').trim()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const whereClause: any = { userId: user.id }
  if (status && status !== 'ALL') {
    whereClause.status = status
  }
  if (type && type !== 'ALL') {
    whereClause.type = type
  }
  if (medium && medium !== 'ALL') {
    whereClause.medium = medium
  }
  if (searchQuery) {
    whereClause.title = {
      contains: searchQuery,
      mode: 'insensitive',
    }
  }

  let orderBy: any = { createdAt: 'desc' }
  if (sort === 'updated') orderBy = { updatedAt: 'desc' }
  if (sort === 'title') orderBy = { title: 'asc' }
  if (sort === 'rating') {
    orderBy = [{ rating: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }]
  }

  const entries = await prisma.watchEntry.findMany({
    where: whereClause,
    orderBy,
  })

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="h-6 w-1 rounded-full bg-accent flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Library Tontonan
            </h1>
          </div>
          <p className="text-sm text-muted pl-3.5">
            Kelola dan cari koleksi tontonan Anda ({entries.length} judul tersimpan)
          </p>
        </div>
        <Link
          href="/library/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:bg-accent-hover active:scale-[0.98] transition-all shadow-md shadow-accent/20"
        >
          <span className="text-base font-bold leading-none select-none">+</span>
          <span>Tambah Tontonan</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-md">
        <LibraryFilters
          currentStatus={status ?? 'ALL'}
          currentType={type ?? 'ALL'}
          currentMedium={medium ?? 'ALL'}
          currentSort={sort ?? 'newest'}
          currentQuery={searchQuery}
        />
      </div>

      {/* Entries List / Grid */}
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-surface/95 backdrop-blur-md p-12 text-center shadow-xl shadow-black/30 space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-muted text-accent text-3xl border border-accent/20">
            🎬
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Tidak ada tontonan ditemukan</h2>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Tidak ada judul yang sesuai dengan kriteria pencarian atau filter saat ini. Coba ganti kata kunci pencarian atau reset filter.
            </p>
          </div>
          <Link
            href="/library/new"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-background hover:bg-accent-hover transition-colors shadow-md"
          >
            + Tambah Tontonan Baru
          </Link>
        </div>
      ) : (
        <BulkDeleteManager entries={entries} searchQuery={searchQuery} />
      )}
    </div>
  )
}