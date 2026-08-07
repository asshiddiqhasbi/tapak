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
      className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 disabled:opacity-50"
    >
      {loading ? 'Menghapus...' : 'Hapus'}
    </button>
  )
}