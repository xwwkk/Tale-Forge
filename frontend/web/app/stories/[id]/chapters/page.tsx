'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './page.module.css'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Chapter {
  id: string
  title: string
  wordCount: number
  order: number
  updatedAt: string
  status: string  // 改为string类型，因为后端可能返回不同大小写
}

interface Props {
  params: {
    id: string
  }
}

// 章节列表页面
export default function ChaptersPage({ params }: Props) {
  const { id } = params
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadChapters() {
      try {
        const response = await fetch(`/api/stories/${id}/chapters`)
        if (!response.ok) {
          throw new Error('加载章节失败')
        }
        const data = await response.json()
        // 先将状态值转换为小写，再过滤已发布的章节
        const publishedChapters = data.filter((chapter: Chapter) => 
          chapter.status?.toLowerCase() === 'published'
        )
        setChapters(publishedChapters)
      } catch (error) {
        console.error('加载章节失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadChapters()
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex space-x-2 mb-2">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
          </div>
          <span className="text-sm text-gray-500">正在加载章节列表...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>章节目录</h1>
          <Link href={`/stories/${id}`} className={styles.backButton}>
            返回作品详情
          </Link>
        </div>

        {chapters.length > 0 ? (
          <div className={styles.chapterList}>
            {chapters.map(chapter => (
              <Link 
                key={chapter.id}
                href={`/stories/${id}/read?order=${chapter.order}`}
                className={styles.chapterItem}
              >
                <div className={styles.chapterInfo}>
                  <span className={styles.chapterTitle}>{chapter.title}</span>
                  <div className={styles.chapterMeta}>
                    <span>{chapter.wordCount} 字</span>
                    <span>
                      {formatDistanceToNow(new Date(chapter.updatedAt), {
                        addSuffix: true,
                        locale: zhCN
                      })}
                    </span>
                  </div>
                </div>
                <span className={styles.arrow}>→</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[60vh] bg-white rounded-lg shadow-sm">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">暂无章节内容</h2>
            <p className="text-gray-600 text-center mb-8 max-w-sm">
              作者正在创作中，请稍后再来查看。每一个精彩的故事都值得等待。
            </p>
            <div className="flex gap-4">
              <Link 
                href={`/stories/${id}`}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 text-sm font-medium shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                返回作品详情
              </Link>
              <Link 
                href="/stories"
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                浏览其他作品
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}