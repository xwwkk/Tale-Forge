import { useState, useCallback, useEffect } from 'react'
import type { Comment } from '@/types/comment'

const COMMENTS_PER_PAGE = 20

export function useComments(storyId: string, chapterId: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  // 加载评论列表
  const loadComments = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(
        `/api/stories/${storyId}/chapters/${chapterId}/comments?page=${pageNum}&limit=${COMMENTS_PER_PAGE}`
      )
      
      if (!response.ok) {
        throw new Error(response.statusText || '加载评论失败')
      }

      const data = await response.json()
      
      setComments(prev => pageNum === 1 ? data.comments : [...prev, ...data.comments])
      setHasMore(data.comments.length === COMMENTS_PER_PAGE)
      setPage(pageNum)
    } catch (err) {
      console.error('Failed to load comments:', err)
      setError(err instanceof Error ? err : new Error('加载评论失败'))
    } finally {
      setLoading(false)
    }
  }, [storyId, chapterId])

  // 加载更多评论
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadComments(page + 1)
    }
  }, [loading, hasMore, page, loadComments])

  // 添加评论
  const addComment = useCallback(async (content: string) => {
    try {
      const response = await fetch(
        `/api/stories/${storyId}/chapters/${chapterId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        }
      )

      if (!response.ok) {
        throw new Error(response.statusText || '发送评论失败')
      }

      const newComment = await response.json()
      setComments(prev => [newComment, ...prev])
      return newComment
    } catch (err) {
      console.error('Failed to add comment:', err)
      throw err instanceof Error ? err : new Error('发送评论失败')
    }
  }, [storyId, chapterId])

  // 添加回复
  const addReply = useCallback(async (commentId: string, content: string) => {
    try {
      const response = await fetch(
        `/api/stories/${storyId}/chapters/${chapterId}/comments/${commentId}/replies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        }
      )

      if (!response.ok) {
        throw new Error(response.statusText || '发送回复失败')
      }

      const newReply = await response.json()
      
      setComments(prev => prev.map(comment => 
        comment.id === commentId
          ? {
              ...comment,
              replies: [...comment.replies, newReply],
              replyCount: comment.replyCount + 1
            }
          : comment
      ))
      return newReply
    } catch (err) {
      console.error('Failed to add reply:', err)
      throw err instanceof Error ? err : new Error('发送回复失败')
    }
  }, [storyId, chapterId])

  // 点赞评论
  const likeComment = useCallback(async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/stories/${storyId}/chapters/${chapterId}/comments/${commentId}/like`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        throw new Error(response.statusText || '点赞失败')
      }

      setComments(prev => prev.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
              isLiked: !comment.isLiked
            }
          : comment
      ))
    } catch (err) {
      console.error('Failed to like comment:', err)
      throw err instanceof Error ? err : new Error('点赞失败')
    }
  }, [storyId, chapterId])

  // 删除评论
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/stories/${storyId}/chapters/${chapterId}/comments/${commentId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error(response.statusText || '删除评论失败')
      }

      setComments(prev => prev.filter(comment => comment.id !== commentId))
    } catch (err) {
      console.error('Failed to delete comment:', err)
      throw err instanceof Error ? err : new Error('删除评论失败')
    }
  }, [storyId, chapterId])

  // 初始加载
  useEffect(() => {
    loadComments()
  }, [loadComments])

  return {
    comments,
    loading,
    error,
    hasMore,
    loadMore,
    addComment,
    addReply,
    likeComment,
    deleteComment
  }
} 