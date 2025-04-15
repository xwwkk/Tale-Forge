'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './styles.module.css'

interface StoryCardProps {
  id: number
  title: string
  description: string
  coverImage: string
  author: string
  category: string
  stats?: {
    likes?: number
    views?: number
    comments?: number
  }
}

const DEFAULT_COVER = '/images/story-default-cover.jpg'

export function StoryCard({
  id,
  title,
  description,
  coverImage,
  author,
  category,
  stats
}: StoryCardProps) {
  const [imgSrc, setImgSrc] = React.useState(coverImage)

  const handleImageError = () => {
    setImgSrc(DEFAULT_COVER)
  }

  return (
    <Link href={`/stories/${id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={imgSrc}
          alt={title}
          width={300}
          height={400}
          className={styles.image}
          onError={handleImageError}
        />
        <div className={styles.category}>{category}</div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <div className={styles.footer}>
          <div className={styles.author}>
            <span className={styles.by}>by</span>
            <span className={styles.authorName}>{author}</span>
          </div>
          {stats && (
            <div className={styles.stats}>
              {stats.likes !== undefined && (
                <div className={styles.stat}>
                  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{stats.likes}</span>
                </div>
              )}
              {stats.views !== undefined && (
                <div className={styles.stat}>
                  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{stats.views}</span>
                </div>
              )}
              {stats.comments !== undefined && (
                <div className={styles.stat}>
                  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{stats.comments}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
} 