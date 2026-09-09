'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createWatchEntry, updateWatchEntry } from '@/lib/actions/watch-entries'
import { createClient } from '@/lib/supabase'

import Toast from '@/components/ui/toast'
import ImageCropperModal from '@/components/ui/image-cropper-modal'

type WatchType = 'SERIES' | 'FILM'
type MediaType = 'LIVE_ACTION' | 'ANIME' | 'ANIMATION'
type WatchStatus = 'PLAN_TO_WATCH' | 'WATCHING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED'

type Props = {
  initialData?: {
    id: string
    title: string
    type: WatchType
    medium?: MediaType | null
    posterUrl?: string | null
    totalEpisodes?: number | null
    currentEpisode?: number | null
    totalSeasons?: number | null
    currentSeason?: number | null
    seasonsDetail?: any
    status?: WatchStatus | null
    isOngoing?: boolean | null
    rating?: number | null
    notes?: string | null
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

export default function WatchEntryForm({ initialData }: Props) {
  const router = useRouter()
  const isEdit = !!initialData

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [type, setType] = useState<WatchType>(initialData?.type ?? 'SERIES')
  const [medium, setMedium] = useState<MediaType>(initialData?.medium ?? 'ANIME')
  const [status, setStatus] = useState<WatchStatus>(initialData?.status ?? 'PLAN_TO_WATCH')
  const [isOngoing, setIsOngoing] = useState<boolean>(initialData?.isOngoing ?? false)
  const [rating, setRating] = useState<string>(initialData?.rating?.toString() ?? '')
  const [notes, setNotes] = useState<string>(initialData?.notes ?? '')
  const [totalSeasons, setTotalSeasons] = useState(
    initialData?.totalSeasons?.toString() ?? ''
  )
  const [currentSeason, setCurrentSeason] = useState(
    initialData?.currentSeason?.toString() ?? '1'
  )
  const [totalEpisodes, setTotalEpisodes] = useState(
    initialData?.totalEpisodes?.toString() ?? ''
  )
  const [currentEpisode, setCurrentEpisode] = useState(
    initialData?.currentEpisode?.toString() ?? '0'
  )

  // Dynamic Season Breakdown state
  const initialSeasonsDetail = Array.isArray(initialData?.seasonsDetail)
    ? (initialData.seasonsDetail as { seasonNumber: number; episodes: number; status?: WatchStatus }[]).map((s) => ({
        seasonNumber: s.seasonNumber,
        episodes: s.episodes,
        status: (s.status as WatchStatus) || (initialData?.status ?? 'PLAN_TO_WATCH'),
      }))
    : []
  const [showSeasonBreakdown, setShowSeasonBreakdown] = useState(initialSeasonsDetail.length > 0)
  const [seasonsList, setSeasonsList] = useState<{ seasonNumber: number; episodes: number; status: WatchStatus }[]>(
    initialSeasonsDetail.length > 0
      ? initialSeasonsDetail
      : [
          { seasonNumber: 1, episodes: 12, status: (initialData?.status ?? 'COMPLETED') as WatchStatus },
          { seasonNumber: 2, episodes: 12, status: 'PLAN_TO_WATCH' as WatchStatus },
        ]
  )

  const [posterUrl] = useState(initialData?.posterUrl ?? '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [cropRawSrc, setCropRawSrc] = useState<string | null>(null)

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleAddSeasonRow() {
    setSeasonsList((prev) => [
      ...prev,
      { seasonNumber: prev.length + 1, episodes: 12, status: 'PLAN_TO_WATCH' },
    ])
  }

  function handleRemoveSeasonRow(index: number) {
    setSeasonsList((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((item, idx) => ({ ...item, seasonNumber: idx + 1 }))
    })
  }

  function handleSeasonEpisodesChange(index: number, valStr: string) {
    const val = parseInt(valStr) || 0
    setSeasonsList((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], episodes: val }
      return updated
    })
  }

  function handleSeasonStatusChange(index: number, newStatus: WatchStatus) {
    setSeasonsList((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], status: newStatus }
      return updated
    })
  }

  function handleStatusChange(newStatus: WatchStatus) {
    setStatus(newStatus)
    setError(null)

    if (newStatus === 'PLAN_TO_WATCH') {
      setCurrentEpisode('0')
      setSeasonsList((prev) => prev.map((s) => ({ ...s, status: 'PLAN_TO_WATCH' })))
    } else if (newStatus === 'COMPLETED') {
      const parsedTotal = parseInt(totalEpisodes)
      if (!isNaN(parsedTotal) && parsedTotal > 0) {
        setCurrentEpisode(parsedTotal.toString())
      }
      setSeasonsList((prev) => prev.map((s) => ({ ...s, status: 'COMPLETED' })))
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

    let finalSeasonsDetail: any = null
    let finalTotalSeasons = totalSeasons ? parseInt(totalSeasons) : undefined
    let finalTotalEpisodes = totalEpisodes ? parseInt(totalEpisodes) : undefined

    if (type !== 'FILM' && showSeasonBreakdown && seasonsList.length > 0) {
      finalSeasonsDetail = seasonsList
      finalTotalSeasons = seasonsList.length
      finalTotalEpisodes = seasonsList.reduce((acc, s) => acc + (s.episodes || 0), 0)
    }

    const parsedCurrent = status === 'PLAN_TO_WATCH' ? 0 : (currentEpisode ? parseInt(currentEpisode) : 0)
    const parsedCurrentSeason = currentSeason ? parseInt(currentSeason) : 1
    const parsedRating = rating ? parseFloat(rating) : null

    const payload = {
      title,
      type,
      medium,
      status,
      isOngoing: type === 'FILM' ? false : isOngoing,
      posterUrl: finalPosterUrl,
      totalEpisodes: type === 'FILM' ? undefined : finalTotalEpisodes,
      currentEpisode: type === 'FILM' ? 0 : parsedCurrent,
      totalSeasons: type === 'FILM' ? undefined : finalTotalSeasons,
      currentSeason: type === 'FILM' ? undefined : parsedCurrentSeason,
      seasonsDetail: type === 'FILM' ? null : finalSeasonsDetail,
      rating: parsedRating && !isNaN(parsedRating) ? Math.min(Math.max(parsedRating, 0), 10) : null,
      notes: notes || null,
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Format Tontonan
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as WatchType)}
              className="w-full rounded-lg border border-border bg-surface-hover px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-accent"
            >
              <option value="SERIES">📺 Series</option>
              <option value="FILM">🎬 Film / Movie</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Kategori / Media
            </label>
            <select
              value={medium}
              onChange={(e) => setMedium(e.target.value as MediaType)}
              className="w-full rounded-lg border border-border bg-surface-hover px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-accent"
            >
              <option value="ANIME">🍿 Anime</option>
              <option value="LIVE_ACTION">📽 Live Action</option>
              <option value="ANIMATION">🎨 Animasi / Kartun</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Status Tontonan
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as WatchStatus)}
              className="w-full rounded-lg border border-border bg-surface-hover px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-accent"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Checkbox Toggle Ongoing / Airing */}
        {type !== 'FILM' && (
          <div className="flex items-center gap-2 pt-1 px-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground select-none">
              <input
                type="checkbox"
                checked={isOngoing}
                onChange={(e) => setIsOngoing(e.target.checked)}
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
              />
              <span>🟢 Masih Tayang / Airing (Series Ongoing)</span>
            </label>
            <span className="text-[11px] text-muted">(Rilis mingguan / belum tamat)</span>
          </div>
        )}

        {/* Dynamic Season & Episode Fields */}
        {type !== 'FILM' && (
          <div className="space-y-4">
            {/* Season Saat Ini (Hanya jika bukan Plan to Watch) */}
            {status !== 'PLAN_TO_WATCH' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Season Saat Ini
                </label>
                <input
                  type="number"
                  value={currentSeason}
                  onChange={(e) => setCurrentSeason(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-hover px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                  min={1}
                  max={showSeasonBreakdown ? seasonsList.length : (totalSeasons && parseInt(totalSeasons) > 0 ? parseInt(totalSeasons) : undefined)}
                  placeholder="Contoh: 1, 2, 3..."
                />
              </div>
            )}

            {!showSeasonBreakdown ? (
              <div className="space-y-2">
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
                      placeholder="Contoh: 12, 24, 62..."
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

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSeasonBreakdown(true)
                      if (seasonsList.length === 0) {
                        setSeasonsList([
                          { seasonNumber: 1, episodes: 12, status: (status ?? 'COMPLETED') as WatchStatus },
                          { seasonNumber: 2, episodes: 12, status: 'PLAN_TO_WATCH' as WatchStatus },
                        ])
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium"
                  >
                    <span>+ Rincian Per Season (jika lebih dari 1 season)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-accent/30 bg-accent-muted/10 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-accent block">
                      Rincian Episode Per Season
                    </span>
                    <span className="text-[11px] text-muted block">
                      Total otomatis: {seasonsList.reduce((acc, s) => acc + (s.episodes || 0), 0)} episode ({seasonsList.length} season)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSeasonBreakdown(false)}
                    className="text-xs text-muted hover:text-foreground font-medium underline"
                  >
                    Hapus Rincian Season
                  </button>
                </div>

                <div className="space-y-2.5">
                  {seasonsList.map((sItem, index) => (
                    <div key={index} className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                      <span className="text-xs font-semibold text-foreground w-16 flex-shrink-0">
                        Season {sItem.seasonNumber}
                      </span>
                      <div className="flex items-center gap-1.5 flex-1 min-w-[100px]">
                        <input
                          type="number"
                          min={1}
                          value={sItem.episodes || ''}
                          onChange={(e) => handleSeasonEpisodesChange(index, e.target.value)}
                          placeholder="Jumlah ep"
                          className="w-full rounded-lg border border-border bg-surface-hover px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                        />
                        <span className="text-xs text-muted flex-shrink-0">eps</span>
                      </div>
                      <select
                        value={sItem.status || 'PLAN_TO_WATCH'}
                        onChange={(e) => handleSeasonStatusChange(index, e.target.value as WatchStatus)}
                        className="rounded-lg border border-border bg-surface-hover px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                      >
                        <option value="COMPLETED">Completed</option>
                        <option value="WATCHING">Watching</option>
                        <option value="PLAN_TO_WATCH">Plan to Watch</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="DROPPED">Dropped</option>
                      </select>
                      {seasonsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSeasonRow(index)}
                          className="p-1 text-muted hover:text-rose-400 transition-colors"
                          title="Hapus Season Ini"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-1 flex items-center justify-between border-t border-border/40">
                  <button
                    type="button"
                    onClick={handleAddSeasonRow}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                  >
                    + Tambah Season {seasonsList.length + 1}
                  </button>
                </div>

                {status !== 'PLAN_TO_WATCH' && (
                  <div className="pt-2 border-t border-border/60">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Episode Terakhir Ditonton (Akumulasi / Per Season)
                    </label>
                    <input
                      type="number"
                      value={currentEpisode}
                      onChange={(e) => setCurrentEpisode(e.target.value)}
                      className="w-full rounded-lg border border-border bg-surface-hover px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                      min={0}
                      max={seasonsList.reduce((acc, s) => acc + (s.episodes || 0), 0) || undefined}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Rating and Notes fields when status is COMPLETED or in progress */}
        {status !== 'PLAN_TO_WATCH' && (
          type !== 'FILM' && showSeasonBreakdown && seasonsList.length > 1 ? (
            <div className="rounded-xl border border-accent/30 bg-accent-muted/10 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-accent font-semibold text-xs">
                <span>💡 Rating & Catatan Multi-Season</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Untuk tontonan Series dengan lebih dari 1 season, rating & catatan pribadi diisi secara terpisah per-season di <strong>Halaman Detail Tontonan</strong>. Rating keseluruhan tontonan akan dihitung otomatis dari rata-rata rating season.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5 flex items-center justify-between">
                  <span>Rating Personal (Format Desimal, e.g. 8.5)</span>
                  {status === 'COMPLETED' && (
                    <span className="text-[10px] text-accent font-normal border border-accent/30 bg-accent-muted px-2 py-0.5 rounded-full">
                      ✨ Direkomendasikan untuk tontonan Selesai
                    </span>
                  )}
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="10"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      placeholder="Contoh: 8.5 (1.0 - 10.0)"
                      className="w-full rounded-lg border border-border bg-surface-hover px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent placeholder:text-muted/60"
                    />
                    {rating && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-amber-400">
                        ★ {rating} / 10
                      </span>
                    )}
                  </div>
                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    <span className="text-muted text-[10px]">Preset:</span>
                    {['7.0', '7.5', '8.0', '8.5', '9.0', '9.5', '10'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRating(preset)}
                        className={`px-2 py-0.5 rounded-md border transition-colors ${
                          rating === preset
                            ? 'border-amber-500/80 bg-amber-950/60 text-amber-300 font-semibold'
                            : 'border-border/60 bg-surface-hover text-muted hover:text-foreground'
                        }`}
                      >
                        ★ {preset}
                      </button>
                    ))}
                    {rating && (
                      <button
                        type="button"
                        onClick={() => setRating('')}
                        className="px-2 py-0.5 rounded-md text-muted hover:text-rose-400 transition-colors"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Catatan Pribadi (opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tulis kesan, review singkat, atau pesan pribadi..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-surface-hover px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent placeholder:text-muted/60"
                />
              </div>
            </div>
          )
        )}

        {/* Poster File Upload Only (Width constrained to button bounds) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
            Upload Poster Gambar (opsional, maks 1MB)
          </label>
          <div className="w-fit max-w-full">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="block w-full text-xs text-muted file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accent file:text-background hover:file:bg-accent-hover file:cursor-pointer cursor-pointer transition-colors"
            />
          </div>

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