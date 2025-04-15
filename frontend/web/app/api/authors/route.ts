import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

// 获取所有作者
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    console.log('[GET /api/authors] 收到请求:', {
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    })
    const response = await fetch(`${API_BASE_URL}/api/authors?${searchParams}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'API request failed')
    }
    return NextResponse.json(await response.json())
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch authors: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
