'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import styles from './ConnectButton.module.css'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { isMobile } from 'react-device-detect'
import Link from 'next/link'
import { 
  UserCircleIcon, 
  Cog6ToothIcon as SettingsIcon, 
  ArrowRightOnRectangleIcon as DisconnectIcon,
  Square3Stack3DIcon as CollectionIcon,
  PencilSquareIcon as AuthorIcon,
  PencilIcon as WriteIcon
} from '@heroicons/react/24/outline'
import { useAuthorStatus } from '@/hooks/useAuthorStatus'

// 钱包配置
const WALLET_CONFIGS = {
  'MetaMask': {
    icon: '/icons/metamask.svg',
    downloadUrl: 'https://metamask.io/download/',
    description: '最流行的以太坊钱包，支持BSC'
  },
  'WalletConnect': {
    icon: '/icons/walletconnect.svg',
    downloadUrl: 'https://walletconnect.com/registry',
    description: '扫码连接你的手机钱包'
  },
  'Coinbase Wallet': {
    icon: '/icons/coinbase.png',
    downloadUrl: 'https://www.coinbase.com/wallet/downloads',
    description: 'Coinbase官方钱包'
  },
  'Trust Wallet': {
    icon: '/icons/trustwallet.png',
    downloadUrl: 'https://trustwallet.com/download',
    description: '币安官方推荐的去中心化钱包'
  },
  'Binance Wallet': {
    icon: '/icons/binance.png',
    downloadUrl: 'https://www.bnbchain.org/en/binance-wallet',
    description: '币安官方钱包'
  },
  'TokenPocket': {
    icon: '/icons/tokenpocket.png',
    downloadUrl: 'https://www.tokenpocket.pro/en/download/app',
    description: '支持多链的综合钱包'
  },
  'SafePal': {
    icon: '/icons/safepal.png',
    downloadUrl: 'https://safepal.com/download',
    description: '安全易用的去中心化钱包'
  },
  'BitKeep': {
    icon: '/icons/bitkeep.png',
    downloadUrl: 'https://bitkeep.com/download',
    description: '多链支持的综合钱包'
  },
  'OKX Wallet': {
    icon: '/icons/okx.png',
    downloadUrl: 'https://www.okx.com/web3',
    description: 'OKX交易所官方Web3钱包'
  }
}

// 移动端钱包配置
const MOBILE_WALLETS = [
  { 
    name: 'MetaMask', 
    logo: '/icons/metamask.svg', 
    downloadUrl: 'https://metamask.io/download/',
    description: '最流行的以太坊钱包，支持BSC'
  },
  { 
    name: 'WalletConnect', 
    logo: '/icons/walletconnect.svg', 
    downloadUrl: 'https://walletconnect.com/registry',
    description: '扫码连接你的手机钱包'
  },
  { 
    name: 'Trust Wallet', 
    logo: '/icons/trustwallet.svg', 
    downloadUrl: 'https://trustwallet.com/download',
    description: '币安官方推荐的去中心化钱包'
  },
]

// 菜单项配置
const MENU_ITEMS = [
  {
    id: 'profile',
    label: '个人信息',
    icon: UserCircleIcon,
    href: '/profile'
  },
  {
    id: 'write',
    label: '开始创作',
    icon: WriteIcon,
    href: '/author/write'
  }
]

// 作者菜单项
const AUTHOR_MENU_ITEMS = [
  {
    id: 'works',
    label: '我的作品',
    icon: CollectionIcon,
    href: '/author/works'
  }
]

