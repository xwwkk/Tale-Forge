import { NextRequest, NextResponse } from 'next/server';
import { Chapter } from '@/types/story';

// 后端 API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 创建新章节，保存到数据库
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id;
    
    // 验证故事ID
    if (!storyId) {
      return NextResponse.json({ error: '故事ID不能为空' }, { status: 400 });
    }
    
    // 解析请求体
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: '无效的请求体' }, { status: 400 });
    }
    
    // 调用后端API创建章节
    const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}/chapters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    // 检查响应状态
    if (!response.ok) {
      let errorMessage = '创建章节失败';
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
    const chapterData = await response.json();
    
    return NextResponse.json(chapterData);
  } catch (error) {
    console.error('创建章节失败:', error);
    return NextResponse.json({ error: '创建章节失败' }, { status: 500 });
  }
}

// 获取章节列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id;
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '50';
    
    // 验证故事ID
    if (!storyId) {
      return NextResponse.json({ error: '故事ID不能为空' }, { status: 400 });
    }
    
    // 调用后端API获取章节列表
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stories/${storyId}/chapters?page=${page}&limit=${limit}`);
    
    // 检查响应状态
    if (!response.ok) {
      let errorMessage = '获取章节列表失败';
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
    console.error('获取章节列表失败:', error);
    return NextResponse.json({ error: '获取章节列表失败' }, { status: 500 });
  }
}
