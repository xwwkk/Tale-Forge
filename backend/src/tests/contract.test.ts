import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { Contract } from '@ethersproject/contracts'
import { formatEther } from '@ethersproject/units'
import { config } from 'dotenv'
import { resolve } from 'path'

// 加载环境变量
config({ path: resolve(__dirname, '../../.env') })

import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract'

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

async function tryProvider(url: string): Promise<JsonRpcProvider | null> {
  try {
    console.log(`尝试连接到 ${url}...`)
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
    
    console.log(`成功连接到网络:`, {
      url,
      chainId: currentNetwork.chainId,
      name: currentNetwork.name,
      blockNumber
    })
    return provider
  } catch (error: any) {
    console.log(`尝试连接 ${url} 失败:`, error.message || error)
    return null
  }
}

async function main() {
  try {
    console.log('开始测试合约调用...')
    
    // 打印环境变量
    console.log('环境变量:', {
      USE_MAINNET: process.env.USE_MAINNET,
      BSC_TESTNET_RPC_URL: process.env.BSC_TESTNET_RPC_URL,
      BSC_MAINNET_RPC_URL: process.env.BSC_MAINNET_RPC_URL,
      TESTNET_AUTHOR_MANAGER_CONTRACT: process.env.TESTNET_AUTHOR_MANAGER_CONTRACT,
      TESTNET_STORY_MANAGER_CONTRACT: process.env.TESTNET_STORY_MANAGER_CONTRACT
    })
    
    // 1. 测试 Provider 连接
    console.log('尝试连接到网络...')
    const urls = process.env.USE_MAINNET === 'true' 
      ? BSC_PUBLIC_RPC_URLS.mainnet 
      : BSC_PUBLIC_RPC_URLS.testnet

    let provider: JsonRpcProvider | null = null
    
    // 首先尝试已验证的节点
    provider = await tryProvider(urls[0])
    
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

    const network = await provider.getNetwork()
    console.log('当前网络:', {
      chainId: network.chainId,
      name: network.name
    })

    // 2. 测试钱包配置
    const wallet = new Wallet(process.env.SERVER_PRIVATE_KEY!, provider)
    const address = await wallet.getAddress()
    console.log('服务器钱包地址:', address)
    
    const balance = await provider.getBalance(address)
    console.log('钱包余额:', formatEther(balance), 'BNB')

    // 3. 测试合约连接
    console.log('\n测试各合约连接:')
    
    // 3.1 测试 StoryManager
    const storyManager = new Contract(
      CONTRACT_ADDRESS.StoryManager,
      CONTRACT_ABI.StoryManager,
      wallet
    )
    console.log('StoryManager 合约地址:', storyManager.address)
    
    // 3.2 测试 AuthorManager
    const authorManager = new Contract(
      CONTRACT_ADDRESS.AuthorManager,
      CONTRACT_ABI.AuthorManager,
      wallet
    )
    console.log('AuthorManager 合约地址:', authorManager.address)

    // 4. 测试合约调用
    console.log('\n测试合约读取方法:')
    
    // 4.1 测试获取作者作品列表
    const authorStories = await storyManager.getAuthorStories(address)
    console.log('作者作品列表:', authorStories)

    // 4.2 测试获取作者信息
    const authorInfo = await authorManager.authors(address)
    console.log('作者信息:', authorInfo)

    // 4.3 测试获取作品详情
    if (authorStories && authorStories.length > 0) {
      console.log('\n测试获取作品详情:')
      for (const storyId of authorStories) {
        try {
          const story = await storyManager.stories(storyId)
          console.log(`作品 ID ${storyId} 原始数据:`, story)
          
          // 安全地处理数据
          const details = {
            id: storyId.toString(),
            title: story.title || '',
            authorId: story.authorId || '',
            contentHash: story.contentHash || '',
            status: Number(story.status || 0),
            createdAt: story.createdAt ? new Date(story.createdAt.toNumber() * 1000).toISOString() : '',
            lastUpdate: story.lastUpdate ? new Date(story.lastUpdate.toNumber() * 1000).toISOString() : '',
            readCount: (story.readCount || 0).toString(),
            likeCount: (story.likeCount || 0).toString(),
            commentCount: (story.commentCount || 0).toString(),
            rewardAmount: story.rewardAmount ? formatEther(story.rewardAmount) : '0'
          }
          
          console.log(`作品 ID ${storyId} 详情:`, details)
        } catch (error) {
          console.error(`获取作品 ID ${storyId} 详情失败:`, error)
        }
      }
    }

    // 5. 测试 ReaderActivity 合约
    console.log('\n测试 ReaderActivity 合约:')
    
    const readerActivity = new Contract(
      CONTRACT_ADDRESS.ReaderActivityAddress,
      CONTRACT_ABI.ReaderActivityAddress,
      wallet
    )
   
    const testAddress = "0x12167bB3ECeD838AF18539Ca7842Db70d4b58D4E"
    console.log('尝试获取地址的读者信息:', testAddress)
    
    const authorStories1 = await storyManager.getAuthorStories(testAddress)
    console.log('作者作品列表:', authorStories1)

    // 4.2 测试获取作者信息
    const authorInfo1 = await authorManager.authors(testAddress)
    console.log('作者信息:', authorInfo1)


    console.log('ReaderActivity 合约地址:', readerActivity.address)

    const readerInfo = await readerActivity.readers(testAddress)
    console.log('读者信息:', {
      isRegistered: readerInfo.isRegistered,
      readCount: readerInfo.readCount.toString(),
      lastReadTime: new Date(readerInfo.lastReadTime.toNumber() * 1000).toISOString(),
      totalRewards: formatEther(readerInfo.totalRewards)
    })

    console.log('\n所有测试完成')
  } catch (error: any) {
    console.error('测试失败:', error)
    if (error?.reason) {
      console.error('错误原因:', error.reason)
    }
  }
}

// 运行测试
main() 