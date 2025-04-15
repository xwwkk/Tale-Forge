import React, { useRef, useState, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import styles from '../TiptapEditor.module.css';

const DraggableImage = ({
  node,
  updateAttributes,
}: NodeViewProps) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (imageRef.current && !imageRef.current.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelected(true);
  };

  const startResize = (e: React.MouseEvent, direction: 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    e.stopPropagation();

    if (!imageRef.current) return;

    const image = imageRef.current;
    const startWidth = image.clientWidth;
    const startHeight = image.clientHeight;
    const startX = e.pageX;
    const startY = e.pageY;
    const aspectRatio = startWidth / startHeight;

    const handleMouseMove = (e: MouseEvent) => {
      let deltaX = e.pageX - startX;
      let deltaY = e.pageY - startY;

      // 根据不同方向调整增量
      if (direction.includes('w')) {
        deltaX = -deltaX;
      }

      // 计算新的尺寸
      let newWidth = direction.includes('w') ? startWidth - deltaX : startWidth + deltaX;
      newWidth = Math.max(100, newWidth); // 最小宽度 100px
      const newHeight = Math.round(newWidth / aspectRatio);

      updateAttributes({
        width: newWidth,
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <NodeViewWrapper className={styles.draggableImageWrapper}>
      <div 
        className={`${styles.imageContainer} ${isSelected ? styles.selected : ''}`}
        onClick={handleImageClick}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          width={node.attrs.width}
          height={node.attrs.height}
          className={styles.draggableImage}
          draggable={false}
        />
        {isSelected && (
          <div className={styles.resizeHandles}>
            <div
              className={`${styles.resizeHandle} ${styles.nw}`}
              onMouseDown={(e) => startResize(e, 'nw')}
            />
            <div
              className={`${styles.resizeHandle} ${styles.ne}`}
              onMouseDown={(e) => startResize(e, 'ne')}
            />
            <div
              className={`${styles.resizeHandle} ${styles.sw}`}
              onMouseDown={(e) => startResize(e, 'sw')}
            />
            <div
              className={`${styles.resizeHandle} ${styles.se}`}
              onMouseDown={(e) => startResize(e, 'se')}
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default DraggableImage; 