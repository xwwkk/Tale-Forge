import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { message, characterId } = body

        if (!message) {
            return NextResponse.json(
                { error: '缺少消息内容' },
                { status: 400 }
            )
        }

        // 调用后端 API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, characterId }),
        })

        if (!response.ok) {
            throw new Error('聊天服务请求失败')
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('聊天请求失败:', error)
        return NextResponse.json(
            { error: error.message || '聊天服务暂时不可用' },
            { status: 500 }
        )
    }
}
