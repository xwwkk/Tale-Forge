import { useAccount } from 'wagmi'
import { useContractRead } from 'wagmi'
import { CONTRACT_ABIS, CONTRACT_ADDRESSES } from '@/constants/abi'

export function useAuthorStatus() {
  const { address } = useAccount()

  const { data: authorData, isLoading } = useContractRead({
    address: CONTRACT_ADDRESSES.AuthorManager as `0x${string}`,
    abi: CONTRACT_ABIS.AuthorManager,
    functionName: 'getAuthor',
    args: [address],
    enabled: !!address,
  })

  return {
    isAuthor: authorData?.isAuthor || false,
    authorName: authorData?.penName || '',
    isLoading
  }
} 