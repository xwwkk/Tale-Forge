'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import ConnectButton from './ConnectButton'
import { FiLock } from 'react-icons/fi'

interface WalletRequiredProps {
  children: ReactNode
  title?: string
  description?: string
  icon?: ReactNode
}

export default function WalletRequired({
  children,
  title = '需要连接钱包',
  description = '请连接钱包以访问此功能',
  icon = <FiLock className="w-10 h-10 text-indigo-600" />
}: WalletRequiredProps) {
  const { isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-24">
        <div className="flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full mx-4">
            <div className="mb-6">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
              <p className="text-gray-600 mb-6">{description}</p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
