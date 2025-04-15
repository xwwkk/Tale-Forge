import { NextResponse } from 'next/server'
import { PrismaClient, User } from '@prisma/client'

const prisma = new PrismaClient()

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

// 获取指定作者信息
export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    console.log('[GET /api/authors/:address] 收到请求:', {
      url: request.url,
      params: params
    })
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/authors/${params.address}`
    )
    return NextResponse.json(await response.json())
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch author' }, { status: 500 })
  }
}

// 更新指定作者信息
export async function PUT(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const data = await request.json()
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/authors/${params.address}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    )
    return NextResponse.json(await response.json())
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update author' }, { status: 500 })
  }
}
