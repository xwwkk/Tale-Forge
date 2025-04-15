import type { Comment } from '@/types/comment'

// 模拟数据存储
const commentsData: Comment[] = [
  {
    id: '1',
    content: '这章写得真好，情节很吸引人！',
    author: {
      id: 'user1',
      name: '读者A',
      avatar: '/default-avatar.png'
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1小时前
    likes: 5,
    isLiked: false,
    replies: [
      {
        id: 'reply1',
        content: '同感，特别是主角的心理描写很细腻',
        author: {
          id: 'user2',
          name: '读者B',
          avatar: '/default-avatar.png'
        },
        createdAt: new Date(Date.now() - 1800000).toISOString(), // 30分钟前
        likes: 2,
        isLiked: false
      }
    ],
    replyCount: 1
  },
  {
    id: '2',
    content: '剧情发展很意外，但很合理，期待下一章！',
    author: {
      id: 'user3',
      name: '读者C',
      avatar: '/default-avatar.png'
    },
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2小时前
    likes: 3,
    isLiked: false,
    replies: [],
    replyCount: 0
  }
]

// 评论存储管理
export const commentStore = {
  // 获取所有评论
  getComments() {
    return commentsData
  },

  // 添加新评论
  addComment(comment: Comment) {
    commentsData.unshift(comment)
    return comment
  },

  // 删除评论
  deleteComment(commentId: string) {
    const index = commentsData.findIndex(c => c.id === commentId)
    if (index !== -1) {
      commentsData.splice(index, 1)
      return true
    }
    return false
  },

  // 更新评论
  updateComment(commentId: string, updates: Partial<Comment>) {
    const comment = commentsData.find(c => c.id === commentId)
    if (comment) {
      Object.assign(comment, updates)
      return true
    }
    return false
  }
} 
