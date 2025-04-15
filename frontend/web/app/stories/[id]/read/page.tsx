'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { IoChevronBack, IoSettingsOutline, IoBookmarkOutline, IoShareSocialOutline, IoStarOutline, IoHeartOutline, IoHeart } from 'react-icons/io5'
import { FaList } from 'react-icons/fa'
import styles from './page.module.css'
import ImagePreview from '@/components/common/ImagePreview'
import { useReadingSettings } from '@/hooks/useReadingSettings'
import ReadingSettings from '@/components/story/ReadingSettings'
import TipDialog from '@/components/story/TipDialog'
import { useBookshelf } from '@/hooks/useBookshelf'
import CommentList from '@/components/comment/CommentList'
import ChapterTree from '@/components/story/ChapterTree'
import { toast } from 'react-hot-toast'
import { getWalletAddress } from '@/lib/contract'
import { FiBook, FiArrowLeft } from 'react-icons/fi'
import Link from 'next/link'

interface Props {
  params: {
    id: string
  }
  searchParams: {
    order?: string
  }
}

interface Chapter {
  id: string
  title: string
  content: string
  order: number
  totalChapters: number
  author: {
    name: string
    avatar?: string
  }
  coverImage?: string
  status: 'draft' | 'published'
  wordCount: number
}

export default function ReadPage({ params, searchParams }: Props) {
  const { id } = params
  const { order = '1' } = searchParams
  const router = useRouter()
  
  console.log('【ReadPage】初始化参数:', { id, order, searchParams })
  
  // 状态管理
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEyeCareMode, setIsEyeCareMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showTipDialog, setShowTipDialog] = useState(false)
  const [showChapterTree, setShowChapterTree] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiking, setIsLiking] = useState(false)
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null)
  const [imageLoadError, setImageLoadError] = useState<Record<string, boolean>>({})
  
  // Hooks
  const { settings, updateSetting, resetSettings } = useReadingSettings()
  const { isInBookshelf, addToBookshelf, removeFromBookshelf } = useBookshelf()
  const [isInShelf, setIsInShelf] = useState(false)

  // 加载章节数据
  useEffect(() => {
    async function loadChapter() {
      console.log('【ReadPage】开始加载章节:', { id, order })
      try {
        console.log('【ReadPage】请求章节API:', `/api/stories/${id}/chapters/order/${order}`)
        const response = await fetch(`/api/stories/${id}/chapters/order/${order}`)
        console.log('【ReadPage】API响应状态:', response.status)
        
        if (!response.ok) {
          console.error('【ReadPage】API响应错误:', response.status, response.statusText)
          throw new Error('加载章节失败')
        }
        
        const data = await response.json()
        console.log('【ReadPage】获取到章节数据:', {
          chapterId: data.id,
          title: data.title,
          order: data.order,
          totalChapters: data.totalChapters
        })
        
        setChapter(data)
        
        // 新章节时滚动到顶部
        window.scrollTo({
          top: 0,
          behavior: 'instant'
        })
      } catch (error) {
        console.error('【ReadPage】加载章节失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadChapter()
  }, [id, order])

  // 初始化书架状态
  useEffect(() => {
    setIsInShelf(isInBookshelf(id))
  }, [id, isInBookshelf])

  // 初始化点赞状态
  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        const response = await fetch(`/api/stories/${id}/like/status`)
        if (response.ok) {
          const data = await response.json()
          setIsLiked(data.isLiked)
          setLikeCount(data.likeCount)
        }
      } catch (error) {
        console.error('Failed to fetch like status:', error)
      }
    }

    if (id) {
      fetchLikeStatus()
    }
  }, [id])

  // 处理章节切换
  const handleChapterChange = (direction: 'prev' | 'next') => {
    if (!chapter) {
      console.log('【ReadPage】章节切换失败: chapter 为空')
      return
    }

    const nextOrder = direction === 'prev' ? chapter.order - 1 : chapter.order + 1
    console.log('【ReadPage】章节切换:', {
      direction,
      currentOrder: chapter.order,
      nextOrder,
      totalChapters: chapter.totalChapters
    })

    if (nextOrder < 1 || nextOrder > chapter.totalChapters) {
      console.log('【ReadPage】章节切换超出范围')
      return
    }

    window.scrollTo({
      top: 0,
      behavior: 'instant'
    })
    
    const nextUrl = `/stories/${id}/read?order=${nextOrder}`
    console.log('【ReadPage】跳转到下一章:', nextUrl)
    router.push(nextUrl)
  }

  // 处理打赏
  const handleTip = async (amount: number) => {
    try {
      // TODO: Implement actual tipping logic here
      console.log('Tipping amount:', amount)
      // Call smart contract method
    } catch (error) {
      console.error('Failed to tip:', error)
    }
  }

  // 处理书架操作
  const handleBookshelf = () => {
    if (isInShelf) {
      removeFromBookshelf(id)
      setIsInShelf(false)
    } else if (chapter) {
      addToBookshelf({
        id,
        title: chapter.title,
        author: chapter.author.name,
        coverImage: chapter.coverImage || '/images/story-default-cover.jpg',
        readProgress: 0
      })
      setIsInShelf(true)
    }
  }

  // 处理点赞
  const handleLike = async () => {
    if (isLiking) return

    try {
      setIsLiking(true)

      const address = await getWalletAddress().catch(() => null)
      if (!address) {
        toast.error('请先连接钱包')
        return
      }

      const response = await fetch(`/api/stories/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      setIsLiked(prev => !prev)
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
      toast.success(isLiked ? '已取消点赞' : '点赞成功')
    } catch (error) {
      console.error('Failed to like story:', error)
      toast.error(error instanceof Error ? error.message : '点赞失败，请重试')
    } finally {
      setIsLiking(false)
    }
  }

  // 渲染工具栏
  const renderToolbar = () => (
    <div className={styles.toolbar}>
      <button
        className={styles.toolbarButton}
        onClick={() => setShowChapterTree(true)}
        title="目录"
      >
        <FaList />
      </button>
      <button
        className={styles.toolbarButton}
        onClick={() => setShowSettings(true)}
        title="设置"
      >
        <IoSettingsOutline />
      </button>
      <button
        className={styles.toolbarButton}
        onClick={handleBookshelf}
        title={isInShelf ? "已在书架" : "加入书架"}
      >
        <IoBookmarkOutline />
      </button>
      <button
        className={styles.toolbarButton}
        onClick={() => setShowTipDialog(true)}
        title="打赏"
      >
        <IoStarOutline />
      </button>
      <button
        className={styles.toolbarButton}
        onClick={() => {
          // TODO: 实现分享功能
          console.log('Share')
        }}
        title="分享"
      >
        <IoShareSocialOutline />
      </button>
    </div>
  )

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex space-x-2 mb-2">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
          </div>
          <span className="text-sm text-gray-500">正在加载章节内容...</span>
        </div>
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBook className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">暂无章节内容</h2>
          <p className="text-gray-600 mb-6">该作品还未发布任何章节，请稍后再来查看</p>
          <div className="flex gap-4 justify-center">
            <Link 
              href={`/stories/${id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <FiArrowLeft className="w-4 h-4" />
              返回作品详情
            </Link>
            <Link 
              href="/stories"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
            >
              <FiBook className="w-4 h-4" />
              浏览其他作品
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`${styles.reader} 
        ${isEyeCareMode ? styles['theme-eyeCare'] : ''} 
        ${styles[`theme-${settings.theme || 'default'}`]} 
        ${styles[`fontSize-${settings.fontSize <= 14 ? 'small' : 
                           settings.fontSize <= 16 ? 'normal' : 
                           settings.fontSize <= 18 ? 'large' : 'xlarge'}`]} 
        ${styles[`lineHeight-${settings.lineHeight <= 1.5 ? 'compact' : 
                              settings.lineHeight <= 1.8 ? 'normal' : 'loose'}`]}`
      }
      style={{
        fontFamily: settings.fontFamily,
        letterSpacing: `${settings.letterSpacing}px`
      }}
    >
      {/* 阅读界面顶部导航 */}
      <div className={styles.readerHeader}>
        <div className={styles.leftNav}>
          <button className={styles.actionButton} onClick={() => router.back()}>
            <IoChevronBack />
            返回
          </button>
          <button className={styles.actionButton} onClick={() => router.push(`/stories/${id}/chapters`)}>
            目录
          </button>
        </div>
        <div className={styles.rightNav}>
          <button className={styles.actionButton} onClick={() => setIsEyeCareMode(!isEyeCareMode)}>
            {isEyeCareMode ? '护眼' : '正常'}
          </button>
          {renderToolbar()}
        </div>
      </div>

      {/* 内容区域 */}
      <div className={styles.content}>
        <div className={styles.chapterHeader}>
          <h1 className={styles.chapterTitle}>
            {chapter.order ? `第${chapter.order}章：` : ''}{chapter.title}
            <span className={styles.wordCount}>{chapter.wordCount}字</span>
          </h1>
          <div className={styles.chapterInfo}>
            <span>{chapter.author?.name || '佚名'}</span>
            <span>·</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
        </div>
        
        <div 
          className={styles.contentWrapper}
          dangerouslySetInnerHTML={{ 
            __html: chapter.content
          }} 
        />

        {/* 文章末尾的互动区域 */}
        <div className={styles.contentFooter}>
          <div className={styles.interactionButtons}>
            <button 
              className={`${styles.interactionButton} ${isLiked ? styles.liked : ''} ${isLiking ? styles.disabled : ''}`}
              onClick={handleLike}
              disabled={isLiking}
            >
              {isLiked ? <IoHeart /> : <IoHeartOutline />}
              <span>{isLiking ? '处理中...' : `喜欢 ${likeCount > 0 ? `(${likeCount})` : ''}`}</span>
            </button>
            <button 
              className={styles.interactionButton}
              onClick={() => setShowTipDialog(true)}
            >
              <IoStarOutline />
              <span>打赏作者</span>
            </button>
          </div>
        </div>
      </div>

      {/* 底部导航 */}
      <div className={styles.footer}>
        <button
          className={styles.navButton}
          onClick={() => handleChapterChange('prev')}
          disabled={chapter.order <= 1}
        >
          上一章
        </button>
        <span className={styles.chapterStatus}>
          {chapter.order} / {chapter.totalChapters}
        </span>
        <button
          className={styles.navButton}
          onClick={() => handleChapterChange('next')}
          disabled={chapter.order >= chapter.totalChapters}
        >
          下一章
        </button>
      </div>

      {/* 评论区 */}
      <div className={styles.commentSection}>
        <CommentList storyId={id} chapterId={chapter.id} />
      </div>

      {/* 图片预览 */}
      {previewImage && (
        <ImagePreview
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* 阅读设置 */}
      {showSettings && (
        <div className={styles.settingsOverlay}>
          <ReadingSettings
            settings={settings}
            onUpdateSetting={updateSetting}
            onReset={resetSettings}
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}

      {/* 打赏对话框 */}
      {showTipDialog && (
        <TipDialog
          authorName={chapter?.author?.name || ''}
          authorAvatar="/default-avatar.png"
          onTip={handleTip}
          onClose={() => setShowTipDialog(false)}
        />
      )}

      {/* 章节树 */}
      {showChapterTree && (
        <div className={styles.chapterTreeOverlay} onClick={() => setShowChapterTree(false)}>
          <div className={styles.chapterTreeWrapper} onClick={e => e.stopPropagation()}>
            <ChapterTree
              storyId={id}
              volumes={[]} // TODO: Add volumes data
              currentChapterId={chapter.id}
              onClose={() => setShowChapterTree(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
} 