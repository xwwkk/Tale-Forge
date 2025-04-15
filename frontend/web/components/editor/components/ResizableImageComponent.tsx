import React from 'react'
import { NodeViewProps } from '@tiptap/react'
import styles from '../TiptapEditor.module.css'

export default function ResizableImageComponent({
  node,
  updateAttributes,
}: NodeViewProps) {
  const { src, alt, title, width, height } = node.attrs

  const handleResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()

    const image = e.currentTarget.parentElement?.querySelector('img')
    if (!image) return

    const startWidth = image.clientWidth
    const startHeight = image.clientHeight
    const startX = e.pageX
    const aspectRatio = startWidth / startHeight

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.pageX - startX
      const newWidth = Math.max(50, startWidth + deltaX)
      const newHeight = Math.round(newWidth / aspectRatio)

      updateAttributes({
        width: newWidth,
        height: newHeight,
      })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className={styles.resizableImageWrapper}>
      <img
        src={src}
        alt={alt}
        title={title}
        width={width}
        height={height}
        className={styles.resizableImage}
      />
      <div className={styles.resizeHandles}>
        {['nw', 'ne', 'sw', 'se'].map((pos) => (
          <div
            key={pos}
            className={`${styles.resizeHandle} ${styles[`resize-handle-${pos}`]}`}
            onMouseDown={(e) => handleResize(e, pos)}
          />
        ))}
      </div>
    </div>
  )
} 