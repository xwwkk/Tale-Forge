import { ethers } from 'ethers'
import { ReaderActivity__factory } from '@/blockchain'
import { CONTRACT_ADDRESSES } from '@/constants/contracts'

/***用途：提供合约交互的工具函数
    内容：包含 getProvider、getSigner、getContract 等工具函数
*/



// 使用网络切换机制的合约地址
export const CONTRACT_ADDRESSES_MAP = {
  ReaderActivity: CONTRACT_ADDRESSES.ReaderActivityAddress,
  StoryManager: CONTRACT_ADDRESSES.StoryManager,
  // ... 其他合约地址
}

// 获取Provider
export const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum)
  }
  // 对于服务器端，使用RPC Provider
  return new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
}

// 获取Signer
export const getSigner = async () => {
  const provider = getProvider()
  if (provider instanceof ethers.providers.Web3Provider) {
    return await provider.getSigner()
  }
  throw new Error('No signer available')
}

// 获取合约实例
export const getContract = async <T extends { connect: any }>(
  factory: { connect: (address: string, signerOrProvider: any) => T; name: string },
  useSigner = true
) => {
  const contractAddress = CONTRACT_ADDRESSES_MAP[factory.name.replace('__factory', '') as keyof typeof CONTRACT_ADDRESSES_MAP]
  if (!contractAddress) {
    throw new Error(`Contract address not found for ${factory.name}`)
  }

  if (useSigner) {
    const signer = await getSigner()
    return factory.connect(contractAddress, signer)
  }

  const provider = getProvider()
  return factory.connect(contractAddress, provider)
}

// 获取钱包地址
export const getWalletAddress = async (): Promise<string> => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not installed')
  }

  const accounts = await window.ethereum.request({ 
    method: 'eth_requestAccounts' 
  })
  
  return accounts[0]
} 