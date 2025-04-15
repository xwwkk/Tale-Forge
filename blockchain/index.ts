import { ethers } from 'ethers'
import { StoryManager__factory } from './typechain-types'
import type { StoryManager } from './typechain-types'
import { AuthorManager__factory } from './typechain-types'
import { NovelNFT__factory } from './typechain-types'
import { TaforToken__factory } from './typechain-types'
import { MiningPool__factory } from './typechain-types'
import { ReaderActivity__factory } from './typechain-types'
import { TippingSystem__factory } from './typechain-types'
import { TreasuryManager__factory } from './typechain-types'
import { CONTRACT_ADDRESSES } from '../frontend/web/constants/contracts'

import type { 
  AuthorManager,
  NovelNFT,
  TaforToken,
  MiningPool,
  ReaderActivity,
  TippingSystem,
  TreasuryManager
} from './typechain-types'

// 导出类型和工厂
export type { 
  StoryManager, 
  AuthorManager,
  NovelNFT,
  TaforToken,
  MiningPool,
  ReaderActivity,
  TippingSystem,
  TreasuryManager
}

export { 
  StoryManager__factory,
  AuthorManager__factory,
  NovelNFT__factory,
  TaforToken__factory,
  MiningPool__factory,
  ReaderActivity__factory,
  TippingSystem__factory,
  TreasuryManager__factory
}

// 合约交互
export class TaleForgeSDK {
  private provider: ethers.providers.Provider
  private signer?: ethers.Signer
  public readonly storyManager: StoryManager
  public readonly authorManager: AuthorManager
  public readonly novelNFT: NovelNFT
  public readonly taforToken: TaforToken
  public readonly miningPool: MiningPool
  public readonly readerActivity: ReaderActivity
  public readonly tippingSystem: TippingSystem
  public readonly treasuryManager: TreasuryManager

  constructor(provider: ethers.providers.Provider, signer?: ethers.Signer) {
    this.provider = provider
    this.signer = signer
    
    // 初始化合约
    this.storyManager = StoryManager__factory.connect(
      CONTRACT_ADDRESSES.StoryManager,
      this.signer || this.provider
    )
    
    this.authorManager = AuthorManager__factory.connect(
      CONTRACT_ADDRESSES.AuthorManager,
      this.signer || this.provider
    )
    
    this.novelNFT = NovelNFT__factory.connect(
      CONTRACT_ADDRESSES.NovelNFT,
      this.signer || this.provider
    )
    
    this.taforToken = TaforToken__factory.connect(
      CONTRACT_ADDRESSES.TaforToken,
      this.signer || this.provider
    )
    
    this.miningPool = MiningPool__factory.connect(
      CONTRACT_ADDRESSES.MiningPool,
      this.signer || this.provider
    )
    
    this.readerActivity = ReaderActivity__factory.connect(
      CONTRACT_ADDRESSES.ReaderActivityAddress,
      this.signer || this.provider
    )
    
    this.tippingSystem = TippingSystem__factory.connect(
      CONTRACT_ADDRESSES.TippingSystemAddress,
      this.signer || this.provider
    )
    
    this.treasuryManager = TreasuryManager__factory.connect(
      CONTRACT_ADDRESSES.TreasuryManager,
      this.signer || this.provider
    )
  }

  // 获取故事列表
  async getStories() {
    return await this.storyManager.getActiveStories()
  }

  // 获取故事详情
  async getStory(storyId: number) {
    return await this.storyManager.getStory(storyId)
  }
}