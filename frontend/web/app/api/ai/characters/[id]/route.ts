import { NextResponse, NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// 获取单个角色
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        console.log('【API - 获取角色】收到请求:', { id });

        const response = await fetch(`${API_BASE_URL}/api/ai/characters/${id}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('【API - 获取角色】后端响应错误:', errorText);
            throw new Error(`Backend API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('【API - 获取角色】获取成功');
        return NextResponse.json(data);
    } catch (error) {
        console.error('【API - 获取角色】错误:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '获取角色失败' },
            { status: 500 }
        );
    }
}

// 更新角色
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        console.log('【API - 更新角色】收到请求:', { id });

        const body = await request.json();
        const { name, role, background, personality, goals, relationships } = body;

        const response = await fetch(`${API_BASE_URL}/api/ai/characters/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
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
            console.error('【API - 更新角色】后端响应错误:', errorText);
            throw new Error(`Backend API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('【API - 更新角色】更新成功');
        return NextResponse.json(data);
    } catch (error) {
        console.error('【API - 更新角色】错误:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '更新角色失败' },
            { status: 500 }
        );
    }
}

// 删除角色
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        console.log('【API - 删除角色】收到请求:', { id });

        const response = await fetch(`${API_BASE_URL}/api/ai/characters/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('【API - 删除角色】后端响应错误:', errorText);
            throw new Error(`Backend API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('【API - 删除角色】删除成功');
        return NextResponse.json(data);
    } catch (error) {
        console.error('【API - 删除角色】错误:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '删除角色失败' },
            { status: 500 }
        );
    }
} 