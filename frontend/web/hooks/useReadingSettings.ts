import { useState, useEffect } from 'react'

export interface ReadingSettings {
  fontSize: number
  lineHeight: number
  letterSpacing: number
  textColor: string
  fontFamily: string
  theme: 'default' | 'eyeCare' | 'dark' | 'sepia'
}

const defaultSettings: ReadingSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  letterSpacing: 0,
  textColor: '#1f2937',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  theme: 'default'
}

// 从 localStorage 获取设置
const getStoredSettings = (): ReadingSettings => {
  try {
    const stored = localStorage.getItem('reading_settings')
    return stored ? JSON.parse(stored) : defaultSettings
  } catch (error) {
    console.error('Failed to get reading settings:', error)
    return defaultSettings
  }
}

// 保存设置到 localStorage
const storeSettings = (settings: ReadingSettings) => {
  try {
    localStorage.setItem('reading_settings', JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to store reading settings:', error)
  }
}

export function useReadingSettings() {
  const [settings, setSettings] = useState<ReadingSettings>(defaultSettings)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // 初始化时加载保存的设置
  useEffect(() => {
    const storedSettings = getStoredSettings()
    setSettings(storedSettings)
  }, [])

  // 更新单个设置项
  const updateSetting = <K extends keyof ReadingSettings>(
    key: K,
    value: ReadingSettings[K]
  ) => {
    const newSettings = {
      ...settings,
      [key]: value
    }
    setSettings(newSettings)
    storeSettings(newSettings)
  }

  // 重置为默认设置
  const resetSettings = () => {
    setSettings(defaultSettings)
    storeSettings(defaultSettings)
  }

  return {
    settings,
    isSettingsOpen,
    setIsSettingsOpen,
    updateSetting,
    resetSettings
  }
} 