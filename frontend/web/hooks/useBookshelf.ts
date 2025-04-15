import { useState, useEffect } from 'react'

interface BookshelfItem {
  id: string
  title: string
  author: string
  coverImage: string
  lastRead?: string
  readProgress?: number
}

export function useBookshelf() {
  const [bookshelf, setBookshelf] = useState<BookshelfItem[]>([])

  // Load bookshelf from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('bookshelf')
      if (stored) {
        setBookshelf(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load bookshelf:', error)
    }
  }, [])

  // Save bookshelf to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('bookshelf', JSON.stringify(bookshelf))
    } catch (error) {
      console.error('Failed to save bookshelf:', error)
    }
  }, [bookshelf])

  const addToBookshelf = (item: BookshelfItem) => {
    setBookshelf(prev => {
      // Check if already exists
      if (prev.some(book => book.id === item.id)) {
        return prev
      }
      return [...prev, item]
    })
  }

  const removeFromBookshelf = (id: string) => {
    setBookshelf(prev => prev.filter(book => book.id !== id))
  }

  const isInBookshelf = (id: string) => {
    return bookshelf.some(book => book.id === id)
  }

  const updateReadProgress = (id: string, progress: number) => {
    setBookshelf(prev => 
      prev.map(book => 
        book.id === id 
          ? { 
              ...book, 
              readProgress: progress,
              lastRead: new Date().toISOString()
            }
          : book
      )
    )
  }

  return {
    bookshelf,
    addToBookshelf,
    removeFromBookshelf,
    isInBookshelf,
    updateReadProgress
  }
} 