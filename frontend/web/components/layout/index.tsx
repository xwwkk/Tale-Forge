'use client'

import { Header } from './Header'
import Footer from './Footer'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  )
}