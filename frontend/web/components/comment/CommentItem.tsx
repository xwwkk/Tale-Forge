import React, { useState } from 'react'
import Image from 'next/image'
import { IoHeartOutline, IoHeart, IoEllipsisVertical } from 'react-icons/io5'
import styles from './CommentItem.module.css'
import type { CommentItemProps } from '@/types/comment'

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onLike,
  onReply,
  onDelete
}) => {
  const [showActions, setShowActions] = useState(false)
  const { author, content, createdAt, likes, isLiked, replies, replyCount } = comment

  // 简单的时间格式化函数
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    // 小于1分钟
    if (diff < 60000) {
      return '刚刚'
    }
    // 小于1小时
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`
    }
    // 小于24小时
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`
    }
    // 小于30天
    if (diff < 2592000000) {
      return `${Math.floor(diff / 86400000)}天前`
    }
    // 大于30天，显示具体日期
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className={styles.container}>
      {/* 用户头像 */}
      <div className={styles.avatar}>
        <Image
          src={author.avatar}
          alt="头像"
          width={40}
          height={40}
          className={styles.avatarImage}
        />
      </div>

      <div className={styles.content}>
        {/* 评论头部 */}
        <div className={styles.header}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{author.name}</span>
            <span className={styles.time}>{formatTime(createdAt)}</span>
          </div>
          <div className={styles.actions}>
            <button
              className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
              onClick={() => onLike(comment.id)}
            >
              {isLiked ? <IoHeart /> : <IoHeartOutline />}
              {likes > 0 && <span className={styles.likeCount}>{likes}</span>}
            </button>
            <button
              className={styles.actionButton}
              onClick={() => onReply(comment.id)}
            >
              回复
            </button>
            <div className={styles.moreActions}>
              <button
                className={styles.actionButton}
                onClick={() => setShowActions(!showActions)}
              >
                <IoEllipsisVertical />
              </button>
              {showActions && (
                <div className={styles.actionMenu}>
                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      onDelete(comment.id)
                      setShowActions(false)
                    }}
                  >
                    删除
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 评论内容 */}
        <div className={styles.text}>{content}</div>

        {/* 回复列表 */}
        {replies && replies.length > 0 && (
          <div className={styles.replies}>
            {replies.map((reply) => (
              <div key={reply.id} className={styles.reply}>
                <div className={styles.replyAvatar}>
                  <Image
                    src={reply.author.avatar}
                    alt="头像"
                    width={24}
                    height={24}
                    className={styles.avatarImage}
                  />
                </div>
                <div className={styles.replyContent}>
                  <div className={styles.replyHeader}>
                    <span className={styles.replyUserName}>{reply.author.name}</span>
                    <span className={styles.replyTime}>
                      {formatTime(reply.createdAt)}
                    </span>
                  </div>
                  <div className={styles.replyText}>{reply.content}</div>
                </div>
              </div>
            ))}
            {replyCount > replies.length && (
              <button
                className={styles.viewMoreReplies}
                onClick={() => onReply(comment.id)}
              >
                查看全部 {replyCount} 条回复
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentItem 