'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Pagination } from '@/components/common/Pagination'
import { CATEGORIES, SORT_OPTIONS } from '@/constants/story'
import type { Story, StoriesResponse } from '@/types/story'
import Image from 'next/image'
import Link from 'next/link'
import { FiEye, FiHeart, FiMessageSquare } from 'react-icons/fi'

const fetchStories = async (params: any) => {
  const queryString = new URLSearchParams(params).toString()
  const url = `/api/stories?${queryString}`
  console.log('【作品列表】请求URL:', url, '参数:', params)
  const response = await fetch(url)
  console.log('【作品列表】响应状态:', response.status)
  console.log('【作品列表】响应:', response)
  if (!response.ok) {
    const errorText = await response.text()
    console.error('【作品列表】请求失败:', errorText)
    throw new Error(`Failed to fetch stories: ${response.status} ${errorText}`)
  }
  const data = await response.json()
  console.log('【作品列表】返回数据:', data)
  return data
}


// const fetchStories = async (params: any) => {
//   const queryString = new URLSearchParams(params).toString()
//   console.log('【作品列表】请求URL:', url, '参数:', params)
//   const response = await fetch(url)
//   console.log('【作品列表】响应状态:', response.status)
//   const response = await fetch(`/api/stories?${queryString}`)
//   if (!response.ok) {
//     throw new Error('Failed to fetch stories')
//   }
//   return response.json()
// }

const IPFS_GATEWAYS = [
  'https://blue-casual-wombat-745.mypinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  // 'https://gateway.pinata.cloud/ipfs/',
  // 'https://cloudflare-ipfs.com/ipfs/'
]

const fetchIPFSImage = async (cid: string) => {
  for (const gateway of IPFS_GATEWAYS) {
    try {
      console.log(`[IPFS] Trying gateway ${gateway} for image: ${cid}`)
      const response = await fetch(`${gateway}${cid}`)
      
      if (!response.ok) {
        console.log(`[IPFS] Gateway ${gateway} failed with status: ${response.status}`)
        continue
      }
      
      const text = await response.text()
      if (text.startsWith('data:image')) {
        return text
      }
      
      try {
        const data = JSON.parse(text)
        if (data.content) {
          return data.content
        }
      } catch (e) {
        // Not JSON, use as-is
      }
      
      return text
    } catch (error) {
      console.error(`[IPFS] Error with gateway ${gateway}:`, error)
      // Continue to next gateway
    }
  }
  console.log(`[IPFS] All gateways failed for ${cid}, using default image`)
  return null
}

