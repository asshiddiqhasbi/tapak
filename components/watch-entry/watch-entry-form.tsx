'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createWatchEntry, updateWatchEntry } from '@/lib/actions/watch-entries'
import { createClient } from '@/lib/supabase'

import Toast from '@/components/ui/toast'
import ImageCropperModal from '@/components/ui/image-cropper-modal'

type WatchType = 'ANIME' | 'SERIES' | 'FILM'
type WatchStatus = 'PLAN_TO_WATCH' | 'WATCHING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED'

type Props = {
  existingGroupTitles?: string[]
  initialData?: {
    id: string
    title: string
    groupTitle?: string | null
    type: WatchType
    posterUrl?: string | null
    totalEpisodes?: number | null
    currentEpisode?: number | null
    status?: WatchStatus | null
  }
}

const BUCKET_NAME = 'tapak-media'
const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB

const STATUS_OPTIONS: { value: WatchStatus; label: string }[] = [
  { value: 'PLAN_TO_WATCH', label: 'Plan to Watch' },
  { value: 'WATCHING', label: 'Watching' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'DROPPED', label: 'Dropped' },
]

export default function WatchEntryForm({ initialData, existingGroupTitles = [] }: Props) {
  const router = useRouter()
  const isEdit = !!initialData

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [groupTitle, setGroupTitle] = useState(initialData?.groupTitle ?? '')
  const [type, setType] = useState<WatchType>(initialData?.type ?? 'ANIME')
  const [status, setStatus] = useState<WatchStatus>(initialData?.status ?? 'PLAN_TO_WATCH')
  const [totalEpisodes, setTotalEpisodes] = useState(
    initialData?.totalEpisodes?.toString() ?? ''
  )
  const [currentEpisode, setCurrentEpisode] = useState(
    initialData?.currentEpisode?.toString() ?? '0'
  )

  const [posterUrl] = useState(initialData?.posterUrl ?? '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [cropRawSrc, setCropRawSrc] = useState<string | null>(null)

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleStatusChange(newStatus: WatchStatus) {
    setStatus(newStatus)
    setError(null)

    if (newStatus === 'PLAN_TO_WATCH') {
      setCurrentEpisode('0')
    } else if (newStatus === 'COMPLETED') {
      const parsedTotal = parseInt(totalEpisodes)
      if (!isNaN(parsedTotal) && parsedTotal > 0) {
        setCurrentEpisode(parsedTotal.toString())
      }
    }
  }

  function handleTotalEpisodesChange(value: string) {
    setTotalEpisodes(value)
    if (status === 'COMPLETED') {
      const parsedTotal = parseInt(value)
      if (!isNaN(parsedTotal) && parsedTotal > 0) {
        setCurrentEpisode(parsedTotal.toString())
      }
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi Jenis File Gambar
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError('Jenis file harus berupa gambar (JPG, PNG, atau WebP).')
      e.target.value = ''
      return
    }

    // Validasi Ukuran File (Maks 1MB)
    if (file.size > MAX_FILE_SIZE) {
      setError('Ukuran file maksimal 1MB, silakan compress dulu.')
      e.target.value = ''
      return
    }

    const rawUrl = URL.createObjectURL(file)
    setCropRawSrc(rawUrl)
    e.target.value = ''
  }

  async function uploadPosterFile(file: File): Promise<string> {
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `posters/poster-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { upsert: true })

      if (uploadErr) {
        console.warn('Supabase storage upload fallback to base64:', uploadErr.message)
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      }

      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath)

      return publicData.publicUrl
    } catch {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }
  }

  function handleFormSubmitAttempt(e: React.FormEvent) {
    e.preventDefault()
    if (isEdit && initialData?.status === 'COMPLETED' && status !== 'COMPLETED') {
      setShowConfirmModal(true)
      return
    }
    executeSubmit()
  }

  async function executeSubmit() {
    setError(null)
    setLoading(true)

    let finalPosterUrl = posterUrl || undefined

    if (selectedFile) {
      try {
        finalPosterUrl = await uploadPosterFile(selectedFile)
      } catch (err) {
        setError('Gagal memproses file poster')
        setLoading(false)
        return
      }
    }

    const parsedTotal = totalEpisodes ? parseInt(totalEpisodes) : undefined
    const parsedCurrent = status === 'PLAN_TO_WATCH' ? 0 : (currentEpisode ? parseInt(currentEpisode) : 0)

    const payload = {
      title,
      groupTitle: groupTitle.trim() || undefined,
      type,
      status,
      posterUrl: finalPosterUrl,
      totalEpisodes: type === 'FILM' ? undefined : parsedTotal,
      currentEpisode: type === 'FILM' ? 0 : parsedCurrent,
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
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isEdit ? 'Edit Tontonan' : 'Tambah Tontonan Baru'}
          </h1>
          <p className="text-xs text-muted mt-1">
            {isEdit ? 'Ubah informasi tontonan yang dipilih' : 'Tambahkan tontonan baru ke perpustakaan Anda'}
          </p>
        </div>
        <Link
          href="/library"
          className="text-xs font-medium text-muted hover:text-foreground transition-colors"
        >
          Batal
        </Link>
      </div>

      <Toast message={error} type="error" onClose={() => setError(null)} />

      {cropRawSrc && (
        <ImageCropperModal
          imageSrc={cropRawSrc}
          aspectRatio={2 / 3}
          cropShape="rect"
          title="Potong Poster Tontonan (2:3)"
          onCancel={() => setCropRawSrc(null)}
          onCropComplete={(croppedFile, previewUrl) => {
            setSelectedFile(croppedFile)
            setFilePreview(previewUrl)
            setCropRawSrc(null)
          }}
        />
      )}

      {/* Confirmation Modal for high-risk status change from COMPLETED */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border/80 bg-surface p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-950/70 border border-amber-800/50 text-sm">
                  ⚠️
                </span>
                <span>Konfirmasi Perubahan Status</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Ubah status dari Completed?
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Mengubah status dari <strong>Completed (Selesai)</strong> akan memperbarui status progres tontonan. Yakin ingin melanjutkan?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                className="rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false)
                  executeSubmit()
                }}
                disabled={loading}
                className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-background hover:bg-accent-hover transition-colors shadow-md"
              >
                {loading ? 'Memproses...' : 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleFormSubmitAttempt} className="rounded-xl border border-border/80 bg-surface/95 backdrop-blur-md p-6 shadow-xl shadow-black/40 space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
            Judul Tontonan *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-hover px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
            placeholder="Contoh: One Piece, Severance, Interstellar..."
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
            Nama Seri / Koleksi (opsional)
          </label>
          <input
            type="text"
            list="group-title-list"
            value={groupTitle}
            onChange={(e) => setGroupTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-hover px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
            placeholder="Opsional, misal: Iron Man, Naruto, Demon Slayer..."
          />
          {existingGroupTitles && existingGroupTitles.length > 0 && (
            <datalist id="group-title-list">
              {existingGroupTitles.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          )}
          <p className="text-[11px] text-muted mt-1">
            Isi jika tontonan ini bagian dari season/franchise bersambung agar dikelompokkan di Library.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Tipe Tontonan
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as WatchType)}
              className="w-full rounded-lg border border-border bg-surface-hover px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
            >
              <option value="ANIME">Anime</option>
              <option value="SERIES">Series</option>
              <option value="FILM">Film</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Status Tontonan
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as WatchStatus)}
              className="w-full rounded-lg border border-border bg-surface-hover px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Episode Fields */}
        {type !== 'FILM' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Total Episode (opsional)
              </label>
              <input
                type="number"
                value={totalEpisodes}
                onChange={(e) => handleTotalEpisodesChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-hover px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                placeholder="Contoh: 12, 24..."
                min={1}
              />
            </div>

            {status !== 'PLAN_TO_WATCH' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Episode Terakhir Ditonton
                </label>
                <input
                  type="number"
                  value={currentEpisode}
                  onChange={(e) => setCurrentEpisode(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-hover px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                  min={0}
                  max={totalEpisodes && parseInt(totalEpisodes) > 0 ? parseInt(totalEpisodes) : undefined}
                />
              </div>
            )}
          </div>
        )}

        {/* Poster File Upload Only */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
            Upload Poster Gambar (opsional, maks 1MB)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="w-full text-xs text-muted file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accent file:text-background hover:file:bg-accent-hover transition-colors"
          />

          {filePreview ? (
            <div className="flex items-center gap-3 pt-3">
              <img
                src={filePreview}
                alt="Preview Poster"
                className="h-24 w-16 object-cover rounded-lg border border-border shadow-sm"
              />
              <span className="text-xs text-muted">Preview file terpilih</span>
            </div>
          ) : (
            posterUrl && (
              <div className="flex items-center gap-3 pt-3">
                <img
                  src={posterUrl}
                  alt="Poster Saat Ini"
                  className="h-24 w-16 object-cover rounded-lg border border-border shadow-sm"
                />
                <span className="text-xs text-muted">Poster saat ini</span>
              </div>
            )
          )}
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Link
            href="/library"
            className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-accent px-5 py-2 text-xs font-semibold text-background hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Tontonan'}
          </button>
        </div>
      </form>
    </div>
  )
}