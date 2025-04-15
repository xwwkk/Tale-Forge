import { JsonRpcProvider, Provider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { Contract } from '@ethersproject/contracts'
import { ABIS } from '@tale-forge/shared'

// 合约 ABI
export const CONTRACT_ABI = {
  AuthorManager: ABIS.AuthorManager,
  StoryManager: ABIS.StoryManager,
  TaforToken: ABIS.TaforToken,
  TreasuryManager: ABIS.TreasuryManager,
  NovelNFT: ABIS.NovelNFT,
  ReaderActivityAddress: ABIS.ReaderActivityAddress,
  TippingSystemAddress: ABIS.TippingSystemAddress,
  MiningPool: ABIS.MiningPool
}

// 合约地址配置
const CONTRACTS = {
  mainnet: {
    AuthorManager: process.env.MAINNET_AUTHOR_MANAGER_CONTRACT || '',
    StoryManager: process.env.MAINNET_STORY_MANAGER_CONTRACT || '',
    TaforToken: process.env.MAINNET_TAFOR_TOKEN_CONTRACT || '',
    TreasuryManager: process.env.MAINNET_TREASURY_MANAGER_CONTRACT || '',
    NovelNFT: process.env.MAINNET_NOVEL_NFT_CONTRACT || '',
    ReaderActivityAddress: process.env.MAINNET_READER_ACTIVITY_ADDRESS_CONTRACT || '',
    TippingSystemAddress: process.env.MAINNET_TIPPING_SYSTEM_ADDRESS_CONTRACT || '',
    MiningPool: process.env.MAINNET_MINING_POOL_CONTRACT || ''
  },
  testnet: {
    AuthorManager: process.env.TESTNET_AUTHOR_MANAGER_CONTRACT || '',
    StoryManager: process.env.TESTNET_STORY_MANAGER_CONTRACT || '',
    TaforToken: process.env.TESTNET_TAFOR_TOKEN_CONTRACT || '',
    TreasuryManager: process.env.TESTNET_TREASURY_MANAGER_CONTRACT || '',
    NovelNFT: process.env.TESTNET_NOVEL_NFT_CONTRACT || '',
    ReaderActivityAddress: process.env.TESTNET_READER_ACTIVITY_ADDRESS_CONTRACT || '',
    TippingSystemAddress: process.env.TESTNET_TIPPING_SYSTEM_ADDRESS_CONTRACT || '',
    MiningPool: process.env.TESTNET_MINING_POOL_CONTRACT || ''
  }
}

// 通过环境变量控制使用主网还是测试网
const isMainnet = process.env.USE_MAINNET === 'true'

// 导出当前网络的合约地址
export const CONTRACT_ADDRESS = isMainnet ? CONTRACTS.mainnet : CONTRACTS.testnet

// BSC 公共 RPC URLs - 按可用性排序
const BSC_PUBLIC_RPC_URLS = {
  testnet: [
    'https://bsc-testnet.publicnode.com',        // 已验证可用
    'https://data-seed-prebsc-1-s1.binance.org:8545',
    'https://data-seed-prebsc-2-s1.binance.org:8545',
    'https://bsc-testnet.nodereal.io/v1/free',
    'https://endpoints.omniatech.io/v1/bsc/testnet/public'
  ],
  mainnet: [
    'https://bsc.publicnode.com',                // 已验证可用
    'https://bsc-dataseed1.binance.org',
    'https://bsc-dataseed2.binance.org',
    'https://bsc-dataseed3.binance.org',
    'https://bsc-dataseed4.binance.org'
  ]
}

// 尝试连接到指定的 RPC 节点
async function tryProvider(url: string): Promise<JsonRpcProvider | null> {
  try {
    console.log(`[contract.tryProvider] 尝试连接到 ${url}...`)
    const network = process.env.USE_MAINNET === 'true' ? {
      name: 'bsc',
      chainId: 56
    } : {
      name: 'bsc-testnet',
      chainId: 97
    }
    
    const provider = new JsonRpcProvider(url, network)
    const currentNetwork = await provider.getNetwork()
    const blockNumber = await provider.getBlockNumber()
    
    console.log(`[contract.tryProvider] 成功连接到网络:`, {
      url,
      chainId: currentNetwork.chainId,
      name: currentNetwork.name,
      blockNumber
    })
    return provider
  } catch (error: any) {
    console.log(`[contract.tryProvider] 尝试连接 ${url} 失败:`, error.message || error)
    return null
  }
}

// 获取可用的 provider
export async function getProvider(): Promise<JsonRpcProvider> {
  console.log('[contract.getProvider] 开始获取 provider...')
  
  const urls = process.env.USE_MAINNET === 'true' 
    ? BSC_PUBLIC_RPC_URLS.mainnet 
    : BSC_PUBLIC_RPC_URLS.testnet

  // 首先尝试已验证的节点
  let provider = await tryProvider(urls[0])
  
  // 如果失败，尝试其他节点
  if (!provider) {
    for (let i = 1; i < urls.length; i++) {
      provider = await tryProvider(urls[i])
      if (provider) break
    }
  }

  if (!provider) {
    throw new Error('无法连接到任何可用的 RPC 节点')
  }

  return provider
}

// 合约实例获取
export const getContract = (
  address: string,
  abi: any[],
  provider: Provider
) => {
  if (!address) {
    throw new Error('Contract address not configured')
  }
  return new Contract(address, abi, provider)
}

// 获取带签名的合约实例（用于写操作）
export const getContractWithSigner = (
  address: string,
  abi: any[],
  provider: Provider
) => {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('Private key not configured')
  }
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider)
  return new Contract(address, abi, wallet)
}

