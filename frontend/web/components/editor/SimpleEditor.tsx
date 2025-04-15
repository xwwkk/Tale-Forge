'use client'

import React from 'react'
import styles from './SimpleEditor.module.css'

interface SimpleEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SimpleEditor: React.FC<SimpleEditorProps> = ({
  value,
  onChange,
  placeholder = '开始创作你的故事...'
}) => {
  return (
    <div className={styles.editor}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.textarea}
      />
    </div>
  )
}

export default SimpleEditor 