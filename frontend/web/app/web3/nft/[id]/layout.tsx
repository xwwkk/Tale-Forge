import { Toaster } from 'react-hot-toast'

export default function NFTDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Toaster position="top-center" />
    </>
  )
} 