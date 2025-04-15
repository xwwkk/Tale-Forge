import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper as BaseNodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import styles from '../TiptapEditor.module.css';

const NodeViewWrapper = BaseNodeViewWrapper as React.FC<{ as?: string; children: React.ReactNode }>;

interface ImageComponentProps {
  node: ProseMirrorNode;
  updateAttributes: (attrs: Record<string, any>) => void;
  selected: boolean;
}

const ImageComponent = ({ node, updateAttributes, selected }: ImageComponentProps & NodeViewProps) => {
  const [isSelected, setIsSelected] = useState(selected);
  const [size, setSize] = useState({
    width: node.attrs.width,
    height: node.attrs.height
  });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSelected(selected);
  }, [selected]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const startResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.pageX;
    const startWidth = size.width || imageRef.current?.clientWidth || 0;
    const aspectRatio = (size.width || 1) / (size.height || 1);

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.pageX - startX;
      let newWidth = startWidth;

      if (direction === 'right') {
        newWidth = Math.max(100, startWidth + deltaX);
      } else if (direction === 'left') {
        newWidth = Math.max(100, startWidth - deltaX);
      }

      const newHeight = Math.round(newWidth / aspectRatio);

      setSize({ width: newWidth, height: newHeight });
      updateAttributes({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <NodeViewWrapper as="span">
      <div 
        ref={containerRef}
        className={`${styles.imageContainer} ${isSelected ? styles.selected : ''}`}
        onClick={handleImageClick}
        contentEditable={false}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          width={size.width}
          height={size.height}
          className={styles.editorImage}
        />
        {isSelected && (
          <>
            <div className={styles.resizeHandles}>
              <div
                className={`${styles.resizeHandle} ${styles.leftHandle}`}
                onMouseDown={(e) => startResize(e, 'left')}
              />
              <div
                className={`${styles.resizeHandle} ${styles.rightHandle}`}
                onMouseDown={(e) => startResize(e, 'right')}
              />
            </div>
            <div className={styles.imageToolbar}>
              <input
                type="number"
                value={Math.round(size.width || 0)}
                onChange={(e) => {
                  const newWidth = parseInt(e.target.value);
                  const aspectRatio = (size.width || 1) / (size.height || 1);
                  const newHeight = Math.round(newWidth / aspectRatio);
                  setSize({ width: newWidth, height: newHeight });
                  updateAttributes({ width: newWidth, height: newHeight });
                }}
              />
              <span>×</span>
              <input
                type="number"
                value={Math.round(size.height || 0)}
                onChange={(e) => {
                  const newHeight = parseInt(e.target.value);
                  const aspectRatio = (size.width || 1) / (size.height || 1);
                  const newWidth = Math.round(newHeight * aspectRatio);
                  setSize({ width: newWidth, height: newHeight });
                  updateAttributes({ width: newWidth, height: newHeight });
                }}
              />
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default ImageComponent; 