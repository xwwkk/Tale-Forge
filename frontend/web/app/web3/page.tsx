'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import styles from './page.module.css'
import { FaShoppingCart, FaHammer } from 'react-icons/fa'
import { useRouter } from 'next/navigation'

// 市场模块类型
const MARKET_MODULES = [
  { id: 'nft', name: 'NFT市场', icon: '🎨' },
  { id: 'mining', name: '挖矿中心', icon: '⛏️' }
]

// 模拟NFT数据
const mockNFTs = [
  {
    id: 1,
    title: '数字艺术品 #001',
    image: `https://picsum.photos/800/600?random=1`,
    creator: '创作者A',
    price: '0.5 BNB',
    available: true,
    tags: ['艺术', '限量'],
    likes: 120,
    views: 1500
  },
  {
    id: 2,
    title: '数字艺术品 #002',
    image: `https://picsum.photos/800/600?random=2`, 
    creator: '创作者B',
    price: '0.8 BNB',
    available: true,
    tags: ['收藏', '稀有'],
    likes: 89,
    views: 1200
  },
  {
    id: 3,
    title: '数字艺术品 #003',
    image: `https://picsum.photos/800/600?random=3`,
    creator: '创作者C', 
    price: '0.3 BNB',
    available: false,
    tags: ['艺术', '普通'],
    likes: 45,
    views: 800
  }
]

// 模拟挖矿池数据
const mockPools = [
  {
    id: 1,
    name: '基础挖矿池',
    icon: '⛏️',
    description: '适合新手的基础挖矿池,收益稳定',
    hashRate: '100 MH/s',
    dailyReward: '0.01 BNB',
    difficulty: '低',
    minStake: '10 TLF',
    participants: 1200
  },
  {
    id: 2, 
    name: '高级挖矿池',
    icon: '🏆',
    description: '高收益高风险的挖矿池,适合进阶用户',
    hashRate: '500 MH/s',
    dailyReward: '0.05 BNB',
    difficulty: '中',
    minStake: '50 TLF',
    participants: 500
  },
  {
    id: 3,
    name: '专业挖矿池',
    icon: '💎',
    description: '最高收益的专业挖矿池,需要大量质押',
    hashRate: '1 GH/s',
    dailyReward: '0.1 BNB',
    difficulty: '高',
    minStake: '100 TLF',
    participants: 100
  }
]

