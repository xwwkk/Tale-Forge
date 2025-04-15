'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import styles from './ImagePreview.module.css'

interface ImagePreviewProps {
  src: string
  alt: string
  onClose: () => void
}

export default function ImagePreview({ src, alt, onClose }: ImagePreviewProps) {
  // 按ESC键关闭预览
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // 阻止冒泡，防止点击图片时关闭预览
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={handleImageClick}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        <div className={styles.imageWrapper}>
          <Image
            src={src}
            alt={alt}
            fill
            className={styles.image}
            sizes="(max-width: 768px) 100vw, 90vw"
          />
        </div>
      </div>
    </div>
  )
} 