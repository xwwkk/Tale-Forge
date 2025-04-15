import { NextResponse, NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// 获取角色列表
export async function GET(request: NextRequest) {
    try {
        console.log('【API - 获取角色列表】收到请求');
        const searchParams = request.nextUrl.searchParams;
        const storyId = searchParams.get('storyId');

        if (!storyId) {
            return NextResponse.json(
                { error: 'storyId is required' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `${API_BASE_URL}/api/ai/characters?storyId=${storyId}`
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('【API - 获取角色列表】后端响应错误:', errorText);
            throw new Error(`Backend API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('【API - 获取角色列表】获取成功:', { count: data.length });
        return NextResponse.json(data);
    } catch (error) {
        console.error('【API - 获取角色列表】错误:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '获取角色列表失败' },
            { status: 500 }
        );
    }
}

// 创建新角色
export async function POST(request: NextRequest) {
    try {
        console.log('【API - 创建角色】收到请求');
        const body = await request.json();
        const { storyId, name, role, background, personality, goals, relationships } = body;

        if (!storyId || !name || !role) {
            return NextResponse.json(
                { error: 'storyId, name, and role are required' },
                { status: 400 }
            );
        }

        const response = await fetch(`${API_BASE_URL}/api/ai/characters`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                storyId,
                name,
                role,
                background,
                personality,
                goals,
                relationships
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('【API - 创建角色】后端响应错误:', errorText);
            throw new Error(`Backend API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('【API - 创建角色】创建成功:', { id: data.id });
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('【API - 创建角色】错误:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '创建角色失败' },
            { status: 500 }
        );
    }
} 