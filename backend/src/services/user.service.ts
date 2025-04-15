import prisma from '../prisma'
import { uploadImageToIPFS } from '../ipfs'
import type { User, Story, Like, Favorite, Transaction, Prisma } from '@prisma/client'

export interface UpdateUserInput {
  nickname?: string
  avatar?: File
  bio?: string
  authorName?: string
  socialLinks?: {
    twitter?: string
    discord?: string
    website?: string
  }
}

interface AuthorRegisterInput {
  address: string
  penName: string
  bio?: string
  avatar?: string
  email?: string
}

export class UserService {
  /**
   * 创建用户
   */
  async createUser(data: {
    address: string
    penName?: string
    bio?: string
    avatar?: string
    email?: string
  }): Promise<User> {
    return await prisma.user.create({
      data: {
        address: data.address,
        authorName: data.penName,
        bio: data.bio,
        avatar: data.avatar,
        email: data.email,
        isAuthor: true
      }
    })
  }

  /**
   * 创建或获取用户
   */
  async getOrCreateUser(address: string): Promise<User> {
    return await prisma.user.upsert({
      where: { address },
      update: {},
      create: { address }
    })
  }

  /**
   * 更新用户信息
   */
  async updateUser(address: string, data: {
    penName?: string
    bio?: string
    email?: string
    avatar?: string
  }) {
    console.log('[updateUser] 开始更新用户信息:', { address, data })

    const user = await prisma.user.findUnique({
      where: { address }
    })

    if (!user) {
      console.log('[updateUser] 错误: 用户不存在')
      throw new Error('用户不存在')
    }

    if (!user.isAuthor) {
      console.log('[updateUser] 错误: 非作者用户')
      throw new Error('非作者用户')
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { address },
        data: {
          authorName: data.penName,
          bio: data.bio,
          email: data.email,
          avatar: data.avatar,
          updatedAt: new Date()
        }
      })
      console.log('[updateUser] 更新成功:', updatedUser)
      return updatedUser
    } catch (error) {
      console.error('[updateUser] 更新失败:', error)
      throw new Error('更新用户信息失败')
    }
  }

  /**
   * 获取用户信息
   */
  async getUser(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            stories: true,
            followers: true,
            following: true
          }
        }
      }
    })
  }


  // 完整的注册方法
  async registerAuthor(data: AuthorRegisterInput) {
    // 后端负责完整的业务逻辑验证
    // 1. 数据完整性验证
    if (!data.address || !data.penName || !data.email) {
      throw new Error('缺少必要信息')
    }

    // 2. 业务规则验证
    // 2.1 笔名唯一性检查
    const existingAuthor = await prisma.user.findFirst({
      where: {
        authorName: data.penName,
        NOT: { address: data.address }
      }
    })
    if (existingAuthor) {
      throw new Error('该笔名已被使用')
    }

    // 2.2 地址是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { address: data.address }
    })
    if (existingUser?.isAuthor) {
      throw new Error('该地址已注册为作者')
    }

    // 3. 创建或更新作者信息
    try {
      return await prisma.user.upsert({
        where: { address: data.address },
        create: {
          address: data.address,
          authorName: data.penName,
          bio: data.bio || '',
          email: data.email,
          avatar: data.avatar || '',
          isAuthor: true
        },
        update: {
          authorName: data.penName,
          bio: data.bio || '',
          email: data.email,
          avatar: data.avatar || '',
          isAuthor: true
        }
      })
    } catch (error) {
      console.error('Failed to register author:', error)
      throw new Error('注册作者失败')
    }
  }

  // 获取作者关注者
  async getAuthorFollows(address: string) {
    const author = await prisma.user.findUnique({
      where: { address },
      include: {
        followers: {
          include: {
            follower: true
          }
        },
        following: {
          include: {
            following: true
          }
        }
      }
    });

    if (!author) {
      throw new Error('Author not found');
    }

    return {
      followers: author.followers.map(f => ({
        id: f.follower.id,
        address: f.follower.address,
        nickname: f.follower.nickname,
        avatar: f.follower.avatar,
        authorName: f.follower.authorName,
        isAuthor: f.follower.isAuthor,
        followedAt: f.createdAt
      })),
      following: author.following.map(f => ({
        id: f.following.id,
        address: f.following.address,
        nickname: f.following.nickname,
        avatar: f.following.avatar,
        authorName: f.following.authorName,
        isAuthor: f.following.isAuthor,
        followedAt: f.createdAt
      }))
    };
  }

  // 关注作者
  async followAuthor(authorAddress: string, followerAddress: string) {
    console.log(`[followAuthor] 开始关注作者, 作者地址: ${authorAddress}, 关注者地址: ${followerAddress}`)
    
    const [author, follower] = await Promise.all([
      prisma.user.findUnique({ where: { address: authorAddress } }),
      prisma.user.findUnique({ where: { address: followerAddress } })
    ]);
    console.log('[followAuthor] 查询结果:', { author, follower })

    if (!author || !follower) {
      console.log('[followAuthor] 错误: 未找到用户')
      throw new Error('User not found');
    }

    const follow = await prisma.follow.create({
      data: {
        followerId: follower.id,
        followingId: author.id
      },
      include: {
        following: true
      }
    });
    console.log('[followAuthor] 创建关注关系成功:', follow)

    const result = {
      id: follow.following.id,
      address: follow.following.address,
      nickname: follow.following.nickname,
      avatar: follow.following.avatar,
      authorName: follow.following.authorName,
      isAuthor: follow.following.isAuthor,
      followedAt: follow.createdAt
    };
    console.log('[followAuthor] 返回结果:', result)
    return result;
  }

  // 取消关注作者
  async unfollowAuthor(authorAddress: string, followerAddress: string) {
    console.log(`[unfollowAuthor] 开始取消关注, 作者地址: ${authorAddress}, 关注者地址: ${followerAddress}`)
    
    const [author, follower] = await Promise.all([
      prisma.user.findUnique({ where: { address: authorAddress } }),
      prisma.user.findUnique({ where: { address: followerAddress } })
    ]);
    console.log('[unfollowAuthor] 查询结果:', { author, follower })

    if (!author || !follower) {
      console.log('[unfollowAuthor] 错误: 未找到用户')
      throw new Error('User not found');
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: author.id
        }
      }
    });
    console.log('[unfollowAuthor] 删除关注关系成功')
  }

  // 获得作者信息
  async getAuthorByAddress(address: string) {
    console.log(`[getAuthorByAddress] 开始查询作者信息, 地址: ${address}`)
    
    const user = await prisma.user.findUnique({
      where: { 
        address,
        isAuthor: true
      },
      include: {
        _count: {
          select: {
            stories: true,
            followers: true,
            following: true
          }
        }
      }
    })
    console.log('[getAuthorByAddress] 查询结果:', user)

    if (!user) {
      console.log('[getAuthorByAddress] 错误: 未找到作者')
      throw new Error('Author not found')
    }

    const result = {
      id: user.id,
      address: user.address,
      authorName: user.authorName,
      bio: user.bio,
      avatar: user.avatar,
      email: user.email,
      isAuthor: user.isAuthor,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stats: {
        storyCount: user._count.stories,
        followerCount: user._count.followers,
        followingCount: user._count.following
      }
    }
    console.log('[getAuthorByAddress] 返回结果:', result)
    return result
  }


  /**
   * 关注用户
   */
  async followUser(followerId: string, followingId: string) {
    return await prisma.follow.create({
      data: {
        followerId,
        followingId
      }
    })
  }

  /**
   * 取消关注
   */
  async unfollowUser(followerId: string, followingId: string) {
    return await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    })
  }

  /**
   * 获取用户的关注者
   */
  async getFollowers(userId: string, skip = 0, take = 10) {
    const [total, followers] = await Promise.all([
      prisma.follow.count({
        where: { followingId: userId }
      }),
      prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take,
        include: {
          follower: true
        }
      })
    ])

    return {
      followers: followers.map(f => f.follower),
      total
    }
  }

  /**
   * 获取用户关注的人
   */
  async getFollowing(userId: string, skip = 0, take = 10) {
    const [total, following] = await Promise.all([
      prisma.follow.count({
        where: { followerId: userId }
      }),
      prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take,
        include: {
          following: true
        }
      })
    ])

    return {
      following: following.map(f => f.following),
      total
    }
  }

  /**
   * 获取用户收藏的故事
   */
  async getUserFavorites(userId: string, params: {
    skip?: number
    take?: number
  }): Promise<{ total: number; favorites: (Favorite & { story: Story })[] }> {
    const { skip = 0, take = 10 } = params

    const [total, favorites] = await Promise.all([
      prisma.favorite.count({
        where: { userId },
      }),
      prisma.favorite.findMany({
        where: { userId },
        skip,
        take,
        include: {
          story: {
            include: {
              _count: {
                select: {
                  likes: true,
                  favorites: true,
                  comments: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    return {
      total,
      favorites,
    }
  }

  /**
   * 获取用户点赞的故事
   */
  async getUserLikes(userId: string, params: {
    skip?: number
    take?: number
  }): Promise<{ total: number; likes: (Like & { story: Story })[] }> {
    const { skip = 0, take = 10 } = params

    const [total, likes] = await Promise.all([
      prisma.like.count({
        where: { userId },
      }),
      prisma.like.findMany({
        where: { userId },
        skip,
        take,
        include: {
          story: {
            include: {
              _count: {
                select: {
                  likes: true,
                  favorites: true,
                  comments: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    return {
      total,
      likes,
    }
  }

  /**
   * 获取用户交易记录
   */
  async getUserTransactions(userId: string, params: {
    skip?: number
    take?: number
    type?: 'PURCHASE' | 'REWARD' | 'WITHDRAW'
  }): Promise<{ total: number; transactions: (Transaction & { story: Story })[] }> {
    const { skip = 0, take = 10, type } = params

    const where = {
      userId,
      ...(type && { type })
    }

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        skip,
        take,
        include: {
          story: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    return {
      total,
      transactions,
    }
  }

  /**
   * 点赞故事
   */
  async likeStory(userId: string, storyId: string): Promise<Like> {
    return prisma.like.create({
      data: {
        userId,
        storyId,
      },
    })
  }

  /**
   * 取消点赞故事
   */
  async unlikeStory(userId: string, storyId: string): Promise<void> {
    await prisma.like.delete({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    })
  }

  /**
   * 收藏故事
   */
  async favoriteStory(userId: string, storyId: string): Promise<Favorite> {
    return prisma.favorite.create({
      data: {
        userId,
        storyId,
      },
    })
  }

  /**
   * 取消收藏故事
   */
  async unfavoriteStory(userId: string, storyId: string): Promise<void> {
    await prisma.favorite.delete({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    })
  }

  /**
   * 记录交易
   */
  async recordTransaction(data: {
    userId: string
    storyId: string
    type: 'PURCHASE' | 'REWARD' | 'WITHDRAW'
    amount: string
    txHash: string
  }): Promise<Transaction> {
    return prisma.transaction.create({
      data,
      include: {
        story: true
      }
    })
  }


}