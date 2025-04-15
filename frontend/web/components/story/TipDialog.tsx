'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import styles from './TipDialog.module.css'

interface TipDialogProps {
  authorName: string
  authorAvatar: string
  onTip: (amount: number) => Promise<void>
  onClose: () => void
}

const tipAmounts = [
  { value: 1, label: '1 TAFO' },
  { value: 5, label: '5 TAFO' },
  { value: 10, label: '10 TAFO' },
  { value: 50, label: '50 TAFO' },
  { value: 100, label: '100 TAFO' }
]

export default function TipDialog({
  authorName,
  authorAvatar,
  onTip,
  onClose
}: TipDialogProps) {
  const [selectedAmount, setSelectedAmount] = useState(tipAmounts[1].value)
  const [customAmount, setCustomAmount] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    const amount = isCustom ? Number(customAmount) : selectedAmount
    if (!amount || amount <= 0) return

    setIsSubmitting(true)
    try {
      await onTip(amount)
      onClose()
    } catch (error) {
      console.error('Failed to send tip:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>

        <div className={styles.header}>
          <Image
            src={authorAvatar}
            alt={authorName}
            width={64}
            height={64}
            className={styles.avatar}
          />
          <h3 className={styles.title}>打赏作者 {authorName}</h3>
          <p className={styles.subtitle}>您的支持是作者创作的动力</p>
        </div>

        <div className={styles.content}>
          <div className={styles.amounts}>
            {tipAmounts.map(amount => (
              <button
                key={amount.value}
                className={`${styles.amountButton} ${
                  !isCustom && selectedAmount === amount.value ? styles.active : ''
                }`}
                onClick={() => {
                  setSelectedAmount(amount.value)
                  setIsCustom(false)
                }}
              >
                {amount.label}
              </button>
            ))}
            <button
              className={`${styles.amountButton} ${isCustom ? styles.active : ''}`}
              onClick={() => setIsCustom(true)}
            >
              自定义
            </button>
          </div>

          {isCustom && (
            <div className={styles.customAmount}>
              <input
                type="number"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                placeholder="输入打赏金额"
                className={styles.input}
                min="1"
                step="1"
              />
              <span className={styles.unit}>TAFO</span>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '处理中...' : '确认打赏'}
          </button>
        </div>
      </div>
    </div>
  )
} 