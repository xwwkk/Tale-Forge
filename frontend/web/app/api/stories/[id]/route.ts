import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// const API_BASE_URL = process.env.API_BASE_URL



export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[GET /api/stories/:id] 收到请求:', {
      id: params.id
    })
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stories/${params.id}`) //
    if (!response.ok) {
      throw new Error('Failed to fetch story')
    }
    return NextResponse.json(await response.json())
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
