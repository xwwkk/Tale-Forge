import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: Request) {
    try {
        const { prompt, resolution, style, referenceImage } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: '缺少提示词' },
                { status: 400 }
            );
        }

        const requestBody = {
            prompt,
            resolution,
            ...(style && { style }),
            ...(referenceImage && { referenceImage })
        };

        // 调用后端 API 生成图片
        const response = await fetch(`${API_BASE_URL}/api/ai/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '生成图片失败');
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('AI 生图失败:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '生成图片失败' },
            { status: 500 }
        );
    }
} 