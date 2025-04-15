'use client'

import { useAccount, useContractRead } from 'wagmi'
import { FiUser, FiBook, FiHeart, FiSettings, FiCopy, FiEdit2, FiAward, FiDollarSign, FiClock } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import WalletRequired from '@/components/web3/WalletRequired'
import { CONTRACT_ABIS, CONTRACT_ADDRESSES } from '@/constants/contracts'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ethers } from 'ethers'

interface Author {
  authorAddress: string
  penName: string
  storyCount: number
  totalWordCount: number
  totalEarningsBNB: number
  totalEarningsToken: number
  totalMiningRewards: number
  createdAt: number
  lastUpdate: number
  isActive: boolean
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState('profile')
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [isLoadingFollows, setIsLoadingFollows] = useState(false)

  // 读取作者信息
  const { data: authorData, isError, isLoading } = useContractRead({
    address: CONTRACT_ADDRESSES.AuthorManager as `0x${string}`,
    abi: CONTRACT_ABIS.AuthorManager,
    functionName: 'getAuthor',
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  })

  const [author, setAuthor] = useState<Author | null>(null)

  // 处理作者数据
  useEffect(() => {
    if (authorData) {
      console.log('Raw author data:', authorData)
      
      // 检查数据结构
      if (Array.isArray(authorData)) {
        const data = authorData as unknown as [string, string, bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean]
        console.log('Parsed author data:', {
          authorAddress: data[0],
          penName: data[1],
          isActive: data[9]
        })
        
        setAuthor({
          authorAddress: data[0],
          penName: data[1],
          storyCount: Number(data[2]),
          totalWordCount: Number(data[3]),
          totalEarningsBNB: Number(data[4]),
          totalEarningsToken: Number(data[5]),
          totalMiningRewards: Number(data[6]),
          createdAt: Number(data[7]),
          lastUpdate: Number(data[8]),
          isActive: data[9]
        })
      } else if (typeof authorData === 'object' && authorData !== null) {
        // 如果数据已经是对象格式
        const data = authorData as any
        console.log('Object author data:', data)
        
        setAuthor({
          authorAddress: data.authorAddress || address || '',
          penName: data.penName || '',
          storyCount: Number(data.storyCount || 0),
          totalWordCount: Number(data.totalWordCount || 0),
          totalEarningsBNB: Number(data.totalEarningsBNB || 0),
          totalEarningsToken: Number(data.totalEarningsToken || 0),
          totalMiningRewards: Number(data.totalMiningRewards || 0),
          createdAt: Number(data.createdAt || 0),
          lastUpdate: Number(data.lastUpdate || 0),
          isActive: Boolean(data.isActive)
        })
      }
    }
  }, [authorData, address])

  // 监控作者状态变化
  useEffect(() => {
    console.log('Current author state:', author)
  }, [author])

