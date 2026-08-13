'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { updateAvatarUrl } from '@/lib/actions/user'
import Toast from '@/components/ui/toast'
import ImageCropperModal from '@/components/ui/image-cropper-modal'

const BUCKET_NAME = 'tapak-media'
const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB

export default function AvatarUpload({
  initialAvatarUrl,
  username,
}: {
  initialAvatarUrl?: string | null
  username: string
}) {
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cropRawSrc, setCropRawSrc] = useState<string | null>(null)

  const initials = username
    .split(' ')
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U'

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi Tipe File Gambar
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

  async function processAvatarUpload(file: File) {
    setLoading(true)
    setError(null)

    try {
      let finalUrl = ''
      try {
        const supabase = createClient()
        const ext = file.name.split('.').pop() || 'jpg'
        const filePath = `avatars/avatar-${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, { upsert: true })

        if (uploadError) {
          throw uploadError
        }

        const { data: publicData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath)

        finalUrl = publicData.publicUrl
      } catch {
        finalUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      }

      await updateAvatarUrl(finalUrl)
      setAvatarUrl(finalUrl)
      router.refresh()
    } catch {
      setError('Gagal memperbarui foto profil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Toast message={error} type="error" onClose={() => setError(null)} />

      {cropRawSrc && (
        <ImageCropperModal
          imageSrc={cropRawSrc}
          aspectRatio={1 / 1}
          cropShape="round"
          title="Potong Foto Profil (1:1)"
          onCancel={() => setCropRawSrc(null)}
          onCropComplete={(croppedFile) => {
            setCropRawSrc(null)
            processAvatarUpload(croppedFile)
          }}
        />
      )}

      <div className="flex items-center gap-5">
        <div className="relative group">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="h-20 w-20 rounded-full object-cover border-2 border-accent/40 shadow-md group-hover:opacity-80 transition-opacity"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-background font-extrabold text-2xl border-2 border-accent/40 shadow-md group-hover:opacity-90 transition-opacity">
              {initials}
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70 text-xs font-semibold text-accent animate-pulse">
              Upload...
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-border bg-surface-hover px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-border transition-colors shadow-sm">
            <span>{loading ? 'Mengunggah...' : 'Ganti Foto Profil'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={loading}
              className="hidden"
            />
          </label>
          <p className="text-[11px] text-muted">Format JPG, PNG, atau WebP (maks 1MB).</p>
        </div>
      </div>
    </div>
  )
}
