import React, { useState, useCallback } from 'react'
import styles from './CommentInput.module.css'
import type { CommentInputProps } from '@/types/comment'

const CommentInput: React.FC<CommentInputProps> = ({
  replyTo,
  onSubmit,
  onCancel
}) => {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || submitting) return

    try {
      setSubmitting(true)
      await onSubmit(content)
      setContent('')
      onCancel?.()
    } catch (error) {
      console.error('Failed to submit comment:', error)
    } finally {
      setSubmitting(false)
    }
  }, [content, submitting, onSubmit, onCancel])

  return (
    <div className={styles.container}>
      {replyTo && (
        <div className={styles.replyHeader}>
          回复 @{replyTo.userName}：
          <button className={styles.cancelButton} onClick={onCancel}>
            取消回复
          </button>
        </div>
      )}
      <div className={styles.inputWrapper}>
        <textarea
          className={styles.input}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={replyTo ? "输入回复内容..." : "发表评论..."}
          rows={3}
        />
        <div className={styles.footer}>
          <span className={styles.counter}>
            {content.length}/500
          </span>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
          >
            {submitting ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CommentInput 