'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { FaPen, FaBook, FaChartBar, FaWallet } from 'react-icons/fa'
import WalletRequired from '@/components/web3/WalletRequired'
import styles from './page.module.css'

// 创作中心功能模块
const AUTHOR_MODULES = [
  {
    id: 'write',
    name: '开始创作',
    description: '创作新的故事，发挥你的创意',
    icon: <FaPen />,
    link: '/author/write'
  },
  {
    id: 'works',
    name: '作品管理',
    description: '管理你的作品，查看数据分析',
    icon: <FaBook />,
    link: '/author/works'
  },
  {
    id: 'stats',
    name: '数据分析',
    description: '查看作品表现，了解读者喜好',
    icon: <FaChartBar />,
    link: '/author/stats'
  },
  {
    id: 'earnings',
    name: '收益管理',
    description: '管理你的收益，查看交易记录',
    icon: <FaWallet />,
    link: '/author/earnings'
  }
]

export default function AuthorPage() {
  return (
    <WalletRequired
      title="作者中心"
      description="连接钱包以访问您的作者中心"
      icon={<FaPen className="w-10 h-10 text-indigo-600" />}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>创作中心</h1>
          <p className={styles.subtitle}>在这里开始你的创作之旅</p>
        </div>

        <div className={styles.grid}>
          {AUTHOR_MODULES.map(module => (
            <Link 
              key={module.id}
              href={module.link}
              className={styles.moduleCard}
            >
              <div className={styles.moduleIcon}>
                {module.icon}
              </div>
              <div className={styles.moduleInfo}>
                <h3 className={styles.moduleName}>{module.name}</h3>
                <p className={styles.moduleDescription}>{module.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* 快捷操作区 */}
        <div className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>快捷操作</h2>
          <div className={styles.actionButtons}>
            <Link href="/author/write" className={styles.primaryButton}>
              <FaPen />
              开始写作
            </Link>
            <Link href="/author/works" className={styles.secondaryButton}>
              查看作品
            </Link>
          </div>
        </div>

        {/* 创作数据概览 */}
        <div className={styles.statsOverview}>
          <h2 className={styles.sectionTitle}>创作数据概览</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>12</div>
              <div className={styles.statLabel}>作品总数</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>1.2k</div>
              <div className={styles.statLabel}>总阅读量</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>3.5 BNB</div>
              <div className={styles.statLabel}>总收益</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>89%</div>
              <div className={styles.statLabel}>好评率</div>
            </div>
          </div>
        </div>
      </div>
    </WalletRequired>
  )
} 