'use client'

import React, { useState } from 'react'
import styles from './styles.module.css'
import { StoryCard } from '@/components/story/StoryCard'

interface Category {
  id: string
  name: string
}

interface Story {
  id: number
  title: string
  description: string
  coverImage: string
  author: string
  category: string
}

interface CategoryFilterProps {
  categories: Category[]
  stories: Story[]
}

export function CategoryFilter({ categories, stories }: CategoryFilterProps) {
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredStories = activeCategory === 'all'
    ? stories
    : stories.filter(story => story.category === activeCategory)

  return (
    <div className={styles.wrapper}>
      <div className={styles.categories}>
        {categories.map(category => (
          <button
            key={category.id}
            className={`${styles.categoryButton} ${
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
          <StoryCard
            key={story.id}
            {...story}
            stats={{
              likes: Math.floor(Math.random() * 1000),
              views: Math.floor(Math.random() * 10000),
              comments: Math.floor(Math.random() * 100)
            }}
          />
        ))}
      </div>
    </div>
  )
} 