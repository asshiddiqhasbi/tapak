export type Area = {
  x: number
  y: number
  width: number
  height: number
}

export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  fileName: string = 'cropped.jpg',
  maxWidth: number = 800
): Promise<File> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 2D context not available')
  }

  // Calculate target dimensions capped at maxWidth
  let targetWidth = pixelCrop.width
  let targetHeight = pixelCrop.height

  if (targetWidth > maxWidth) {
    const scale = maxWidth / targetWidth
    targetWidth = maxWidth
    targetHeight = Math.round(pixelCrop.height * scale)
  }

  canvas.width = targetWidth
  canvas.height = targetHeight

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas toBlob failed'))
        return
      }
      const file = new File([blob], fileName, { type: 'image/jpeg' })
      resolve(file)
    }, 'image/jpeg', 0.85)
  })
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}
