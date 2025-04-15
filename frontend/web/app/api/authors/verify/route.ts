import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/authors/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return NextResponse.json(await response.json())
  } catch (error) {
    return NextResponse.json({ error: 'Failed to verify author' }, { status: 500 })
  }
} 