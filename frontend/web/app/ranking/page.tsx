'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import styles from './page.module.css'

// 榜单类型
const RANKING_TYPES = [
  { id: 'authors', name: '作家榜' },
  { id: 'works', name: '作品榜' },
  { id: 'nft', name: 'NFT榜' }
]

// 作家榜排序选项
const AUTHOR_SORT_OPTIONS = [
  { id: 'earnings', name: '收益' },
  { id: 'readers', name: '读者数' },
  { id: 'works', name: '作品数' },
  { id: 'likes', name: '获赞数' }
]

// 作品榜排序选项
const WORK_SORT_OPTIONS = [
  { id: 'hot', name: '热门' },
  { id: 'new', name: '最新' },
  { id: 'rating', name: '评分' },
  { id: 'collect', name: '收藏' }
]

// NFT榜排序选项
const NFT_SORT_OPTIONS = [
  { id: 'volume', name: '交易额' },
  { id: 'trades', name: '交易量' },
  { id: 'price', name: '价格' }
]

// 时间范围选项
const TIME_RANGES = [
  { id: 'weekly', name: '周榜' },
  { id: 'monthly', name: '月榜' },
  { id: 'yearly', name: '年榜' },
  { id: 'all', name: '总榜' }
]

// 模拟作家数据
const AUTHORS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `作家${i + 1}`,
  avatar: `https://picsum.photos/seed/author${i}/200/200`,  // Use deterministic seed
  earnings: 100000 + (i * 10000),  // Deterministic values
  readers: 10000 + (i * 1000),
  works: 20 - i,
  likes: 50000 + (i * 5000),
  verified: i < 5,
  description: `优秀作家，创作了多部精品作品`,
  tags: ['科幻', '奇幻', '冒险'],
  ranking: i + 1
}))

// 模拟作品数据
const WORKS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  title: `作品${i + 1}`,
  author: `作家${Math.min(i + 1, 20)}`,  // Deterministic author
  cover: `https://picsum.photos/seed/work${i}/400/600`,  // Use deterministic seed
  views: 200000 + (i * 20000),  // Deterministic values
  rating: (5 - (i * 0.1)).toFixed(1),
  collects: 30000 + (i * 3000),
  hot: 500000 + (i * 50000),
  new: Date.now() - (i * 86400000),  // One day difference each
  tags: ['奇幻', '冒险', '热血'],
  ranking: i + 1
}))

// 模拟NFT数据
const NFTS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  title: `NFT作品${i + 1}`,
  image: `https://picsum.photos/seed/nft${i}/400/400`,  // Use deterministic seed
  creator: `作家${Math.min(i + 1, 20)}`,  // Deterministic creator
  volume: 1000000 - (i * 50000),  // Deterministic values
  trades: 1000 - (i * 50),
  price: (100 - (i * 5)).toFixed(2),
  ranking: i + 1
}))

