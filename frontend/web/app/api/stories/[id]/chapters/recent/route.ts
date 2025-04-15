import { NextRequest, NextResponse } from 'next/server';

// 后端 API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 获取最近的章节
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[GET /api/stories/:storyId/chapters/recent] 收到请求:', {
      storyId: params.id
    });
    const storyId = params.id;
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || '10';
    
    // 验证故事ID
    if (!storyId) {
      return NextResponse.json({ error: '故事ID不能为空' }, { status: 400 });
    }
    console.log('[GET /api/stories/:storyId/chapters/recent] 后端API URL:', `${process.env.NEXT_PUBLIC_API_URL}/api/stories/${storyId}/chapters/recent?limit=${limit}`);
    // 调用后端API获取最近章节
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stories/${storyId}/chapters/recent?limit=${limit}`);
    console.log('[GET /api/stories/:storyId/chapters/recent] 后端响应状态:', response.status);
    

    // 检查响应状态
    if (!response.ok) {
      let errorMessage = '获取最近章节失败';
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        console.error('解析错误响应失败:', parseError);
      }
      
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }
    
    // 解析响应数据
    const chaptersData = await response.json();
    
    return NextResponse.json(chaptersData);
  } catch (error) {
    console.error('获取最近章节失败:', error);
    return NextResponse.json({ error: '获取最近章节失败' }, { status: 500 });
  }
} 