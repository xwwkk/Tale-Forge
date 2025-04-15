import { NextResponse } from 'next/server'

// 获取作者的关注者列表
export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/authors/${params.address}/follows`
    )
    return NextResponse.json(await response.json())
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch followers' },
      { status: 500 }
    )
  }
}

// 关注作者
export async function POST(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const data = await request.json()
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/authors/${params.address}/follows`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    )
    return NextResponse.json(await response.json())
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to follow author' },
      { status: 500 }
    )
  }
}

// 取消关注作者
export async function DELETE(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const data = await request.json()
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/authors/${params.address}/follows`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    )
    return NextResponse.json(await response.json())
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to unfollow author' },
      { status: 500 }
    )
  }
}
