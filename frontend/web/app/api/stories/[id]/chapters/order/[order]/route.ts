import { NextResponse } from 'next/server';

// 后端 API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 通过order获取章节
export async function GET(
  request: Request,
  { params }: { params: { id: string; order: string } }
) {
  try {
    const { id: storyId, order } = params;
    
    console.log('【GET /api/stories/:storyId/chapters/:order】收到请求:', {
      storyId,
      order,
      url: request.url
    });

    const apiUrl = `${API_BASE_URL}/api/stories/${storyId}/chapters/order/${order}`;
    console.log('【GET /api/stories/:storyId/chapters/:order】后端API URL:', apiUrl);
    
    // 调用后端 API 获取章节详情
    const response = await fetch(apiUrl);
    console.log('【GET /api/stories/:storyId/chapters/:order】后端响应状态:', response.status);
    
    // 处理错误响应
    if (!response.ok) {
      console.error('【GET /api/stories/:storyId/chapters/:order】后端返回错误:', {
        status: response.status,
        statusText: response.statusText
      });
      
      // 尝试获取错误信息，如果解析失败则使用默认错误信息
      const errorData = await response.json().catch(() => ({ error: '获取章节失败' }));
      console.error('【GET /api/stories/:storyId/chapters/:order】错误详情:', errorData);
      
      return NextResponse.json(
        { error: errorData.error || '获取章节失败' },
        { status: response.status }
      );
    }
    
    // 解析响应数据
    try {
      const chapter = await response.json();
      console.log('【GET /api/stories/:storyId/chapters/:order】成功获取章节数据:', {
        chapterId: chapter.id,
        title: chapter.title,
        order: chapter.order
      });
      
      return NextResponse.json(chapter);
    } catch (parseError) {
      console.error('【GET /api/stories/:storyId/chapters/:order】解析章节数据失败:', parseError);
      return NextResponse.json(
        { error: '章节数据格式错误' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('【GET /api/stories/:storyId/chapters/:order】请求失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取章节失败' },
      { status: 500 }
    );
  }
} 