  // 复制地址到剪贴板
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success('地址已复制到剪贴板')
    }
  }

  const [favorites, setFavorites] = useState<any[]>([])
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false)

  // 获取收藏列表
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!address || activeTab !== 'favorites') return
      
      setIsLoadingFavorites(true)
      try {
        const response = await fetch(`/api/users/${address}/favorites`)
        if (response.ok) {
          const data = await response.json()
          setFavorites(data.favorites || [])
        }
      } catch (error) {
        console.error('Error fetching favorites:', error)
        toast.error('获取收藏列表失败')
      } finally {
        setIsLoadingFavorites(false)
      }
    }

    fetchFavorites()
  }, [address, activeTab])

  // 获取关注列表
  useEffect(() => {
    const fetchFollows = async () => {
      if (!address || activeTab !== 'follows') return
      
      setIsLoadingFollows(true)
      try {
        const response = await fetch(`/api/authors/${address}/follows`)
        if (response.ok) {
          const data = await response.json()
          setFollowers(data.followers || [])
          setFollowing(data.following || [])
        }
      } catch (error) {
        console.error('Error fetching follows:', error)
        toast.error('获取关注列表失败')
      } finally {
        setIsLoadingFollows(false)
      }
    }

    fetchFollows()
  }, [address, activeTab])

  // 取消关注
  const handleUnfollow = async (authorAddress: string) => {
    try {
      const response = await fetch(`/api/authors/${authorAddress}/follows`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerAddress: address
        })
      })

      if (response.ok) {
        setFollowing(following.filter(f => f.address !== authorAddress))
        toast.success('已取消关注')
      } else {
        const error = await response.json()
        toast.error(error.message || '取消关注失败')
      }
    } catch (error) {
      console.error('Error unfollowing author:', error)
      toast.error('取消关注失败')
    }
  }

  return (
    <div className="pt-16">
      <WalletRequired
        title="个人中心"
        description="连接钱包以访问您的个人信息和设置"
        icon={<FiUser className="w-10 h-10 text-indigo-600" />}
      >
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* 顶部卡片 */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {address ? address.slice(2, 4).toUpperCase() : '??'}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">我的钱包</h1>
                    {author?.isActive && (
                      <>
                        <Link 
                          href="/author/dashboard" 
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <FiBook className="w-4 h-4" />
                          我的创作
                        </Link>
                        <Link 
                          href="/beauthor" 
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          编辑作者信息
                        </Link>
                      </>
                    )}
                    {!author?.isActive && (
                      <Link 
                        href="/beauthor" 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors"
                      >
                        <FiEdit2 className="w-4 h-4" />
                        成为作者
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500">
                    <span className="font-mono">{address || '未连接'}</span>
                    <button 
                      onClick={copyAddress}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 主要内容区域 */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === 'profile'
                        ? 'border-b-2 border-indigo-500 text-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    个人资料
                  </button>
                  <button
                    onClick={() => setActiveTab('favorites')}
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === 'favorites'
                        ? 'border-b-2 border-indigo-500 text-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    我的收藏
                  </button>
                  <button
                    onClick={() => setActiveTab('follows')}
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === 'follows'
                        ? 'border-b-2 border-indigo-500 text-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    关注列表
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === 'settings'
                        ? 'border-b-2 border-indigo-500 text-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    设置
                  </button>
                </nav>
              </div>
              <div className="p-6">
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">关于我的作品</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-500 mb-1">已发布作品</div>
                          <div className="text-2xl font-bold text-gray-900">{author?.storyCount || 0}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-500 mb-1">总字数</div>
                          <div className="text-2xl font-bold text-gray-900">{author?.totalWordCount || 0}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-500 mb-1">累计收益</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {author ? `${author.totalEarningsBNB / 1e18} BNB` : '0 BNB'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">账号信息</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">钱包地址</div>
                          <div className="font-mono text-gray-900">{address || '未连接钱包'}</div>
                        </div>
                        {author?.isActive ? (
                          <>
                            <div>
                              <div className="text-sm text-gray-500 mb-1">笔名</div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900">{author.penName}</span>
                                <Link
                                  href="/beauthor"
                                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                >
                                  <FiEdit2 className="w-4 h-4" />
                                </Link>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 mb-1">作者状态</div>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  已认证作者
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div>
                            <div className="text-sm text-gray-500 mb-1">作者状态</div>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                普通用户
                              </span>
                              <Link
                                href="/beauthor"
                                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                              >
                                成为作者
                              </Link>
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-sm text-gray-500 mb-1">注册时间</div>
                          <div className="text-gray-900">
                            {author?.createdAt 
                              ? formatDistanceToNow(author.createdAt * 1000, { addSuffix: true, locale: zhCN })
                              : '未注册'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'favorites' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">我收藏的作品</h3>
                      {isLoadingFavorites ? (
                        <div className="flex justify-center items-center min-h-[200px]">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                        </div>
                      ) : favorites.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {favorites.map((favorite) => (
                            <Link 
                              key={favorite.id} 
                              href={`/story/${favorite.storyId}`}
                              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                            >
                              {favorite.cover && (
                                <div className="aspect-w-16 aspect-h-9 mb-3">
                                  <img
                                    src={favorite.cover}
                                    alt={favorite.title}
                                    className="object-cover rounded-lg"
                                  />
                                </div>
                              )}
                              <h4 className="text-lg font-medium text-gray-900 mb-2">{favorite.title}</h4>
                              <p className="text-sm text-gray-500">作者：{favorite.author}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                收藏于 {formatDistanceToNow(new Date(favorite.createdAt), { addSuffix: true, locale: zhCN })}
                              </p>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                          <FiHeart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500">暂无收藏的作品</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'follows' && (
                  <div className="space-y-6">
                    {isLoadingFollows ? (
                      <div className="flex justify-center items-center min-h-[200px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-8">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">我的关注 ({following.length})</h3>
                          {following.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {following.map((user) => (
                                <div 
                                  key={user.id}
                                  className="bg-white shadow rounded-lg p-4 flex items-center space-x-4"
                                >
                                  <div className="flex-shrink-0">
                                    <img
                                      src={user.avatar || '/default-avatar.png'}
                                      alt={user.authorName || user.nickname || '作者'}
                                      className="h-12 w-12 rounded-full"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {user.authorName || user.nickname || '未设置笔名'}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                      关注于 {formatDistanceToNow(new Date(user.followedAt), { addSuffix: true, locale: zhCN })}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleUnfollow(user.address)}
                                    className="flex-shrink-0 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1 text-sm rounded-full border"
                                  >
                                    取消关注
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-lg p-8 text-center">
                              <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-500">暂无关注的作者</p>
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">我的粉丝 ({followers.length})</h3>
                          {followers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {followers.map((user) => (
                                <div 
                                  key={user.id}
                                  className="bg-white shadow rounded-lg p-4 flex items-center space-x-4"
                                >
                                  <div className="flex-shrink-0">
                                    <img
                                      src={user.avatar || '/default-avatar.png'}
                                      alt={user.authorName || user.nickname || '作者'}
                                      className="h-12 w-12 rounded-full"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {user.authorName || user.nickname || '未设置笔名'}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                      关注于 {formatDistanceToNow(new Date(user.followedAt), { addSuffix: true, locale: zhCN })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-lg p-8 text-center">
                              <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-500">暂无粉丝</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'settings' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">设置</h3>
                    {/* 设置内容 */}
                  </div>
                )}
              </div>
            </div>

            {/* 作者信息区域 */}
            {author?.isActive ? (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <FiAward className="w-6 h-6 text-indigo-600" />
                      <h2 className="text-xl font-bold text-gray-900">作者信息</h2>
                    </div>
                    <Link
                      href="/beauthor"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <FiEdit2 className="w-4 h-4" />
                      修改信息
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 基本信息 */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">基本信息</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <FiUser className="w-5 h-5 text-indigo-600" />
                          <div>
                            <div className="text-sm text-gray-500">笔名</div>
                            <div className="font-medium">{author.penName}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <FiClock className="w-5 h-5 text-indigo-600" />
                          <div>
                            <div className="text-sm text-gray-500">注册时间</div>
                            <div className="font-medium">
                              {formatDistanceToNow(author.createdAt * 1000, { addSuffix: true, locale: zhCN })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 创作数据 */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">创作数据</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <FiBook className="w-5 h-5 text-indigo-600" />
                          <div>
                            <div className="text-sm text-gray-500">作品数量</div>
                            <div className="font-medium">{author.storyCount} 部作品</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <FiBook className="w-5 h-5 text-indigo-600" />
                          <div>
                            <div className="text-sm text-gray-500">总字数</div>
                            <div className="font-medium">{author.totalWordCount} 字</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 收益数据 */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">收益数据</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <FiDollarSign className="w-5 h-5 text-indigo-600" />
                          <div>
                            <div className="text-sm text-gray-500">总收益</div>
                            <div className="font-medium">
                              {author.totalEarningsBNB / 1e18} BNB / {author.totalEarningsToken / 1e18} Token
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <FiAward className="w-5 h-5 text-indigo-600" />
                          <div>
                            <div className="text-sm text-gray-500">挖矿奖励</div>
                            <div className="font-medium">{author.totalMiningRewards / 1e18} Token</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center">
                  <FiUser className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">成为作者</h2>
                  <p className="text-gray-600 mb-6">注册成为作者，开始您的创作之旅</p>
                  <Link
                    href="/beauthor"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    立即注册
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </WalletRequired>
    </div>
  )
}
