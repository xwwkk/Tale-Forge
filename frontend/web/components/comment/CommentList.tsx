import React, { useState } from 'react'
import styles from './CommentList.module.css'
import CommentItem from './CommentItem'
import CommentInput from './CommentInput'
import CommentSkeleton from './CommentSkeleton'
import { useComments } from '@/hooks/useComments'
import type { CommentListProps } from '@/types/comment'

const CommentList: React.FC<CommentListProps> = ({ storyId, chapterId }) => {
  const {
    comments,
    loading,
    error,
    hasMore,
    loadMore,
    addComment,
    addReply,
    likeComment,
    deleteComment
  } = useComments(storyId, chapterId)

  const [replyTo, setReplyTo] = useState<{
    commentId: string
    userName: string
  } | null>(null)

  const handleAddComment = async (content: string) => {
    await addComment(content)
  }

  const handleAddReply = async (content: string) => {
    if (!replyTo) return
    await addReply(replyTo.commentId, content)
    setReplyTo(null)
  }

  if (error) {
    return (
      <div className={styles.error}>
        加载评论失败，请稍后重试
        <button onClick={() => window.location.reload()} className={styles.retryButton}>
          重试
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>评论区</h3>
      
      {/* 评论输入框 */}
      <CommentInput
        storyId={storyId}
        chapterId={chapterId}
        onSubmit={handleAddComment}
      />

      {/* 评论列表 */}
      <div className={styles.list}>
        {comments.map(comment => (
          <div key={comment.id} className={styles.commentWrapper}>
            <CommentItem
              comment={comment}
              onLike={likeComment}
              onReply={(commentId) => setReplyTo({
                commentId,
                userName: comment.author.name
              })}
              onDelete={deleteComment}
            />
            {replyTo?.commentId === comment.id && (
              <div className={styles.replyInput}>
                <CommentInput
                  storyId={storyId}
                  chapterId={chapterId}
                  replyTo={replyTo}
                  onSubmit={handleAddReply}
                  onCancel={() => setReplyTo(null)}
                />
              </div>
            )}
          </div>
        ))}

        {/* 加载状态 */}
        {loading && (
          <div className={styles.loading}>
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </div>
        )}

        {/* 加载更多按钮 */}
        {hasMore && !loading && (
          <button className={styles.loadMoreButton} onClick={loadMore}>
            加载更多评论
          </button>
        )}

        {/* 没有更多评论 */}
        {!hasMore && comments.length > 0 && (
          <div className={styles.noMore}>
            没有更多评论了
          </div>
        )}

        {/* 暂无评论 */}
        {!loading && comments.length === 0 && (
          <div className={styles.empty}>
            暂无评论，快来发表第一条评论吧
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentList 