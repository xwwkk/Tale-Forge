import { NextResponse } from 'next/server'
import { commentStore } from '../store'

// DELETE /api/stories/[id]/chapters/[chapterId]/comments/[commentId]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; chapterId: string; commentId: string } }
) {
  try {
    const { commentId } = params
    
    if (!commentId) {
      return NextResponse.json(
        { error: '评论ID不能为空' },
        { status: 400 }
      )
    }

    const success = commentStore.deleteComment(commentId)

    if (!success) {
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