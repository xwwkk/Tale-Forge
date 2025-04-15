import { NextRequest } from 'next/server'


// 获取指定作者的故事
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  console.log('[GET /api/authors/[address]/stories] 开始处理请求:', {
    address: params.address,
    url: request.url
  })

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/authors/${params.address}/stories`
    )

    console.log('[GET /api/authors/[address]/stories] 后端响应状态:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('[GET /api/authors/[address]/stories] 后端返回错误:', error)
      return Response.json({ error: '获取作品列表失败' }, { status: response.status })
    }

    const data = await response.json()
    console.log('[GET /api/authors/[address]/stories] 后端返回数据:', data)

    return Response.json(data)
  } catch (error) {
    console.error('[GET /api/authors/[address]/stories] 请求失败:', error)
    return Response.json(
      { error: '获取作品列表失败，请稍后重试' },
      { status: 500 }
    )
  }
}
