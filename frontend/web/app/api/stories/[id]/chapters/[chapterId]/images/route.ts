import { NextRequest, NextResponse } from 'next/server';

// 上传图片
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
) {
  const { id: storyId, chapterId } = params;
  console.log('[插画上传-前端路由] 收到请求:', { storyId, chapterId });

  try {
    // 获取上传的文件
    const formData = await request.formData();
    const files = formData.getAll('image');
    const position = formData.get('position');
    console.log('[插画上传-前端路由] 获取到的文件数量:', files.length);
    console.log('[插画上传-前端路由] 图片位置:', position);
    
    if (!files.length) {
      console.log('[插画上传-前端路由] 错误: 没有上传文件');
      return NextResponse.json(
        { error: '没有上传文件' },
        { status: 400 }
      );
    }

    // 创建新的 FormData 对象发送到后端
    const backendFormData = new FormData();
    const file = files[0];
    backendFormData.append('image', file);
    
    // 如果有位置信息，添加到请求中
    if (position) {
      backendFormData.append('position', position.toString());
    }
    
    console.log('[插画上传-前端路由] 准备发送到后端的文件信息:', {
      fileName: file instanceof File ? file.name : 'unknown',
      fileType: file instanceof File ? file.type : 'unknown',
      fileSize: file instanceof File ? file.size : 'unknown',
      position: position
    });

    // 发送到后端 API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiUrl = `${backendUrl}/api/stories/${storyId}/chapters/${chapterId}/images`;
    console.log('[插画上传-前端路由] 发送请求到后端:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: backendFormData,
    });

    console.log('[插画上传-前端路由] 后端响应状态:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.log('[插画上传-前端路由] 后端返回错误:', error);
      throw new Error(error.error || '上传失败');
    }

    const data = await response.json();
    console.log('[插画上传-前端路由] 上传成功，后端返回数据:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[插画上传-前端路由] 处理失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '上传失败' },
      { status: 500 }
    );
  }
}

// 获取图片列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
) {
  const { id: storyId, chapterId } = params;
  console.log('[插画列表-前端路由] 收到请求:', { storyId, chapterId });

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiUrl = `${backendUrl}/api/stories/${storyId}/chapters/${chapterId}/images`;
    console.log('[插画列表-前端路由] 发送请求到后端:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
    });

    console.log('[插画列表-前端路由] 后端响应状态:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.log('[插画列表-前端路由] 后端返回错误:', error);
      throw new Error(error.error || '获取图片列表失败');
    }

    const data = await response.json();
    console.log('[插画列表-前端路由] 获取成功，图片数量:', data.length);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[插画列表-前端路由] 获取失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取图片列表失败' },
      { status: 500 }
    );
  }
}

// 删除图片
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
) {
  const { id: storyId, chapterId } = params;
  console.log('[插画删除-前端路由] 收到请求:', { storyId, chapterId });

  try {
    const { searchParams } = new URL(request.url);
    const illustrationId = searchParams.get('id');

    if (!illustrationId) {
      console.log('[插画删除-前端路由] 错误: 缺少图片ID');
      return NextResponse.json(
        { error: '缺少图片ID' },
        { status: 400 }
      );
    }

    console.log('[插画删除-前端路由] 图片ID:', illustrationId);

    // 从后端 API 删除图片
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiUrl = `${backendUrl}/api/stories/${storyId}/chapters/${chapterId}/images/${illustrationId}`;
    console.log('[插画删除-前端路由] 发送请求到后端:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'DELETE',
    });

    console.log('[插画删除-前端路由] 后端响应状态:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.log('[插画删除-前端路由] 后端返回错误:', error);
      throw new Error(error.error || '删除图片失败');
    }

    console.log('[插画删除-前端路由] 删除成功');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[插画删除-前端路由] 删除失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除图片失败' },
      { status: 500 }
    );
  }
} 