import { configureChains, createConfig } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [bscTestnet, bsc],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: chain.id === bscTestnet.id 
          ? process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545'
          : chain.rpcUrls.default.http[0],
      }),
    }),
    publicProvider(),
  ]
)

// 检测不同的钱包提供者
const checkInjectedProvider = (ethereum: any, name: string) => {
  if (!ethereum?.providers && !ethereum) return false

  let provider
  if (ethereum?.providers) {
    // 多个提供者情况
    switch (name) {
      case 'Trust Wallet':
        provider = ethereum.providers.find((p: any) => p.isTrust)
        break
      case 'Binance Wallet':
        provider = ethereum.providers.find((p: any) => p.isBinance)
        break
      case 'TokenPocket':
        provider = ethereum.providers.find((p: any) => p.isTokenPocket)
        break
      case 'SafePal':
        provider = ethereum.providers.find((p: any) => p.isSafePal)
        break
      case 'BitKeep':
        provider = ethereum.providers.find((p: any) => p.isBitKeep)
        break
      case 'OKX Wallet':
        provider = ethereum.providers.find((p: any) => p.isOKX)
        break
    }
  } else {
    // 单个提供者情况
    provider = ethereum
    switch (name) {
      case 'Trust Wallet':
        if (!provider.isTrust) return false
        break
      case 'Binance Wallet':
        if (!provider.isBinance) return false
        break
      case 'TokenPocket':
        if (!provider.isTokenPocket) return false
        break
      case 'SafePal':
        if (!provider.isSafePal) return false
        break
      case 'BitKeep':
        if (!provider.isBitKeep) return false
        break
      case 'OKX Wallet':
        if (!provider.isOKX) return false
        break
    }
  }
  return !!provider
}

const createInjectedConnector = (name: string) => {
  return new InjectedConnector({
    chains,
    options: {
      name,
      shimDisconnect: true,
      getProvider: () => {
        if (typeof window === 'undefined') return undefined
        const { ethereum } = window as any
        if (!ethereum) return undefined
        return checkInjectedProvider(ethereum, name) ? ethereum : undefined
      }
    },
  })
}

// Set up wagmi config
export const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ 
      chains,
      options: {
        shimDisconnect: true,
        UNSTABLE_shimOnConnectSelectAccount: true,
        shimChainChangedDisconnect: false
      }
    }),
    createInjectedConnector('Trust Wallet'),
    createInjectedConnector('Binance Wallet'),
    createInjectedConnector('TokenPocket'),
    createInjectedConnector('SafePal'),
    createInjectedConnector('BitKeep'),
    createInjectedConnector('OKX Wallet'),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID_HERE',
        metadata: {
          name: 'Tale Forge',
          description: '基于区块链的去中心化小说平台',
          url: 'https://tale-forge.com',
          icons: ['https://tale-forge.com/logo.png']
        },
        showQrModal: true,
        qrModalOptions: {
          themeMode: 'light'
        },
        relayUrl: 'wss://relay.walletconnect.org'
      }
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'Tale Forge',
        headlessMode: true
      }
    })
  ],
  publicClient,
  webSocketPublicClient
})

export { chains }
