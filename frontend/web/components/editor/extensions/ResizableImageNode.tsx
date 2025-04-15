import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import styles from '../TiptapEditor.module.css'

const ResizableImageComponent = ({ node, updateAttributes }: any) => {
  const imageRef = useRef<HTMLImageElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [width, setWidth] = useState(node.attrs.width)
  const [height, setHeight] = useState(node.attrs.height)

  useEffect(() => {
    if (imageRef.current && !node.attrs.width) {
      const { naturalWidth, naturalHeight } = imageRef.current
      const maxWidth = 800
      let newWidth = naturalWidth
      let newHeight = naturalHeight

      if (newWidth > maxWidth) {
        const ratio = maxWidth / newWidth
        newWidth = maxWidth
        newHeight = naturalHeight * ratio
      }

      updateAttributes({
        width: newWidth,
        height: newHeight,
      })
    }
  }, [node.attrs.src, node.attrs.width, updateAttributes])

  const startResizing = useCallback((mouseEvent: React.MouseEvent, direction: string) => {
    if (!imageRef.current) return

    mouseEvent.preventDefault()
    setIsResizing(true)

    const startWidth = imageRef.current.width
    const startHeight = imageRef.current.height
    const startX = mouseEvent.pageX
    const aspectRatio = startWidth / startHeight

    const onMouseMove = (event: MouseEvent) => {
      if (!isResizing) return

      const currentX = event.pageX
      const diffX = currentX - startX

      let newWidth = startWidth
      let newHeight = startHeight

      if (direction.includes('right')) {
        newWidth = Math.max(100, startWidth + diffX)
      } else if (direction.includes('left')) {
        newWidth = Math.max(100, startWidth - diffX)
      }

      newHeight = Math.round(newWidth / aspectRatio)

      setWidth(newWidth)
      setHeight(newHeight)
      updateAttributes({ width: newWidth, height: newHeight })
    }

    const onMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [isResizing, updateAttributes])

  return (
    <div className={styles.resizableImageWrapper}>
      <img
        ref={imageRef}
        src={node.attrs.src}
        alt={node.attrs.alt}
        width={width}
        height={height}
        className={styles.resizableImage}
        draggable={false}
      />
      <div className={styles.resizeHandles}>
        <div
          className={`${styles.resizeHandle} ${styles.topLeft}`}
          onMouseDown={(e) => startResizing(e, 'left')}
        />
        <div
          className={`${styles.resizeHandle} ${styles.topRight}`}
          onMouseDown={(e) => startResizing(e, 'right')}
        />
        <div
          className={`${styles.resizeHandle} ${styles.bottomLeft}`}
          onMouseDown={(e) => startResizing(e, 'left')}
        />
        <div
          className={`${styles.resizeHandle} ${styles.bottomRight}`}
          onMouseDown={(e) => startResizing(e, 'right')}
        />
      </div>
    </div>
  )
}

export const ResizableImageNode = Node.create({
  name: 'resizableImage',

  group: 'block',

  inline: false,

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent)
  },

  addCommands() {
    return {
      setImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
}) 