'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FaEthereum, FaWallet } from 'react-icons/fa'
import { useAccount, useContractWrite, useWaitForTransaction, useBalance } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'react-hot-toast'
import ConnectButton from '@/components/web3/ConnectButton'
import { PurchaseModal } from '@/components/web3/PurchaseModal'
import styles from './page.module.css'

// NFT市场合约ABI
const NFT_MARKET_ABI = [
  {
    name: 'purchaseNFT',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: []
  }
] as const

// NFT市场合约地址
const NFT_MARKET_ADDRESS = '0x...' // TODO: 替换为实际的合约地址

// 模拟NFT数据
const mockNFT = {
  id: 1,
  title: '数字艺术品 #001',
  image: `https://picsum.photos/800/800?random=1`,
  creator: '创作者A',
  description: '这是一件独特的数字艺术品，融合了现代艺术和区块链技术。作品采用了独特的创作手法，展现了艺术家对未来世界的想象。',
  price: '0.5',
  available: true,
  tags: ['艺术', '限量', '首发'],
  likes: 120,
  views: 1500,
  createdAt: '2024-01-15'
}

export default function NFTDetailPage({ params }: { params: { id: string } }) {
  const { address } = useAccount()
  const [isPending, setIsPending] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  // 获取用户余额
  const { data: balance } = useBalance({
    address,
  })

  // 购买NFT的合约调用
  const { write: purchaseNFT, data: purchaseData } = useContractWrite({
    address: NFT_MARKET_ADDRESS,
    abi: NFT_MARKET_ABI,
    functionName: 'purchaseNFT',
  })

  // 监听交易状态
  const { isLoading: isTransactionPending } = useWaitForTransaction({
    hash: purchaseData?.hash,
    onSuccess() {
      setIsPending(false)
      setShowPurchaseModal(false)
      toast.success('NFT 购买成功！')
    },
    onError(error) {
      setIsPending(false)
      setShowPurchaseModal(false)
      toast.error('交易失败：' + error.message)
    }
  })

  // 处理购买操作
  const handlePurchase = async () => {
    if (!address) return
    
    try {
      setIsPending(true)
      
      // 检查余额是否足够
      const price = parseEther(mockNFT.price)
      if (balance && balance.value < price) {
        toast.error('余额不足')
        setIsPending(false)
        return
      }
      
      // 调用合约的购买方法
      purchaseNFT({
        args: [BigInt(params.id)],
        value: price
      })
    } catch (error) {
      console.error('Purchase failed:', error)
      toast.error('购买失败，请重试')
      setIsPending(false)
    }
  }

  // 获取按钮状态和文本
  const getButtonState = () => {
    if (!address) {
      return {
        component: <ConnectButton className={styles.purchaseButton} />,
        disabled: true
      }
    }

    if (!mockNFT.available) {
      return {
        text: '已售出',
        disabled: true
      }
    }

    if (isPending || isTransactionPending) {
      return {
        text: '交易处理中...',
        disabled: true
      }
    }

    if (balance && balance.value < parseEther(mockNFT.price)) {
      return {
        text: '余额不足',
        disabled: true
      }
    }

    return {
      text: '立即购买',
      disabled: false
    }
  }

  const buttonState = getButtonState()

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.imageSection}>
          <div className={styles.imageWrapper}>
            <Image
              src={mockNFT.image}
              alt={mockNFT.title}
              fill
              className={styles.image}
              priority
            />
          </div>
        </div>

        <div className={styles.infoSection}>
          <span className={`${styles.status} ${mockNFT.available ? styles.available : styles.sold}`}>
            {mockNFT.available ? '可购买' : '已售出'}
          </span>

          <h1 className={styles.title}>{mockNFT.title}</h1>

          <div className={styles.creator}>
            <div className={styles.creatorAvatar}>
              {mockNFT.creator.slice(0, 2)}
            </div>
            <div className={styles.creatorInfo}>
              <span className={styles.creatorLabel}>创作者</span>
              <span className={styles.creatorName}>
                {mockNFT.creator}
                <div className={styles.verifiedBadge} title="已认证创作者">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="#3b82f6">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                </div>
              </span>
            </div>
          </div>

          <p className={styles.description}>{mockNFT.description}</p>

          <div className={styles.tags}>
            {mockNFT.tags.map(tag => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statLabel}>收藏</div>
              <div className={styles.statValue}>{mockNFT.likes}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>浏览</div>
              <div className={styles.statValue}>{mockNFT.views}</div>
            </div>
          </div>

          <div className={styles.priceSection}>
            <div className={styles.priceLabel}>当前价格</div>
            <div className={styles.price}>
              <FaEthereum />
              {mockNFT.price} BNB
            </div>

            {buttonState.component || (
              <button
                className={styles.purchaseButton}
                onClick={() => setShowPurchaseModal(true)}
                disabled={buttonState.disabled}
              >
                <FaWallet />
                {buttonState.text}
              </button>
            )}
          </div>
        </div>
      </div>
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        tokenId={mockNFT.id}
        price={mockNFT.price}
        isPending={isPending || isTransactionPending}
      />
    </div>
  )
}