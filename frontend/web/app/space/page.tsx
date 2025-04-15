'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import styles from './page.module.css'
import dynamic from 'next/dynamic'

// 空间模块类型
const SPACE_MODULES = [
  { id: 'bookshelf', name: '我的书架', icon: '📚' },
  { id: 'history', name: '阅读历史', icon: '📖' },
  { id: 'nft', name: '我的NFT', icon: '🎨' },
  { id: 'transactions', name: '消费记录', icon: '💰' },
  { id: 'settings', name: '个人设置', icon: '⚙️' }
]

function SpacePageContent() {
  const [activeModule, setActiveModule] = useState('bookshelf')
  const [isLoading, setIsLoading] = useState(false)

  // 模拟收藏的作品数据
  const BOOKSHELF_WORKS = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    title: `作品${i + 1}`,
    cover: `https://picsum.photos/300/400?random=${i}`,
    author: `作家${Math.floor(Math.random() * 20) + 1}`,
    lastRead: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString(),
    progress: Math.floor(Math.random() * 100)
  }))

  // 模拟阅读历史数据
  const READING_HISTORY = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    title: `作品${i + 1}`,
    coverCid: Math.random().toString(36).substring(7),
    author: `作家${Math.floor(Math.random() * 20) + 1}`,
    lastRead: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString(),
    duration: Math.floor(Math.random() * 120) + '分钟'
  }))

  // 模拟NFT数据
  const MY_NFTS = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    title: `NFT作品${i + 1}`,
    image: `https://picsum.photos/300/300?random=${i + 20}`,
    creator: `作家${Math.floor(Math.random() * 20) + 1}`,
    purchaseDate: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString(),
    price: (Math.random() * 10).toFixed(2)
  }))

  // 模拟交易记录数据
  const TRANSACTIONS = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    type: Math.random() > 0.5 ? '购买作品' : '购买NFT',
    title: `${Math.random() > 0.5 ? '作品' : 'NFT'}${i + 1}`,
    amount: (Math.random() * 100).toFixed(2),
    date: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString(),
    status: Math.random() > 0.2 ? '成功' : '处理中'
  }))

  const renderContent = () => {
    switch (activeModule) {
      case 'bookshelf':
        return (
          <div className={styles.workGrid}>
            {BOOKSHELF_WORKS.map(work => (
              <Link href={`/stories/${work.id}`} key={work.id} className={styles.workCard}>
                <div className={styles.coverWrapper}>
                  <Image
                    src={work.cover}
                    alt={work.title}
                    width={200}
                    height={267}
                    className={styles.cover}
                  />
                  <div className={styles.progress}>
                    <div 
                      className={styles.progressBar} 
                      style={{ width: `${work.progress}%` }}
                    />
                  </div>
                </div>
                <div className={styles.info}>
                  <h3 className={styles.title}>{work.title}</h3>
                  <p className={styles.author}>{work.author}</p>
                  <p className={styles.lastRead}>上次阅读：{work.lastRead}</p>
                </div>
              </Link>
            ))}
          </div>
        )
      
      case 'history':
        return (
          <div className={styles.historyList}>
            {READING_HISTORY.map(history => (
              <Link href={`/stories/${history.id}`} key={history.id} className={styles.historyItem}>
                <Image
                  src={history.coverCid ? `https://ipfs.io/ipfs/${history.coverCid}` : '/images/story-default-cover.jpg'}
                  alt={history.title}
                  fill
                  className="object-cover"
                />
                <div className={styles.historyInfo}>
                  <h3 className={styles.historyTitle}>{history.title}</h3>
                  <p className={styles.historyAuthor}>{history.author}</p>
                  <p className={styles.historyMeta}>
                    阅读时长：{history.duration} · {history.lastRead}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )
      
      case 'nft':
        return (
          <div className={styles.nftGrid}>
            {MY_NFTS.map(nft => (
              <Link href={`/nft-market/${nft.id}`} key={nft.id} className={styles.nftCard}>
                <div className={styles.nftImageWrapper}>
                  <Image
                    src={nft.image}
                    alt={nft.title}
                    width={200}
                    height={200}
                    className={styles.nftImage}
                  />
                </div>
                <div className={styles.nftInfo}>
                  <h3 className={styles.nftTitle}>{nft.title}</h3>
                  <p className={styles.nftCreator}>创作者：{nft.creator}</p>
                  <p className={styles.nftMeta}>
                    购买日期：{nft.purchaseDate} · {nft.price} BNB
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )
      
      case 'transactions':
        return (
          <div className={styles.transactionList}>
            {TRANSACTIONS.map(transaction => (
              <div key={transaction.id} className={styles.transactionItem}>
                <div className={styles.transactionInfo}>
                  <h3 className={styles.transactionTitle}>{transaction.title}</h3>
                  <p className={styles.transactionType}>{transaction.type}</p>
                  <p className={styles.transactionMeta}>
                    {transaction.date} · {transaction.status}
                  </p>
                </div>
                <div className={styles.transactionAmount}>
                  {transaction.amount} BNB
                </div>
              </div>
            ))}
          </div>
        )
      
      case 'settings':
        return (
          <div className={styles.settings}>
            <div className={styles.settingGroup}>
              <h3 className={styles.settingTitle}>账户设置</h3>
              <div className={styles.settingItem}>
                <label>用户名</label>
                <input type="text" placeholder="设置用户名" />
              </div>
              <div className={styles.settingItem}>
                <label>头像</label>
                <button className={styles.uploadButton}>上传头像</button>
              </div>
            </div>
            <div className={styles.settingGroup}>
              <h3 className={styles.settingTitle}>阅读设置</h3>
              <div className={styles.settingItem}>
                <label>字体大小</label>
                <select>
                  <option>小</option>
                  <option>中</option>
                  <option>大</option>
                </select>
              </div>
              <div className={styles.settingItem}>
                <label>主题</label>
                <select>
                  <option>浅色</option>
                  <option>深色</option>
                  <option>跟随系统</option>
                </select>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>我的空间</h1>
      </div>

      <div className={styles.content}>
        {/* 侧边栏模块导航 */}
        <div className={styles.sidebar}>
          {SPACE_MODULES.map(module => (
            <button
              key={module.id}
              className={`${styles.moduleButton} ${activeModule === module.id ? styles.active : ''}`}
              onClick={() => setActiveModule(module.id)}
            >
              <span className={styles.moduleIcon}>{module.icon}</span>
              {module.name}
            </button>
          ))}
        </div>

        {/* 主内容区域 */}
        <div className={styles.mainContent}>
          {isLoading ? (
            <div className={styles.loading}>
              <LoadingSpinner />
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  )
}

// 使用 dynamic 导入并禁用 SSR
const SpacePage = dynamic(() => Promise.resolve(SpacePageContent), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  )
})

export default SpacePage 