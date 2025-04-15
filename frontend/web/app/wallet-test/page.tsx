'use client'

import { useAccount } from 'wagmi'
import WalletRequired from '@/components/web3/WalletRequired'
import { FaWallet } from 'react-icons/fa'

export default function WalletTest() {
  const { address } = useAccount()

  return (
    <WalletRequired
      title="钱包连接测试"
      description="连接钱包以测试连接功能"
      icon={<FaWallet className="w-10 h-10 text-indigo-600" />}
    >
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">连接信息</h2>
            <p className="mb-2">
              <span className="font-medium">状态：</span>
              <span className="text-green-600">已连接</span>
            </p>
            <p className="mb-2">
              <span className="font-medium">钱包地址：</span>
              <span className="font-mono">{address}</span>
            </p>
          </div>
        </div>
      </div>
    </WalletRequired>
  )
}
