import { NextResponse } from 'next/server';

// 后端 API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 章节审核（POST 方法）
export async function POST(
    request: Request,
    { params }: { params: { id: string; chapterId: string } }
) {
    try {
        const { id: storyId, chapterId } = params;
        console.log('【POST 章节审核】API路由被调用，参数:', { storyId, chapterId });

        // 解析请求体
        let requestBody;
        try {
            requestBody = await request.json();
            console.log('【POST 章节审核】请求体解析成功:', requestBody);
        } catch (parseError) {
            console.error('【POST 章节审核】解析请求体失败:', parseError);
            return NextResponse.json(
                { error: '无效的请求数据' },
                { status: 400 }
            );
        }

        const { content, base64Images } = requestBody;
        console.log('【POST 章节审核】提取的字段:', { content, base64Images });

        if (!content) {
            console.error('【POST 章节审核】缺少章节内容');
            return NextResponse.json(
                { error: '缺少章节内容' },
                { status: 400 }
            );
        }

        // 调用后端 API 进行内容审核
        const reviewUrl = `${API_BASE_URL}/api/stories/${storyId}/chapters/${chapterId}/review`;
        console.log('【POST 章节审核】准备调用后端API:', reviewUrl);

        const response = await fetch(reviewUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content, base64Images }) // 发送请求体
        });

        console.log('【POST 章节审核】后端API响应状态:', response.status);

        // 解析响应
        let responseData;
        try {
            responseData = await response.json();
            console.log('【POST 章节审核】后端API响应数据:', responseData);
        } catch (parseError) {
            console.error('【POST 章节审核】解析响应数据失败:', parseError);
            return NextResponse.json(
                { error: '服务器响应格式错误' },
                { status: 500 }
            );
        }

        if (!response.ok) {
            console.error('【POST 章节审核】后端API返回错误:', { status: response.status, error: responseData.error });
            return NextResponse.json(
                { error: responseData.error || '内容审核失败' },
                { status: response.status }
            );
        }

        console.log('【POST 章节审核】审核成功，返回数据');
        return NextResponse.json(responseData);
    } catch (error) {
        console.error('【POST 章节审核】审核失败:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '内容审核失败' },
            { status: 500 }
        );
    }
}