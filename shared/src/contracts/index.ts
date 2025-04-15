import AuthorManagerABI from './abis/AuthorManager.json'
import StoryManagerABI from './abis/StoryManager.json'
import TaforTokenABI from './abis/TaforToken.json'
import TreasuryManagerABI from './abis/TreasuryManager.json'
import NovelNFTABI from './abis/NovelNFT.json'
import ReaderActivityABI from './abis/ReaderActivity.json'
import TippingSystemABI from './abis/TippingSystem.json'
import MiningPoolABI from './abis/MiningPool.json'
import { ContractAbis, ContractAddresses } from '../types/contracts'

export const CONTRACT_ADDRESSES: ContractAddresses = {
  AuthorManager: process.env.NEXT_PUBLIC_AUTHOR_MANAGER_ADDRESS || '',
  StoryManager: process.env.NEXT_PUBLIC_STORY_MANAGER_ADDRESS || '',
  TaforToken: process.env.NEXT_PUBLIC_TAFOR_TOKEN_ADDRESS || '',
  TreasuryManager: process.env.NEXT_PUBLIC_TREASURY_MANAGER_ADDRESS || '',
  NovelNFT: process.env.NEXT_PUBLIC_NOVEL_NFT_ADDRESS || '',
  ReaderActivityAddress: process.env.NEXT_PUBLIC_READER_ACTIVITY_ADDRESS || '',
  TippingSystemAddress: process.env.NEXT_PUBLIC_TIPPING_SYSTEM_ADDRESS || '',
  MiningPool: process.env.NEXT_PUBLIC_MINING_POOL_ADDRESS || ''
}

export const ABIS: ContractAbis = {
  AuthorManager: AuthorManagerABI.abi,
  StoryManager: StoryManagerABI.abi,
  TaforToken: TaforTokenABI.abi,
  TreasuryManager: TreasuryManagerABI.abi,
  NovelNFT: NovelNFTABI.abi,
  ReaderActivityAddress: ReaderActivityABI.abi,
  TippingSystemAddress: TippingSystemABI.abi,
  MiningPool: MiningPoolABI.abi
}

export * from '../types/contracts' 