export default function StoriesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<StoriesResponse | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [storyImages, setStoryImages] = useState<{ [key: string]: string }>({})
  const [mounted, setMounted] = useState(false)

  const category = searchParams.get('category') || 'all'
  const sortBy = searchParams.get('sort') || 'latest'
  const page = Number(searchParams.get('page')) || 1
  const search = searchParams.get('search') || ''

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function loadStories() {
      try {
        setIsLoading(true)
        setError(null)
        console.log('【作品列表】开始加载, 参数:', { category, sortBy, search, page, limit: 12 })
        
        const result = await fetchStories({
          ...(category !== 'all' ? { category } : {}),
          sortBy,
          search,
          page,
          take: 12,
          skip: (page - 1) * 12
        })
        
        // 设置故事列表，即使数据为空也设置为空数组
        const stories = Array.isArray(result?.stories) ? result.stories : []
        setStories(stories)
        
        // 设置分页数据，使用默认值防止数据不完整
        setData({
          stories,
          pagination: {
            page: result?.currentPage || page,
            totalPages: result?.totalPages || 1,
            total: result?.total || 0,
            limit: 12
          }
        })

        // 只在有故事且有封面的情况下尝试加载 IPFS 图片
        if (stories.length > 0) {
          const ipfsStories = stories.filter((story: Story) => story?.coverCid?.startsWith('Qm'))
          if (ipfsStories.length > 0) {
            // Load images in parallel but don't wait for all to complete
            ipfsStories.forEach(async (story: Story) => {
              try {
                if (!story.coverCid) return
                const imageContent = await fetchIPFSImage(story.coverCid)
                if (imageContent) {
                  setStoryImages(prev => ({
                    ...prev,
                    [story.coverCid!]: imageContent
                  }))
                }
              } catch (error) {
                console.error(`[IPFS] Failed to load image for story ${story.id}:`, error)
              }
            })
          }
        }
      } catch (err) {
        console.error('【作品列表】加载失败:', err)
        setError('获取作品列表失败，请稍后重试')
        // 在错误时设置空数据，而不是保持加载状态
        setStories([])
        setData({
          stories: [],
          pagination: {
            page: 1,
            totalPages: 1,
            total: 0,
            limit: 12
          }
        })
      } finally {
        // 确保无论如何都会关闭加载状态
        setIsLoading(false)
      }
    }

    loadStories()
  }, [category, sortBy, search, page])

  const handleCategoryChange = (newCategory: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('category', newCategory)
    params.set('page', '1')
    router.push(`/stories?${params.toString()}`)
  }

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('sort', newSort)
    params.set('page', '1')
    router.push(`/stories?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    params.set('search', search)
    params.set('page', '1')
    router.push(`/stories?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    router.push(`/stories?${params.toString()}`)
  }

  if (!mounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex space-x-2 mb-2">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
          </div>
          <span className="text-sm text-gray-500">正在加载作品列表...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            刷新页面
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">探索精彩故事</h1>
          <p className="text-gray-500">发现创作者们的奇思妙想</p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-700 mb-2">分类</h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                      ${category === cat.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white/60 backdrop-blur-sm text-gray-600 hover:bg-white/80'
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-none">
              <h3 className="text-sm font-medium text-gray-700 mb-2">排序</h3>
              <div className="flex gap-2">
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleSortChange(option.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                      ${sortBy === option.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white/60 backdrop-blur-sm text-gray-600 hover:bg-white/80'
                      }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无作品</h3>
            <p className="text-gray-500 mb-4">当前分类下没有找到任何作品</p>
            {category !== 'all' && (
              <button 
                onClick={() => handleCategoryChange('all')} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                查看全部分类
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stories.map((story) => (
              <Link 
                key={story.id} 
                href={`/stories/${story.id}`}
                className="group bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="relative h-56 w-full">
                  <Image
                    src={
                      story.coverCid?.startsWith('data:image') 
                        ? story.coverCid
                        : story.coverCid?.startsWith('Qm')
                          ? storyImages[story.coverCid] || '/images/story-default-cover.jpg'
                          : '/images/story-default-cover.jpg'
                    }
                    alt={story.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      const imgElement = e.target as HTMLImageElement;
                      imgElement.src = '/images/story-default-cover.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-600/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                      {story.category}
                    </span>
                    {story.nftMinted && (
                      <span className="px-3 py-1 bg-purple-600/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                        NFT
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-1">
                    {story.title}
                  </h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {story.description || '暂无简介'}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {story.author.avatar ? (
                        <Image 
                          src={story.author.avatar} 
                          alt={story.author.authorName || '作者'} 
                          width={28} 
                          height={28} 
                          className="rounded-full ring-2 ring-white shadow-sm"
                        />
                      ) : (
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium ring-2 ring-white shadow-sm">
                          {(story.author.authorName || 'A')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {story.author?.authorName || story.author?.address?.slice(0, 6) + '...' + story.author?.address?.slice(-4) || '匿名作者'}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {story.author?.address?.slice(0, 6)}...{story.author?.address?.slice(-4)}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(story.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                          NFT {story.nftMinted ? '已铸造' : '未铸造'}
                        </div>
                      </div>
                      <div className="text-gray-500">
                        {story.wordCount.toLocaleString()} 字
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <FiHeart className="w-4 h-4" />
                          <span>{story.stats?.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <FiMessageSquare className="w-4 h-4" />
                          <span>{story.stats?.comments || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <FiEye className="w-4 h-4" />
                          <span>{story.stats?.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {stories.length > 0 && data && data.pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  )
} 