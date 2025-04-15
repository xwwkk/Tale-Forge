import { NextRequest, NextResponse } from 'next/server';

// 后端 API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 搜索章节
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id;
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || '';
    
    // 验证参数
    if (!storyId) {
      return NextResponse.json({ error: '故事ID不能为空' }, { status: 400 });
    }
    
    if (!keyword.trim()) {
      return NextResponse.json({ error: '搜索关键词不能为空' }, { status: 400 });
    }
    
    // 调用后端API搜索章节
    const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}/chapters/search?keyword=${encodeURIComponent(keyword)}`);
    
    // 检查响应状态
    if (!response.ok) {
      let errorMessage = '搜索章节失败';
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
    console.error('搜索章节失败:', error);
    return NextResponse.json({ error: '搜索章节失败' }, { status: 500 });
  }
} 