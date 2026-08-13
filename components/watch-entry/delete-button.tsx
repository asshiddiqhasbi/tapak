'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteWatchEntry } from '@/lib/actions/watch-entries'

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const confirmed = confirm('Yakin ingin menghapus tontonan ini?')
    if (!confirmed) return

    setLoading(true)
    try {
      await deleteWatchEntry(id)
      router.push('/library')
      router.refresh()
    } catch {
      alert('Gagal menghapus data')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-md border border-rose-900/50 bg-rose-950/40 px-2.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-900/60 hover:text-rose-200 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Menghapus...' : 'Hapus'}
    </button>
  )
}