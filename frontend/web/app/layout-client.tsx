'use client'

import Providers from './providers/index'
import Layout from '@/components/layout'
import { Header } from '@/components/layout/Header'
import { Toaster } from 'react-hot-toast'
import { usePathname } from 'next/navigation'

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAgentPage = pathname?.includes('/agent')

  return (
    <>
      <Providers>
        {!isAgentPage && <Header />}
        <Layout>
          {children}
        </Layout>
      </Providers>
      <Toaster position="top-right" />
    </>
  )
}
