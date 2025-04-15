import { NextResponse } from 'next/server'
import type { Comment } from '@/types/comment'
import { commentStore } from './store'

// GET /api/stories/[id]/chapters/[chapterId]/comments
export async function GET(
  request: Request,
  { params }: { params: { id: string; chapterId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const start = (page - 1) * limit
    const end = start + limit

    const comments = commentStore.getComments()
    return NextResponse.json({
      comments: comments.slice(start, end)
    })
  } catch (error) {
    console.error('Error in GET comments:', error)
    return NextResponse.json(
      { error: '加载评论失败' },
      { status: 500 }
    )
  }
}

// POST /api/stories/[id]/chapters/[chapterId]/comments
export async function POST(
  request: Request,
  { params }: { params: { id: string; chapterId: string } }
) {
  try {
    const body = await request.json()
    const { content } = body

    const newComment: Comment = {
      id: Date.now().toString(),
      content,
      author: {
        id: 'currentUser',
        name: '当前用户',
        avatar: '/default-avatar.png'
      },
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      replies: [],
      replyCount: 0
    }

    const comment = commentStore.addComment(newComment)
    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error in POST comment:', error)
    return NextResponse.json(
      { error: '发送评论失败' },
      { status: 500 }
    )
  }
}

// DELETE /api/stories/[id]/chapters/[chapterId]/comments/[commentId]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; chapterId: string } }
) {
  try {
    const url = new URL(request.url)
    const commentId = url.pathname.split('/').pop()
    
    if (!commentId) {
      return NextResponse.json(
        { error: '评论ID不能为空' },
        { status: 400 }
      )
    }

    const originalLength = comments.length
    comments = comments.filter(comment => comment.id !== commentId)

    if (comments.length === originalLength) {
      return NextResponse.json(
        { error: '评论不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE comment:', error)
    return NextResponse.json(
      { error: '删除评论失败' },
      { status: 500 }
    )
  }
} 