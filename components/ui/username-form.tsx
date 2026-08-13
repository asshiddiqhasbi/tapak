'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUsername } from '@/lib/actions/user'
import Toast from '@/components/ui/toast'

export default function UsernameForm({ initialUsername }: { initialUsername: string }) {
  const router = useRouter()
  const [username, setUsername] = useState(initialUsername)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)

    const res = await updateUsername(username)
    if (res?.error) {
      setError(res.error)
    } else {
      setSaved(true)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-2">
      <Toast
        message={error || (saved ? 'Username berhasil diperbarui!' : null)}
        type={error ? 'error' : 'success'}
        onClose={() => {
          setError(null)
          setSaved(false)
        }}
      />

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value)
            setError(null)
          }}
          className="rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent w-full"
          required
        />
        <button
          type="submit"
          disabled={loading || username.trim() === initialUsername}
          className="rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-background hover:bg-accent-hover disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {loading ? 'Simpan...' : 'Simpan'}
        </button>
      </form>
    </div>
  )
}