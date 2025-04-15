import { useState, useRef, useEffect } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'

interface ImageCropperProps {
  image: string
  onCropComplete: (croppedImage: string) => void
  aspectRatio?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  onCancel?: () => void
  previewShape?: 'circle' | 'rectangle'
  previewClassName?: string
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageCropper({
  image,
  onCropComplete,
  aspectRatio = 1,
  minWidth = 200,
  minHeight = 200,
  maxWidth = 800,
  maxHeight = 800,
  onCancel,
  previewShape = 'rectangle',
  previewClassName = ''
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [previewUrl, setPreviewUrl] = useState<string>()
  const imgRef = useRef<HTMLImageElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    const crop = centerAspectCrop(width, height, aspectRatio)
    setCrop(crop)
  }

  useEffect(() => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      // 创建预览
      const canvas = previewCanvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('No 2d context')
      }

      const scaleX = imgRef.current.naturalWidth / imgRef.current.width
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height

      canvas.width = minWidth
      canvas.height = minHeight

      ctx.imageSmoothingQuality = 'high'

      const cropX = completedCrop.x * scaleX
      const cropY = completedCrop.y * scaleY
      const cropWidth = completedCrop.width * scaleX
      const cropHeight = completedCrop.height * scaleY

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(
        imgRef.current,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height
      )

      // 更新预览URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      setPreviewUrl(dataUrl)
    }
  }, [completedCrop, minWidth, minHeight])

  function getCroppedImg(
    image: HTMLImageElement,
    crop: PixelCrop,
  ): Promise<string> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = minWidth
    canvas.height = minHeight

    ctx.imageSmoothingQuality = 'high'

    const cropX = crop.x * scaleX
    const cropY = crop.y * scaleY
    const cropWidth = crop.width * scaleX
    const cropHeight = crop.height * scaleY

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas is empty')
        }
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = () => {
          const base64data = reader.result as string
          resolve(base64data)
        }
      }, 'image/jpeg', 0.9)
    })
  }

  async function handleCropComplete() {
    if (!imgRef.current || !completedCrop) return

    try {
      const croppedImage = await getCroppedImg(
        imgRef.current,
        completedCrop,
      )
      onCropComplete(croppedImage)
    } catch (e) {
      console.error('Error cropping image:', e)
    }
  }

  return (
    <div className="image-cropper-container">
      <div className="flex items-start gap-8">
        <div className="flex-1">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            minWidth={minWidth}
            minHeight={minHeight}
            maxWidth={maxWidth}
            maxHeight={maxHeight}
            className="bg-gray-50 rounded-lg"
            circularCrop={previewShape === 'circle'}
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={image}
              onLoad={onImageLoad}
              style={{ maxWidth: '100%' }}
              className="max-h-[500px] object-contain"
            />
          </ReactCrop>
        </div>
        {previewUrl && (
          <div className="flex-shrink-0">
            <p className="text-sm text-gray-500 mb-2">预览效果</p>
            <div className={`w-[240px] aspect-[${aspectRatio}] bg-gray-100 overflow-hidden ${
              previewShape === 'circle' ? 'rounded-full' : 'rounded-lg'
            } ${previewClassName}`}>
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
      <canvas
        ref={previewCanvasRef}
        style={{
          display: 'none',
        }}
      />
      <div className="image-cropper-controls mt-4 flex justify-end gap-4">
        <button
          onClick={handleCropComplete}
          className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
        >
          确认裁剪
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
        )}
      </div>
    </div>
  )
}