export default function ConnectButton({ className = '' }: { className?: string }) {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { address, isConnected } = useAccount()
  const { connect, connectors, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { isAuthor, loading: authorLoading } = useAuthorStatus()

  // 处理连接错误
  useEffect(() => {
    if (connectError) {
      setError(connectError)
      setIsConnecting(false)
    }
  }, [connectError])

  // 处理组件挂载
  useEffect(() => {
    setMounted(true)
  }, [])

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 处理关闭模态框
  const handleCloseModal = () => {
    if (!isConnecting) {
      setIsWalletModalOpen(false)
      setError(null)
    }
  }

  // 处理断开连接
  const handleDisconnect = () => {
    if (!isConnecting) {
      disconnect()
      setIsProfileMenuOpen(false)
    }
  }

  // 处理连接钱包
  const handleConnect = async (connector: any) => {
    if (isConnecting) return
    
    try {
      setIsConnecting(true)
      await connect({ connector })
      setIsWalletModalOpen(false)
    } catch (err) {
      console.error('Connection failed:', err)
      setError(err as Error)
    } finally {
      setIsConnecting(false)
    }
  }

  // 在页面加载完成前不渲染
  if (!mounted) return null

  // 未连接钱包时显示连接按钮
  if (!isConnected) {
    return (
      <>
        <button
          className={`${styles.connectButton} ${isConnecting ? styles.loading : ''}`}
          onClick={() => !isConnecting && setIsWalletModalOpen(true)}
          disabled={isConnecting}
        >
          {isConnecting ? '连接中...' : '连接钱包'}
        </button>

        {/* 钱包连接模态框 */}
        {isWalletModalOpen && mounted && createPortal(
          <div className={styles.modalOverlay} onClick={handleCloseModal}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>连接钱包</h3>
                <button 
                  className={styles.closeButton}
                  onClick={handleCloseModal}
                  disabled={isConnecting}
                  aria-label="关闭"
                >
                  ×
                </button>
              </div>
              {error && (
                <div className={styles.error}>
                  {error.message}
                </div>
              )}
              <div className={styles.walletList}>
                {isMobile ? (
                  // 移动端钱包列表
                  MOBILE_WALLETS.map(wallet => (
                    <a
                      key={wallet.name}
                      href={wallet.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.walletOption}
                    >
                      <Image
                        src={wallet.logo}
                        alt={wallet.name}
                        width={40}
                        height={40}
                        className="rounded-lg"
                      />
                      <div className={styles.walletInfo}>
                        <div className={styles.walletName}>{wallet.name}</div>
                        <div className={styles.walletDescription}>{wallet.description}</div>
                      </div>
                    </a>
                  ))
                ) : (
                  // 桌面端钱包列表
                  connectors.map((connector) => {
                    const config = WALLET_CONFIGS[connector.name as keyof typeof WALLET_CONFIGS]
                    const isInstalled = connector.ready

                    return (
                      <div
                        key={connector.id}
                        className={styles.walletOption}
                      >
                        {config && (
                          <Image
                            src={config.icon}
                            alt={connector.name}
                            width={40}
                            height={40}
                            className="rounded-lg"
                          />
                        )}
                        <div className={styles.walletInfo}>
                          <div className={styles.walletName}>{connector.name}</div>
                          {!isInstalled && config && (
                            <div className={styles.walletDescription}>
                              未安装 - 
                              <a
                                href={config.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-700"
                                onClick={(e) => e.stopPropagation()}
                              >
                                点击安装
                              </a>
                            </div>
                          )}
                          {isInstalled && config && (
                            <div className={styles.walletDescription}>
                              {config.description}
                            </div>
                          )}
                        </div>
                        {isInstalled && (
                          <button
                            onClick={() => handleConnect(connector)}
                            className="ml-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            disabled={isConnecting}
                          >
                            连接
                          </button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    )
  }

  // 已连接钱包时显示地址和菜单
  return (
    <div className={styles.profileContainer} ref={menuRef}>
      <button
        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
        className={styles.profileButton}
      >
        <span className={styles.address}>
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
        </span>
        <div className={styles.avatar}>
          <Image
            src="/icons/avatar-placeholder.png"
            alt="Avatar"
            width={32}
            height={32}
            className={styles.avatarImage}
          />
        </div>
      </button>

      {isProfileMenuOpen && (
        <div className={styles.profileMenu}>
          <div className={styles.menuHeader}>
            <div className={styles.menuAddress}>
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
            </div>
          </div>
          <div className={styles.menuContent}>
            {/* 个人信息始终显示在最上方 */}
            <Link
              href="/profile"
              className={styles.menuItem}
              onClick={() => setIsProfileMenuOpen(false)}
            >
              <UserCircleIcon className="w-5 h-5" />
              <span>个人信息</span>
            </Link>

            {/* 创作入口，所有用户可见 */}
            <Link
              href="/author/write"
              className={`${styles.menuItem} ${styles.primaryMenuItem}`}
              onClick={() => setIsProfileMenuOpen(false)}
            >
              <WriteIcon className="w-5 h-5" />
              <span>开始创作</span>
            </Link>

            {/* 作者特有功能 */}
            {isAuthor && AUTHOR_MENU_ITEMS.map(item => (
              <Link
                key={item.id}
                href={item.href}
                className={styles.menuItem}
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}

            {/* 非作者显示注册入口 */}
            {!authorLoading && !isAuthor && (
              <Link
                href="/beauthor"
                className={styles.menuItem}
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <AuthorIcon className="w-5 h-5" />
                <span>成为作者</span>
              </Link>
            )}

            {/* 断开连接始终显示在最下方 */}
            <button
              onClick={handleDisconnect}
              className={`${styles.menuItem} ${styles.dangerMenuItem}`}
            >
              <DisconnectIcon className="w-5 h-5" />
              <span>断开连接</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}