'use client'

import { useEffect, useState } from 'react'
// import { useAccount } from 'wagmi'
// import { useContractRead } from 'wagmi'
import { toast } from 'react-hot-toast'
import { FiUser, FiBook, FiHeart } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'
import Image from 'next/image'

export default function AuthorPage({ params }: { params: { address: string } }) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [stories, setStories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 读取作者信息
  // const { data: authorData, isError, isLoading: isLoadingAuthor } = useContractRead({
  //   address: AUTHOR_MANAGER_CONTRACT,
  //   abi: AuthorManagerABI,
  //   functionName: 'getAuthor',
  //   args: [params.address],
  // })

  // 模拟作者数据
  const authorData = {
    authorName: '测试作者',
    bio: '这是一个测试作者简介',
    avatar: 'https://example.com/avatar.jpg',
    createdAt: '1643723400',
    totalWordCount: 10000
  }

  // 获取作者详细信息和关注状态
  useEffect(() => {
    const fetchAuthorDetails = async () => {
      if (!params.address) return
      
      try {
        // 获取作者故事列表
        const storiesResponse = await fetch(`/api/authors/${params.address}/stories`)
        if (storiesResponse.ok) {
          const data = await storiesResponse.json()
          setStories(data.stories || [])
        }

        // 获取关注信息
        const followsResponse = await fetch(`/api/authors/${params.address}/follows`)
        if (followsResponse.ok) {
          const data = await followsResponse.json()
          setFollowersCount(data.followers?.length || 0)
          setIsFollowing(data.followers?.some((f: any) => f.address === '') || false)
        }
      } catch (error) {
        console.error('Error fetching author details:', error)
        toast.error('获取作者信息失败')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuthorDetails()
  }, [params.address])

  // 关注/取消关注作者
  const handleFollowToggle = async () => {
    try {
      const response = await fetch(`/api/authors/${params.address}/follows`, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerAddress: ''
        })
      })

      if (response.ok) {
        setIsFollowing(!isFollowing)
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1)
        toast.success(isFollowing ? '已取消关注' : '关注成功')
      } else {
        const error = await response.json()
        toast.error(error.message || (isFollowing ? '取消关注失败' : '关注失败'))
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      toast.error(isFollowing ? '取消关注失败' : '关注失败')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* 作者信息头部 */}
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <img
                src={authorData.avatar}
                alt={authorData.authorName}
                className="h-16 w-16 rounded-full"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{authorData.authorName}</h1>
              <p className="text-sm text-gray-500">
                创作于 {formatDistanceToNow(new Date(Number(authorData.createdAt) * 1000), { addSuffix: true, locale: zhCN })}
              </p>
            </div>
          </div>
          <button
            onClick={handleFollowToggle}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              isFollowing
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isFollowing ? '取消关注' : '关注作者'}
          </button>
        </div>

        {/* 作者简介 */}
        <div className="px-4 py-5 sm:p-6">
          <p className="text-gray-500">{authorData.bio}</p>
        </div>

        {/* 统计信息 */}
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500">作品数</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stories.length}</dd>
            </div>
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500">粉丝数</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{followersCount}</dd>
            </div>
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500">总字数</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{authorData.totalWordCount?.toString() || '0'}</dd>
            </div>
          </dl>
        </div>

        {/* 作品列表 */}
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">作品列表</h2>
          {stories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stories.map((story) => (
                <Link
                  key={story.id}
                  href={`/story/${story.id}`}
                  className="block group"
                >
                  <div className="bg-gray-50 rounded-lg p-4 transition-colors duration-200 hover:bg-gray-100">
                    <div className="aspect-w-16 aspect-h-9 mb-3">
                      <Image
                        src={story.coverCid ? `https://ipfs.io/ipfs/${story.coverCid}` : '/images/story-default-cover.jpg'}
                        alt={story.title}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600 mb-2">
                      {story.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{story.description}</p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <FiBook className="mr-1" />
                      <span>{story.wordCount} 字</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <FiBook className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">暂无作品</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
