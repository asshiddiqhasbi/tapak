'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWatchEntry, updateWatchEntry } from '@/lib/actions/watch-entries'

type WatchType = 'ANIME' | 'SERIES' | 'FILM'

type Props = {
  initialData?: {
    id: string
    title: string
    type: WatchType
    posterUrl?: string | null
    totalEpisodes?: number | null
  }
}

export default function WatchEntryForm({ initialData }: Props) {
  const router = useRouter()
  const isEdit = !!initialData

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [type, setType] = useState<WatchType>(initialData?.type ?? 'ANIME')
  const [posterUrl, setPosterUrl] = useState(initialData?.posterUrl ?? '')
  const [totalEpisodes, setTotalEpisodes] = useState(
    initialData?.totalEpisodes?.toString() ?? ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = {
      title,
      type,
      posterUrl: posterUrl || undefined,
      totalEpisodes: totalEpisodes ? parseInt(totalEpisodes) : undefined,
    }

    try {
      if (isEdit) {
        await updateWatchEntry(initialData.id, payload)
      } else {
        await createWatchEntry(payload)
      }
      router.push('/library')
      router.refresh()
    } catch (err) {
      setError('Gagal menyimpan data')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">
        {isEdit ? 'Edit Tontonan' : 'Tambah Tontonan'}
      </h1>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div>
        <label className="block text-sm font-medium">Judul</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Tipe</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as WatchType)}
          className="mt-1 w-full rounded border px-3 py-2"
        >
          <option value="ANIME">Anime</option>
          <option value="SERIES">Series</option>
          <option value="FILM">Film</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Total Episode (opsional)</label>
        <input
          type="number"
          value={totalEpisodes}
          onChange={(e) => setTotalEpisodes(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
          min={1}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Poster URL (opsional)</label>
        <input
          type="text"
          value={posterUrl}
          onChange={(e) => setPosterUrl(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
          placeholder="https://..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah'}
      </button>
    </form>
  )
}