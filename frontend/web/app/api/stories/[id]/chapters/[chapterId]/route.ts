import { NextResponse } from 'next/server';
import { Chapter } from '@/types/story';

// 后端 API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 发布章节
export async function POST(
  request: Request,
  { params }: { params: { id: string; chapterId: string } }
) {
  try {
    const { id: storyId, chapterId } = params;
    console.log('【POST 章节】API路由被调用，参数:', { storyId, chapterId });
    
    // 解析请求体
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('【POST 章节】请求体解析成功:', requestBody);
    } catch (parseError) {
      console.error('【POST 章节】解析请求体失败:', parseError);
      return NextResponse.json(
        { error: '无效的请求数据' },
        { status: 400 }
      );
    }
    
    const { authorAddress, txHash } = requestBody;
    console.log('【POST 章节】提取的字段:', { authorAddress, txHash });
    
    if (!authorAddress) {
      console.error('【POST 章节】缺少作者地址');
      return NextResponse.json(
        { error: '缺少作者地址' },
        { status: 400 }
      );
    }

    if (!txHash) {
      console.error('【POST 章节】缺少交易哈希');
      return NextResponse.json(
        { error: '缺少交易哈希' },
        { status: 400 }
      );
    }
    
    // 调用后端 API 发布章节
    console.log('【POST 章节】准备调用后端API:', `${API_BASE_URL}/api/stories/${storyId}/chapters/${chapterId}/publish`);
    const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}/chapters/${chapterId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ authorAddress, txHash })
    });
    console.log('【POST 章节】后端API响应状态:', response.status);
    
    // 尝试解析响应，处理可能的解析错误
    let responseData;
    try {
      responseData = await response.json();
      console.log('【POST 章节】后端API响应数据:', responseData);
    } catch (parseError) {
      console.error('【POST 章节】解析响应数据失败:', parseError);
      return NextResponse.json(
        { error: '服务器响应格式错误' },
        { status: 500 }
      );
    }
    
    if (!response.ok) {
      console.error('【POST 章节】后端API返回错误:', { status: response.status, error: responseData.error });
      return NextResponse.json(
        { error: responseData.error || '发布章节失败' },
        { status: response.status }
      );
    }
    
    console.log('【POST 章节】发布成功，返回数据');
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('【POST 章节】发布章节失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '发布章节失败' },
      { status: 500 }
    );
  }
}

// 获取章节
export async function GET(
  request: Request,
  { params }: { params: { id: string; chapterId: string } }
) {
  try {
    const { id: storyId, chapterId } = params;
    // 调用后端 API 获取章节详情
    const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}/chapters/${chapterId}`);
    // 处理错误响应
    if (!response.ok) {
      console.log('【GET】章节数据错误:', response);
      // 尝试获取错误信息，如果解析失败则使用默认错误信息
      const errorData = await response.json().catch(() => ({ error: '获取章节失败' }));
      return NextResponse.json(
        { error: errorData.error || '获取章节失败' },
        { status: response.status }
      );
    }
    
    // 解析响应数据
    try {

      console.log('【GET】章节数据，解析响应数据:', response);
      const chapter = await response.json();
      return NextResponse.json(chapter);
      
    } catch (parseError) {
      console.error('解析章节数据失败:', parseError);
      return NextResponse.json(
        { error: '章节数据格式错误' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('获取章节失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取章节失败' },
      { status: 500 }
    );
  }
}

//保存章节（更新章节）
export async function PUT(
  request: Request,
  { params }: { params: { id: string; chapterId: string } }
) {
  try {
    const { id: storyId, chapterId } = params;
    
    // 解析请求体
    let updates;
    try {
      updates = await request.json();
    } catch (parseError) {
      console.error('解析请求体失败:', parseError);
      return NextResponse.json(
        { error: '无效的请求数据' },
        { status: 400 }
      );
    }
    console.log('【PUT】更新章节请求体:', updates);
    
    // 调用后端 API 更新章节
    const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}/chapters/${chapterId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    
    // 尝试解析响应，处理可能的解析错误
    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('解析响应数据失败:', parseError);
      return NextResponse.json(
        { error: '服务器响应格式错误' },
        { status: 500 }
      );
    }
    
    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.error || '更新章节失败' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('更新章节失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新章节失败' },
      { status: 500 }
    );
  }
}

// 删除章节
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; chapterId: string } }
) {
  try {
    const { id: storyId, chapterId } = params;
    
    // 调用后端 API 删除章节
    const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}/chapters/${chapterId}`, {
      method: 'DELETE'
    });
    
    // 尝试解析响应，处理可能的解析错误
    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('解析响应数据失败:', parseError);
      
      // 如果响应成功但没有返回JSON，可能是正常的
      if (response.ok) {
        return NextResponse.json({ success: true });
      }
      
      return NextResponse.json(
        { error: '服务器响应格式错误' },
        { status: 500 }
      );
    }
    
    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.error || '删除章节失败' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('删除章节失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除章节失败' },
      { status: 500 }
    );
  }
}
