import React from 'react'
import styles from './CommentSkeleton.module.css'

const CommentSkeleton: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.avatar} />
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.userName} />
          <div className={styles.time} />
        </div>
        <div className={styles.text}>
          <div className={styles.line} />
          <div className={styles.line} style={{ width: '75%' }} />
        </div>
        <div className={styles.actions}>
          <div className={styles.action} />
          <div className={styles.action} />
        </div>
      </div>
    </div>
  )
}

export default CommentSkeleton 