export default function Web3MarketPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeModule, setActiveModule] = useState('nft')
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null)
  const [selectedPool, setSelectedPool] = useState<number | null>(null)

  // NFT筛选和排序选项
  const [nftSort, setNftSort] = useState('latest')
  const [nftFilter, setNftFilter] = useState('all')

  // NFT过滤逻辑
  const filteredNFTs = mockNFTs.filter(nft => {
    if (nftFilter === 'all') return true
    if (nftFilter === 'available') return nft.available
    if (nftFilter === 'sold') return !nft.available
    return true
  })

  const handleNFTClick = (nftId: number) => {
    router.push(`/web3/nft/${nftId}`)
  }

  const renderNFTMarket = () => {
    return (
      <div className={styles.nftMarket}>
        {/* NFT筛选和排序 */}
        <div className={styles.controls}>
          <div className={styles.filters}>
            <button
              className={`${styles.filterButton} ${nftFilter === 'all' ? styles.active : ''}`}
              onClick={() => setNftFilter('all')}
            >
              全部
            </button>
            <button
              className={`${styles.filterButton} ${nftFilter === 'available' ? styles.active : ''}`}
              onClick={() => setNftFilter('available')}
            >
              可购买
            </button>
            <button
              className={`${styles.filterButton} ${nftFilter === 'sold' ? styles.active : ''}`}
              onClick={() => setNftFilter('sold')}
            >
              已售出
            </button>
          </div>
          <div className={styles.sorting}>
            <select
              value={nftSort}
              onChange={(e) => setNftSort(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="latest">最新上架</option>
              <option value="price-asc">价格从低到高</option>
              <option value="price-desc">价格从高到低</option>
            </select>
          </div>
        </div>

        {/* NFT列表 */}
        <div className={styles.nftGrid}>
          {filteredNFTs.map(nft => (
            <div
              key={nft.id}
              className={styles.nftCard}
              onClick={() => handleNFTClick(nft.id)}
            >
              <div className={styles.nftImageWrapper}>
                <Image
                  src={nft.image}
                  alt={nft.title}
                  width={300}
                  height={300}
                  className={styles.nftImage}
                />
                <div className={styles.nftStatus}>
                  <span className={`${styles.statusBadge} ${nft.available ? styles.available : styles.sold}`}>
                    {nft.available ? '可购买' : '已售出'}
                  </span>
                </div>
              </div>
              <div className={styles.nftInfo}>
                <h3 className={styles.nftTitle}>{nft.title}</h3>
                <p className={styles.nftCreator}>创作者：{nft.creator}</p>
                <div className={styles.nftTags}>
                  {nft.tags.map(tag => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className={styles.nftStats}>
                  <div className={styles.nftPrice}>{nft.price}</div>
                  <div className={styles.nftMeta}>
                    <span>👍 {nft.likes}</span>
                    <span>👀 {nft.views}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderMiningCenter = () => {
    return (
      <div className={styles.miningCenter}>
        <div className={styles.miningStats}>
          <div className={styles.statCard}>
            <h3>总算力</h3>
            <div className={styles.statValue}>1.6 GH/s</div>
            <div className={styles.statLabel}>全网算力</div>
          </div>
          <div className={styles.statCard}>
            <h3>活跃矿工</h3>
            <div className={styles.statValue}>1,800</div>
            <div className={styles.statLabel}>当前在线</div>
          </div>
          <div className={styles.statCard}>
            <h3>24h收益</h3>
            <div className={styles.statValue}>0.16 BNB</div>
            <div className={styles.statLabel}>平均收益</div>
          </div>
        </div>

        <div className={styles.miningPools}>
          {mockPools.map(pool => (
            <div
              key={pool.id}
              className={`${styles.poolCard} ${selectedPool === pool.id ? styles.selected : ''}`}
              onClick={() => setSelectedPool(pool.id)}
            >
              <div className={styles.poolHeader}>
                <span className={styles.poolIcon}>{pool.icon}</span>
                <h3 className={styles.poolName}>{pool.name}</h3>
              </div>
              <p className={styles.poolDescription}>{pool.description}</p>
              <div className={styles.poolStats}>
                <div className={styles.poolStat}>
                  <span className={styles.statLabel}>算力</span>
                  <span className={styles.statValue}>{pool.hashRate}</span>
                </div>
                <div className={styles.poolStat}>
                  <span className={styles.statLabel}>日收益</span>
                  <span className={styles.statValue}>{pool.dailyReward}</span>
                </div>
                <div className={styles.poolStat}>
                  <span className={styles.statLabel}>难度</span>
                  <span className={styles.statValue}>{pool.difficulty}</span>
                </div>
                <div className={styles.poolStat}>
                  <span className={styles.statLabel}>参与人数</span>
                  <span className={styles.statValue}>{pool.participants}</span>
                </div>
              </div>
              <div className={styles.poolRequirements}>
                <span className={styles.requirementsLabel}>最低质押:</span>
                <span className={styles.requirementsValue}>{pool.minStake}</span>
              </div>
              <button className={styles.mineButton}>
                {selectedPool === pool.id ? '开始挖矿' : '选择矿池'}
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Web3市场</h1>
        <p className={styles.subtitle}>探索数字艺术品交易与挖矿新世界</p>
      </div>

      <div className={styles.content}>
        {/* 模块导航 */}
        <div className={styles.moduleNav}>
          <button
            className={`${styles.moduleButton} ${activeModule === 'nft' ? styles.active : ''}`}
            onClick={() => setActiveModule('nft')}
          >
            <FaShoppingCart className={styles.moduleIcon} />
            NFT市场
          </button>
          <button
            className={`${styles.moduleButton} ${activeModule === 'mining' ? styles.active : ''}`}
            onClick={() => setActiveModule('mining')}
          >
            <FaHammer className={styles.moduleIcon} />
            挖矿中心
          </button>
        </div>

        {/* 主内容区域 */}
        <div className={styles.mainContent}>
          {isLoading ? (
            <div className={styles.loading}>
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {activeModule === 'nft' && renderNFTMarket()}
              {activeModule === 'mining' && renderMiningCenter()}
            </>
          )}
        </div>
      </div>
    </div>
  )
} 