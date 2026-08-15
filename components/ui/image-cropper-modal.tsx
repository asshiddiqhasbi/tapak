'use client'

import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Cropper, { Point, Area } from 'react-easy-crop'
import getCroppedImg from '@/lib/crop-image'

type Props = {
  imageSrc: string
  aspectRatio?: number
  cropShape?: 'rect' | 'round'
  title?: string
  maxWidth?: number
  onCancel: () => void
  onCropComplete: (croppedFile: File, croppedPreviewUrl: string) => void
}

export default function ImageCropperModal({
  imageSrc,
  aspectRatio = 2 / 3,
  cropShape = 'rect',
  title = 'Potong Gambar',
  maxWidth = 800,
  onCancel,
  onCropComplete,
}: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [loading, setLoading] = useState(false)

  const onCropChange = useCallback((newCrop: Point) => {
    setCrop(newCrop)
  }, [])

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom)
  }, [])

  const onCropCompleteInternal = useCallback((_: Area, newCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(newCroppedAreaPixels)
  }, [])

  async function handleSaveCrop() {
    if (!croppedAreaPixels) return
    setLoading(true)
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, 'cropped.jpg', maxWidth)
      const previewUrl = URL.createObjectURL(croppedFile)
      onCropComplete(croppedFile, previewUrl)
    } catch (err) {
      console.error('Failed to crop image:', err)
    } finally {
      setLoading(false)
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-background/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="relative my-auto w-full max-w-md rounded-2xl border border-border/80 bg-surface p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-muted hover:text-foreground"
          >
            Batal
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-black/60 border border-border/60">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape={cropShape}
            showGrid={true}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteInternal}
          />
        </div>

        {/* Zoom Slider */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs text-muted">
            <span>Perbesar / Zoom</span>
            <span className="font-semibold">{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-accent cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveCrop}
            disabled={loading}
            className="rounded-xl bg-accent px-5 py-2 text-xs font-semibold text-background hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-md"
          >
            {loading ? 'Memotong...' : 'Potong & Gunakan'}
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof window === 'undefined') return null
  return createPortal(modalContent, document.body)
}
