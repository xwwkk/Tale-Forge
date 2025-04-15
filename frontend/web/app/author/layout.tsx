'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaChevronRight, FaChevronLeft, FaHome, FaPen, FaBook, FaChartBar, FaWallet } from 'react-icons/fa'
import styles from './layout.module.css'

export default function AuthorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  
  // 从本地存储中恢复折叠状态
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState) {
      setCollapsed(savedState === 'true')
    }
  }, [])
  
  // 切换折叠状态
  const toggleSidebar = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', String(newState))
  }

  return (
    <div className={styles.layout}>
      {/* 侧边栏 */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
        <nav className={styles.nav}>
          <button 
            className={styles.toggleButton}
            onClick={toggleSidebar}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label={collapsed ? "展开导航栏" : "折叠导航栏"}
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
            {showTooltip && (
              <div className={styles.buttonTooltip}>
                {collapsed ? "展开导航栏" : "折叠导航栏"}
              </div>
            )}
          </button>
          
          <Link 
            href="/author"
            className={`${styles.navLink} ${pathname === '/author' ? styles.active : ''}`}
          >
            <span className={styles.navIcon}><FaHome /></span>
            <span>创作中心</span>
          </Link>
          <Link 
            href="/author/write"
            className={`${styles.navLink} ${pathname === '/author/write' ? styles.active : ''}`}
          >
            <span className={styles.navIcon}><FaPen /></span>
            <span>开始创作</span>
          </Link>
          <Link 
            href="/author/works"
            className={`${styles.navLink} ${pathname === '/author/works' ? styles.active : ''}`}
          >
            <span className={styles.navIcon}><FaBook /></span>
            <span>作品管理</span>
          </Link>
          <Link 
            href="/author/stats"
            className={`${styles.navLink} ${pathname === '/author/stats' ? styles.active : ''}`}
          >
            <span className={styles.navIcon}><FaChartBar /></span>
            <span>数据分析</span>
          </Link>
          <Link 
            href="/author/earnings"
            className={`${styles.navLink} ${pathname === '/author/earnings' ? styles.active : ''}`}
          >
            <span className={styles.navIcon}><FaWallet /></span>
            <span>收益管理</span>
          </Link>
        </nav>
      </aside>

      {/* 主要内容区域 */}
      <main className={`${styles.main} ${collapsed ? styles.collapsed : ''}`}>
        {children}
      </main>
    </div>
  )
} 