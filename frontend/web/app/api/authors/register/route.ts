// 作者注册路由 /api/authors/register
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // 调用后端注册 API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/authors/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to register author')
    }

    return NextResponse.json(await response.json())
  } catch (error) {
    console.error('Register author error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
} 