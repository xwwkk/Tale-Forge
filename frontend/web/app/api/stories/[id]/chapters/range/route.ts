import { NextRequest, NextResponse } from 'next/server';

// 后端 API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 获取指定范围的章节
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id;
    const url = new URL(request.url);
    const start = url.searchParams.get('start') || '0';
    const end = url.searchParams.get('end') || '0';
    
    // 验证参数
    if (!storyId) {
      return NextResponse.json({ error: '故事ID不能为空' }, { status: 400 });
    }
    
    if (!start || !end || parseInt(start) <= 0 || parseInt(end) <= 0 || parseInt(start) < parseInt(end)) {
      return NextResponse.json({ error: '无效的章节范围' }, { status: 400 });
    }
    
    // 调用后端API获取指定范围的章节
    const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}/chapters/range?start=${start}&end=${end}`);
    
    // 检查响应状态
    if (!response.ok) {
      let errorMessage = '获取章节范围失败';
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
    console.error('获取章节范围失败:', error);
    return NextResponse.json({ error: '获取章节范围失败' }, { status: 500 });
  }
} 