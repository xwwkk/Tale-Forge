import { NextResponse } from 'next/server'

// POST /api/stories/[id]/chapters/[chapterId]/comments/[commentId]/like
export async function POST(
  request: Request,
  { params }: { params: { id: string; chapterId: string; commentId: string } }
) {
  return NextResponse.json({ success: true })
} 