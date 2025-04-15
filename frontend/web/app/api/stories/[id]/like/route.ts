import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id
    
    // 获取用户的钱包地址（从session或请求中）
    const userAddress = ''; // TODO: 从session获取用户地址
    
    if (!userAddress) {
      return NextResponse.json(
        { error: '请先连接钱包' },
        { status: 401 }
      )
    }

    // 调用后端 API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/stories/${storyId}/like`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress })
      }
    )

    return NextResponse.json(await response.json())
  } catch (error: any) {
    console.error('Like error:', error)
    return NextResponse.json(
      { error: error.message || '点赞失败' },
      { status: 500 }
    )
  }
} 