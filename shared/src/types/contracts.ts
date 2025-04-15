import { ethers } from 'ethers'

export interface ContractAddresses {
  AuthorManager: string
  StoryManager: string
  TaforToken: string
  TreasuryManager: string
  NovelNFT: string
  ReaderActivityAddress: string
  TippingSystemAddress: string
  MiningPool: string
}

export interface ContractAbis {
  AuthorManager: any[]
  StoryManager: any[]
  TaforToken: any[]
  TreasuryManager: any[]
  NovelNFT: any[]
  ReaderActivityAddress: any[]
  TippingSystemAddress: any[]
  MiningPool: any[]
}

export interface Contracts {
  addresses: ContractAddresses
  abis: ContractAbis
} 