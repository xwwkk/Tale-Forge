'use client'

import React, { useState } from 'react'
import { StoryCard } from '@/components/story/StoryCard'
import styles from '@/app/page.module.css'

interface CategoryFilterProps {
  categories: Array<{
    id: string
    name: string
  }>
  stories: Array<{
    id: number
    title: string
    description: string
    coverImage: string
    author: string
    category: string
  }>
}

export function CategoryFilter({ categories, stories }: CategoryFilterProps) {
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredStories = activeCategory === 'all' 
    ? stories
    : stories.filter(story => story.category === activeCategory)

  return (
    <>
      <div className={styles.flexRow}>
        {categories.map(category => (
          <button
            key={category.id}
            className={`${styles.actionButton} ${
              activeCategory === category.id ? styles.active : ''
            }`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {filteredStories.map(story => (
          <div key={story.id} className={styles.card}>
            <StoryCard {...story} />
          </div>
        ))}
      </div>
    </>
  )
} 