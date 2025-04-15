import { NextRequest, NextResponse } from 'next/server';

// 后端 API 基础 URL
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 获取章节统计信息
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const storyId = params.id;
  if (!storyId) {
    return new Response('Missing story ID', { status: 400 });
  }

  console.log('[GET /api/stories/:storyId/chapters/stats] 收到请求:', {
    storyId,
    url: request.url
  });

  try {
    // const response = await fetch(
    //   `${process.env.NEXT_PUBLIC_API_URL}/api/stories/${storyId}/chapters/stats`,
    //   {
    //     method: 'GET',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //   }
    // );

   const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stories/${storyId}/chapters/stats`);
  
    
    console.log('[GET /api/stories/:storyId/chapters/stats] 后端API URL:', 
      `${process.env.NEXT_PUBLIC_API_URL}/api/stories/${storyId}/chapters/stats`
    );
    
    console.log('[GET /api/stories/:storyId/chapters/stats] 后端响应状态:', response.status);

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    const statsData = await response.json();
    console.log('[GET /api/stories/:storyId/chapters/stats] 后端响应数据:', JSON.stringify(statsData));

    return Response.json(statsData);
  } catch (error) {
    console.error('[GET /api/stories/:storyId/chapters/stats] 错误:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch chapter stats' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 