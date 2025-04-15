import { NextResponse } from 'next/server'
import type { Reply } from '@/types/comment'

// POST /api/stories/[id]/chapters/[chapterId]/comments/[commentId]/replies
export async function POST(
  request: Request,
  { params }: { params: { id: string; chapterId: string; commentId: string } }
) {
  const body = await request.json()
  const { content } = body

  const newReply: Reply = {
    id: Date.now().toString(),
    content,
    author: {
      id: 'currentUser',
      name: '当前用户',
      avatar: '/default-avatar.png'
    },
    createdAt: new Date().toISOString(),
    likes: 0,
    isLiked: false
  }

  return NextResponse.json(newReply)
} 