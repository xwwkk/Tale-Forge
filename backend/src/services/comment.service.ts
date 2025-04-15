import prisma from '../prisma'
import type { Comment, User, CommentLike, Prisma } from '@prisma/client'

export interface CreateCommentInput {
  content: string
  userId: string
  storyId?: string
  chapterId?: string
  parentId?: string
}

export class CommentService {
  /**
   * 创建评论或回复
   */
  async createComment(input: CreateCommentInput): Promise<Comment> {
    const { content, userId, storyId, chapterId, parentId } = input

    if (!storyId && !chapterId) {
      throw new Error('Either storyId or chapterId must be provided')
    }

    return prisma.comment.create({
      data: {
        content,
        userId,
        storyId,
        chapterId,
        parentId,
      },
      include: {
        user: true,
        likes: true,
        replies: {
          include: {
            user: true,
            likes: true,
          }
        }
      }
    })
  }

  /**
   * 获取评论回复
   */
  async getCommentReplies(commentId: string, params: {
    skip?: number
    take?: number
  }): Promise<{ total: number; replies: (Comment & { user: User; likes: CommentLike[] })[] }> {
    const { skip = 0, take = 10 } = params

    const [total, replies] = await Promise.all([
      prisma.comment.count({
        where: { parentId: commentId }
      }),
      prisma.comment.findMany({
        where: { parentId: commentId },
        skip,
        take,
        include: {
          user: true,
          likes: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ])

    return {
      total,
      replies
    }
  }

  /**
   * 点赞评论
   */
  async likeComment(userId: string, commentId: string): Promise<void> {
    // 检查是否已点赞
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId
        }
      }
    })

    if (existingLike) {
      throw new Error('Already liked this comment')
    }

    // 创建点赞记录
    await prisma.commentLike.create({
      data: {
        userId,
        commentId
      }
    })
  }

  /**
   * 取消点赞
   */
  async unlikeComment(userId: string, commentId: string): Promise<void> {
    await prisma.commentLike.delete({
      where: {
        userId_commentId: {
          userId,
          commentId
        }
      }
    })
  }

  /**
   * 获取评论（包含点赞信息）
   */
  async getComment(commentId: string, currentUserId?: string): Promise<Comment & {
    user: User;
    likes: CommentLike[];
    isLiked: boolean;
    likeCount: number;
  }> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: true,
        likes: true
      }
    })

    if (!comment) {
      throw new Error('Comment not found')
    }

    return {
      ...comment,
      isLiked: currentUserId ? comment.likes.some(like => like.userId === currentUserId) : false,
      likeCount: comment.likes.length
    }
  }

  /**
   * 获取故事评论（包含回复和点赞信息）
   */
  async getStoryComments(storyId: string, params: {
    skip?: number
    take?: number
    currentUserId?: string
  }) {
    const { skip = 0, take = 10, currentUserId } = params

    const [total, comments] = await Promise.all([
      prisma.comment.count({
        where: { 
          storyId,
          parentId: null  // 只获取主评论
        }
      }),
      prisma.comment.findMany({
        where: { 
          storyId,
          parentId: null
        },
        skip,
        take,
        include: {
          user: true,
          likes: true,
          replies: {
            include: {
              user: true,
              likes: true
            },
            take: 3,  // 默认只显示前3条回复
            orderBy: {
              createdAt: 'desc'
            }
          },
          _count: {
            select: {
              replies: true  // 获取回复总数
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ])

    // 处理点赞和回复信息
    const formattedComments = comments.map(comment => ({
      ...comment,
      isLiked: currentUserId ? comment.likes.some(like => like.userId === currentUserId) : false,
      likeCount: comment.likes.length,
      replyCount: comment._count.replies,
      replies: comment.replies.map(reply => ({
        ...reply,
        isLiked: currentUserId ? reply.likes.some(like => like.userId === currentUserId) : false,
        likeCount: reply.likes.length
      }))
    }))

    return {
      total,
      comments: formattedComments
    }
  }

  /**
   * 获取章节评论
   */
  async getChapterComments(chapterId: string, params: {
    skip?: number
    take?: number
  }): Promise<{ total: number; comments: (Comment & { user: User })[] }> {
    const { skip = 0, take = 10 } = params

    const [total, comments] = await Promise.all([
      prisma.comment.count({
        where: { chapterId },
      }),
      prisma.comment.findMany({
        where: { chapterId },
        skip,
        take,
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    return {
      total,
      comments,
    }
  }

  /**
   * 更新评论
   */
  async updateComment(id: string, content: string): Promise<Comment> {
    return prisma.comment.update({
      where: { id },
      data: { content },
    })
  }

  /**
   * 删除评论
   */
  async deleteComment(id: string): Promise<void> {
    await prisma.comment.delete({
      where: { id },
    })
  }

  // 获取评论列表
  async getComments(storyId: string, params: {
    skip?: number
    take?: number
    parentId?: string | null
  }) {
    const { skip = 0, take = 10, parentId } = params

    const where: Prisma.CommentWhereInput = {
      storyId,
      parentId: parentId || null
    }

    const [total, comments] = await Promise.all([
      prisma.comment.count({ where }),
      prisma.comment.findMany({
        where,
        skip,
        take,
        include: {
          user: true,
          _count: {
            select: {
              likes: true,
              replies: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    return { comments, total }
  }
} 