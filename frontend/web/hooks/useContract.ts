// 需要安装 wagmi 依赖
// pnpm add wagmi viem @wagmi/core

// 修改导入，因为 StoryManager__factory 还未生成
import { useContractRead, useWalletClient, usePublicClient } from 'wagmi'  // 更新导入
import { CONTRACT_ABIS, CONTRACT_ADDRESSES } from '@/constants/contracts'

export function useStoryManagerContract() {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  
  return useContractRead({
    address: CONTRACT_ADDRESSES.StoryManager as `0x${string}`,
    abi: CONTRACT_ABIS.StoryManager,
  })
} 