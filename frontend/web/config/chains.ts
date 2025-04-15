import { bsc, bscTestnet } from 'viem/chains'
import type { Chain } from 'viem'

const bscWithNetwork = {
  ...bsc,
  network: 'bsc'
} as Chain

const bscTestnetWithNetwork = {
  ...bscTestnet,
  network: 'bsc-testnet'
} as Chain

export const defaultChains = [bscWithNetwork, bscTestnetWithNetwork] as const 