'use client'

import React from 'react'
import type { ReadingSettings } from '@/hooks/useReadingSettings'
import styles from './ReadingSettings.module.css'

interface ReadingSettingsProps {
  settings: ReadingSettings
  onUpdateSetting: <K extends keyof ReadingSettings>(
    key: K,
    value: ReadingSettings[K]
  ) => void
  onReset: () => void
  onClose: () => void
}

const fontFamilies = [
  { value: 'system-ui, -apple-system, sans-serif', label: '系统默认' },
  { value: 'serif', label: '宋体' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' }
]

const themes: { value: ReadingSettings['theme']; label: string }[] = [
  { value: 'default', label: '默认主题' },
  { value: 'eyeCare', label: '护眼模式' },
  { value: 'dark', label: '暗色主题' },
  { value: 'sepia', label: '黄昏模式' }
]

export default function ReadingSettings({
  settings,
  onUpdateSetting,
  onReset,
  onClose
}: ReadingSettingsProps) {
  return (
    <div className={styles.settingsPanel}>
      <div className={styles.header}>
        <h3>阅读设置</h3>
        <button onClick={onClose} className={styles.closeButton}>
          关闭
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h4>主题</h4>
          <div className={styles.themeGrid}>
            {themes.map(theme => (
              <button
                key={theme.value}
                className={`${styles.themeButton} ${
                  settings.theme === theme.value ? styles.active : ''
                }`}
                onClick={() => onUpdateSetting('theme', theme.value)}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h4>字体大小</h4>
          <div className={styles.control}>
            <input
              type="range"
              min="14"
              max="24"
              step="1"
              value={settings.fontSize}
              onChange={e => onUpdateSetting('fontSize', Number(e.target.value))}
            />
            <span>{settings.fontSize}px</span>
          </div>
        </div>

        <div className={styles.section}>
          <h4>行间距</h4>
          <div className={styles.control}>
            <input
              type="range"
              min="1.2"
              max="2.4"
              step="0.1"
              value={settings.lineHeight}
              onChange={e => onUpdateSetting('lineHeight', Number(e.target.value))}
            />
            <span>{settings.lineHeight}</span>
          </div>
        </div>

        <div className={styles.section}>
          <h4>字间距</h4>
          <div className={styles.control}>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              value={settings.letterSpacing}
              onChange={e => onUpdateSetting('letterSpacing', Number(e.target.value))}
            />
            <span>{settings.letterSpacing}px</span>
          </div>
        </div>

        <div className={styles.section}>
          <h4>字体</h4>
          <div className={styles.control}>
            <select
              value={settings.fontFamily}
              onChange={e => onUpdateSetting('fontFamily', e.target.value)}
            >
              {fontFamilies.map(font => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={onReset} className={styles.resetButton}>
          恢复默认设置
        </button>
      </div>
    </div>
  )
} 