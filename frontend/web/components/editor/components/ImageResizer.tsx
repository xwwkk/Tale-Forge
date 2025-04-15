import React, { useState, useEffect } from 'react';
import styles from '../TiptapEditor.module.css';

interface ImageResizerProps {
  width: number;
  height: number;
  onApply: (width: number, height: number) => void;
  onCancel: () => void;
}

const ImageResizer: React.FC<ImageResizerProps> = ({
  width: initialWidth,
  height: initialHeight,
  onApply,
  onCancel,
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const aspectRatio = initialWidth / initialHeight;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value) || 0;
    setWidth(newWidth);
    setHeight(Math.round(newWidth / aspectRatio));
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value) || 0;
    setHeight(newHeight);
    setWidth(Math.round(newHeight * aspectRatio));
  };

  const handleApply = () => {
    onApply(width, height);
  };

  return (
    <div className={styles.imageResizer}>
      <h3>调整图片大小</h3>
      <div className={styles.inputGroup}>
        <label>宽度</label>
        <input
          type="number"
          value={width}
          onChange={handleWidthChange}
          min="1"
        />
        <span>px</span>
      </div>
      <div className={styles.inputGroup}>
        <label>高度</label>
        <input
          type="number"
          value={height}
          onChange={handleHeightChange}
          min="1"
        />
        <span>px</span>
      </div>
      <div className={styles.buttons}>
        <button className={styles.cancel} onClick={onCancel}>
          取消
        </button>
        <button className={styles.apply} onClick={handleApply}>
          应用
        </button>
      </div>
    </div>
  );
};

export default ImageResizer; 