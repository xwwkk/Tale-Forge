import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    // 根据钱包地址找到用户
    const user = await prisma.user.findUnique({
      where: { address: params.address },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 获取用户的收藏列表
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        story: {
          include: {
            author: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedFavorites = favorites.map(fav => ({
      id: fav.id,
      storyId: fav.storyId,
      title: fav.story.title,
      author: fav.story.author.authorName || 'Unknown',
      coverCid: fav.story.coverCid,
      createdAt: fav.createdAt,
    }))

    return NextResponse.json({
      favorites: formattedFavorites,
    })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
