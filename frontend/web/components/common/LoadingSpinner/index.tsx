import React from 'react'
import styles from './styles.module.css'

export function LoadingSpinner() {
  return (
    <div className={styles.spinner}>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
    </div>
  )
} 