export default function RankingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [rankingType, setRankingType] = useState('authors')
  const [sortBy, setSortBy] = useState('earnings')
  const [timeRange, setTimeRange] = useState('weekly')

  // 获取当前排序选项
  const getCurrentSortOptions = () => {
    switch (rankingType) {
      case 'works':
        return WORK_SORT_OPTIONS
      case 'nft':
        return NFT_SORT_OPTIONS
      default:
        return AUTHOR_SORT_OPTIONS
    }
  }

  // 获取排序后的数据
  const getSortedData = () => {
    switch (rankingType) {
      case 'works':
        return [...WORKS].sort((a, b) => b[sortBy as keyof typeof b] - a[sortBy as keyof typeof a])
      case 'nft':
        return [...NFTS].sort((a, b) => b[sortBy as keyof typeof b] - a[sortBy as keyof typeof a])
      default:
        return [...AUTHORS].sort((a, b) => b[sortBy as keyof typeof b] - a[sortBy as keyof typeof a])
    }
  }

  return (
    <div className="min-h-screen pt-[118px]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">榜单中心</h1>
            <p className="text-gray-600">发现优秀的作家、作品与NFT</p>
          </div>

          {/* 榜单筛选器 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="space-y-6">
              {/* 榜单类型 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">榜单类型</h3>
                <div className="flex flex-wrap gap-3">
                  {RANKING_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setRankingType(type.id);
                        setSortBy(type.id === 'works' ? 'hot' : type.id === 'nft' ? 'volume' : 'earnings');
                      }}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300
                        ${rankingType === type.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 排序选项 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">排序方式</h3>
                <div className="flex flex-wrap gap-3">
                  {getCurrentSortOptions().map(option => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id)}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300
                        ${sortBy === option.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {option.name}榜
                    </button>
                  ))}
                </div>
              </div>

              {/* 时间范围 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">时间范围</h3>
                <div className="flex flex-wrap gap-3">
                  {TIME_RANGES.map(range => (
                    <button
                      key={range.id}
                      onClick={() => setTimeRange(range.id)}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300
                        ${timeRange === range.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {range.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 榜单内容 */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              {rankingType === 'authors' && (
                <div className={styles.authorList}>
                  {getSortedData().map(author => (
                    <Link href={`/authors/${author.id}`} key={author.id} className={styles.authorCard}>
                      <div className={styles.ranking}>
                        <span className={styles.rankingNumber}>
                          {author.ranking}
                        </span>
                      </div>
                      <div className={styles.avatarWrapper}>
                        <Image
                          src={author.avatar}
                          alt={author.name}
                          width={80}
                          height={80}
                          className={styles.avatar}
                        />
                        {author.verified && (
                          <div className={styles.verifiedBadge}>
                            <svg viewBox="0 0 24 24" fill="none" className={styles.verifiedIcon}>
                              <path
                                d="M9 12l2 2 4-4"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className={styles.info}>
                        <h3 className={styles.name}>{author.name}</h3>
                        <p className={styles.description}>{author.description}</p>
                        <div className={styles.tags}>
                          {author.tags.map(tag => (
                            <span key={tag} className={styles.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={styles.stats}>
                        <div className={styles.stat}>
                          <span className={styles.value}>
                            {author.earnings.toLocaleString('zh-CN')}
                          </span>
                          <span className={styles.label}>收益</span>
                        </div>
                        <div className={styles.stat}>
                          <span className={styles.value}>
                            {author.readers.toLocaleString('zh-CN')}
                          </span>
                          <span className={styles.label}>读者</span>
                        </div>
                        <div className={styles.stat}>
                          <span className={styles.value}>{author.works}</span>
                          <span className={styles.label}>作品</span>
                        </div>
                        <div className={styles.stat}>
                          <span className={styles.value}>
                            {author.likes.toLocaleString('zh-CN')}
                          </span>
                          <span className={styles.label}>获赞</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {rankingType === 'works' && (
                <div className={styles.workList}>
                  {getSortedData().map((work: any) => (
                    <Link href={`/stories/${work.id}`} key={work.id} className={styles.workCard}>
                      <div className={styles.ranking}>
                        <span className={styles.rankingNumber}>
                          {work.ranking}
                        </span>
                      </div>
                      <div className={styles.coverWrapper}>
                        <Image
                          src={work.cover}
                          alt={work.title}
                          width={200}
                          height={267}
                          className={styles.cover}
                        />
                      </div>
                      <div className={styles.info}>
                        <h3 className={styles.title}>{work.title}</h3>
                        <p className={styles.author}>{work.author}</p>
                        <div className={styles.tags}>
                          {work.tags.map(tag => (
                            <span key={tag} className={styles.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className={styles.workStats}>
                          <div className={styles.workStat}>
                            <span className={styles.value}>{work.views.toLocaleString('zh-CN')}</span>
                            <span className={styles.label}>阅读</span>
                          </div>
                          <div className={styles.workStat}>
                            <span className={styles.value}>{work.rating}</span>
                            <span className={styles.label}>评分</span>
                          </div>
                          <div className={styles.workStat}>
                            <span className={styles.value}>
                              {work.collects.toLocaleString('zh-CN')}
                            </span>
                            <span className={styles.label}>收藏</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {rankingType === 'nft' && (
                <div className={styles.nftList}>
                  {getSortedData().map((nft: any) => (
                    <Link href={`/nft-market/${nft.id}`} key={nft.id} className={styles.nftCard}>
                      <div className={styles.ranking}>
                        <span className={styles.rankingNumber}>
                          {nft.ranking}
                        </span>
                      </div>
                      <div className={styles.nftImageWrapper}>
                        <Image
                          src={nft.image}
                          alt={nft.title}
                          width={200}
                          height={200}
                          className={styles.nftImage}
                        />
                      </div>
                      <div className={styles.info}>
                        <h3 className={styles.title}>{nft.title}</h3>
                        <p className={styles.creator}>创作者：{nft.creator}</p>
                        <div className={styles.nftStats}>
                          <div className={styles.nftStat}>
                            <span className={styles.value}>
                              {nft.volume.toLocaleString('zh-CN')}
                            </span>
                            <span className={styles.label}>交易额</span>
                          </div>
                          <div className={styles.nftStat}>
                            <span className={styles.value}>
                              {nft.trades.toLocaleString('zh-CN')}
                            </span>
                            <span className={styles.label}>交易量</span>
                          </div>
                          <div className={styles.nftStat}>
                            <span className={styles.value}>{nft.price.toFixed(2)}</span>
                            <span className={styles.label}>价格</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 