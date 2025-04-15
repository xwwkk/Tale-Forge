import { NextResponse, NextRequest } from 'next/server'
import { CONTRACT_ABIS, CONTRACT_ADDRESSES } from '@/constants/abi'

interface Story {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  author: string;
  authorId: string;
  authorAvatar: string;
  category: string;
  stats: {
    likes: number;
    comments: number;
    views: number;
  };
  createdAt: string;
  updatedAt: string;
}

// 获取故事列表
export async function GET(request: NextRequest) {
  console.log('【API - 获取作品列表】收到请求')
  try {
    const searchParams = request.nextUrl.searchParams
    const queryParams = Object.fromEntries(searchParams.entries())
    console.log('【API - 获取作品列表】查询参数:', queryParams)

    // 构建后端API URL
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/stories`
    console.log('【API - 获取作品列表】后端API URL:', apiUrl)
    
    const response = await fetch(`${apiUrl}?${searchParams}`)
    console.log('【API - 获取作品列表】后端响应状态:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('【API - 获取作品列表】后端响应错误:', errorText)
      throw new Error(`Backend API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    console.log('【API - 获取作品列表】后端返回数据结构:', {
      hasStories: !!data.stories,
      storiesCount: data.stories?.length || 0,
      total: data.total || 0,
      pagination: {
        currentPage: data.currentPage || 1,
        totalPages: data.totalPages || 1
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('【API - 获取作品列表】错误:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch stories' }, { status: 500 })
  }
}

// // 创建新故事
// export async function POST(request: Request) {
//   try {
//     const data = await request.json()
//     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stories`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data)
//     })
//     return NextResponse.json(await response.json())
//   } catch (error) {
//     return NextResponse.json({ error: 'Failed to create story' }, { status: 500 })
//   }
// }
