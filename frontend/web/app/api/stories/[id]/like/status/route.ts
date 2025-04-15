import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id
    
    // 获取用户的钱包地址（从session或请求中）
    const userAddress = ''; // TODO: 从session获取用户地址
    
    // 调用后端 API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/stories/${storyId}/like/status`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress })
      }
    )

    return NextResponse.json(await response.json())
  } catch (error: any) {
    console.error('Get like status error:', error)
    return NextResponse.json(
      { error: error.message || '获取点赞状态失败' },
      { status: 500 }
    )
  }
} 