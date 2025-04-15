'use client'
import React, { useState, useEffect, useRef } from 'react'
import { default as Link } from 'next/link'
import Image from 'next/image'
import { useAuthorStatus } from '@/hooks/useAuthorStatus'
import ConnectButton from '@/components/web3/ConnectButton'
import styles from './Header.module.css'
import { usePathname, useRouter } from 'next/navigation'
import { useAccount, useDisconnect } from 'wagmi'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

// 默认图片
const DEFAULT_LOGO = '/logo.png'
const DEFAULT_AVATAR = '/default-avatar.png'

export function Header() {
  const { isAuthor } = useAuthorStatus()
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [logoSrc, setLogoSrc] = useState('/data/logo.jpeg')
  const [avatarSrc, setAvatarSrc] = useState('/default-avatar.png')
  const [isLoaded, setIsLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const userMenuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  
  // 检查是否在阅读页面
  const isReadingPage = pathname?.includes('/stories/') && pathname?.includes('/read')
  const shouldShowNav = !isReadingPage

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  // 点击外部关闭用户菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 图片加载错误处理
  const handleLogoError = () => {
    setLogoSrc(DEFAULT_LOGO)
  }

  const handleAvatarError = () => {
    setAvatarSrc(DEFAULT_AVATAR)
  }

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // 处理登出
  const handleLogout = async () => {
    try {
      await disconnect()
      setIsUserMenuOpen(false)
      // TODO: 清除其他用户状态
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (!isLoaded) {
    return null
  }

  return (
    <header className={`${styles.header} ${isReadingPage ? styles.headerReading : ''}`}>
      {shouldShowNav && (
        <>
          {/* 主导航栏 */}
          <div className={styles.mainNav}>
            <div className={styles.container}>
              <div className={styles.flexBetween}>
                {/* 左侧Logo和导航菜单 */}
                <div className={styles.leftSection}>
                  <div className={styles.logoWrapper}>
                    <Link href="/" className={styles.logo}>
                      <Image 
                        src={logoSrc} 
                        alt="TaleForge" 
                        width={60} 
                        height={60} 
                        onError={handleLogoError}
                        priority
                      />
                      <span className={styles.logoText}>NovelForge</span>
                    </Link>
                  </div>
                  
                  {/* 桌面端导航菜单 */}
                  <nav className={styles.desktopMenu}>
                    <Link 
                      href="/" 
                      className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}
                    >
                      首页
                    </Link>
                    <Link 
                      href="/stories" 
                      className={`${styles.navLink} ${pathname === '/stories' ? styles.active : ''}`}
                    >
                      作品
                    </Link>
                    <Link 
                      href="/ranking" 
                      className={`${styles.navLink} ${pathname === '/ranking' ? styles.active : ''}`}
                    >
                      榜单中心
                    </Link>
                    <Link 
                      href="/web3" 
                      className={`${styles.navLink} ${pathname === '/web3' ? styles.active : ''}`}
                    >
                      Web3市场
                    </Link>
                    <Link 
                      href="/space" 
                      className={`${styles.navLink} ${pathname === '/space' ? styles.active : ''}`}
                    >
                      我的空间
                    </Link>
                    {isAuthor && (
                      <Link 
                        href="/author/works" 
                        className={`${styles.navLink} ${pathname.startsWith('/author') ? styles.active : ''}`}
                      >
                        创作中心
                      </Link>
                    )}
                  </nav>
                </div>

                {/* 中间标语 */}
                <div className={styles.slogan}>
                  WEB3故事铸造我们想象的世界
                </div>

                {/* 右侧用户中心和钱包 */}
                <div className={styles.rightSection}>
                  <ConnectButton className={styles.connectButton} />
                </div>
              </div>
            </div>
          </div>

          {/* 移动端导航菜单 */}
          {isMobileMenuOpen && (
            <div className={styles.mobileMenu}>
              {/* 移动端搜索栏 */}
              <form onSubmit={handleSearch} className={styles.mobileSearchBar}>
                <div className="relative group">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索作品、作者或标签..."
                    className="w-full pl-12 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 
                             rounded-full outline-none transition-all duration-300
                             group-hover:bg-white group-hover:border-gray-300
                             focus:bg-white focus:border-blue-500 focus:ring-2 
                             focus:ring-blue-500/20"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400
                                group-hover:text-gray-500">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  </div>
                  
                  {/* 搜索建议 - 当输入时显示 */}
                  {searchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg 
                                  shadow-lg border border-gray-100 overflow-hidden">
                      <div className="p-2">
                        <div className="text-xs text-gray-500 px-2 py-1">热门搜索</div>
                        {['玄幻', '修真', '都市', '完结精品', '新书力荐'].map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              setSearchQuery(tag)
                              router.push(`/search?q=${encodeURIComponent(tag)}`)
                            }}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-700
                                     hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <div className="flex items-center">
                              <MagnifyingGlassIcon className="w-4 h-4 mr-2 text-gray-400" />
                              {tag}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </form>
              <Link 
                href="/" 
                className={`${styles.mobileNavLink} ${pathname === '/' ? styles.active : ''}`}
              >
                首页
              </Link>
              <Link 
                href="/stories" 
                className={`${styles.mobileNavLink} ${pathname === '/stories' ? styles.active : ''}`}
              >
                作品
              </Link>
              <Link 
                href="/ranking" 
                className={`${styles.mobileNavLink} ${pathname === '/ranking' ? styles.active : ''}`}
              >
                榜单中心
              </Link>
              <Link 
                href="/web3" 
                className={`${styles.mobileNavLink} ${pathname === '/web3' ? styles.active : ''}`}
              >
                Web3市场
              </Link>
              <Link 
                href="/space" 
                className={`${styles.mobileNavLink} ${pathname === '/space' ? styles.active : ''}`}
              >
                我的空间
              </Link>
              {isAuthor && (
                <Link 
                  href="/author/works" 
                  className={`${styles.mobileNavLink} ${pathname.startsWith('/author') ? styles.active : ''}`}
                >
                  创作中心
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {/* 子导航栏 - 在阅读页面不显示 */}
      {!isReadingPage && (
        <div className={styles.subNav}>
          <div className={styles.container}>
            <div className={styles.flexBetween}>
              <nav className={styles.categoryMenu}>
                <Link href="/category/科幻" className={styles.categoryLink}>科幻</Link>
                <Link href="/category/奇幻" className={styles.categoryLink}>奇幻</Link>
                <Link href="/category/都市" className={styles.categoryLink}>都市</Link>
                <Link href="/category/武侠" className={styles.categoryLink}>武侠</Link>
                <Link href="/category/历史" className={styles.categoryLink}>历史</Link>
              </nav>
              <form onSubmit={handleSearch} className={styles.searchBar}>
                <div className="relative group">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索作品、作者或标签..."
                    className="w-full pl-12 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 
                             rounded-full outline-none transition-all duration-300
                             group-hover:bg-white group-hover:border-gray-300
                             focus:bg-white focus:border-blue-500 focus:ring-2 
                             focus:ring-blue-500/20"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400
                                group-hover:text-gray-500">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  </div>
                  
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 
                                                  bg-blue-600 hover:bg-blue-700 text-white
                                                  px-4 py-1.5 rounded-full text-sm font-medium
                                                  transition-all duration-300 flex items-center gap-2">
                    <MagnifyingGlassIcon className="w-4 h-4" />
                    搜索
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  )
} 