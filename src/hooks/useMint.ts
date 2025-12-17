'use client'

import { useState } from 'react'
import { useW3PK } from '@/context/W3PK'
import { toaster } from '@/components/ui/toaster'

export function useMint() {
  const [isMinting, setIsMinting] = useState(false)
  const { isAuthenticated, getAddress } = useW3PK()

  const mint = async () => {
    if (!isAuthenticated) {
      toaster.create({
        title: 'Authentication Required',
        description: 'Please log in to mint an AlphaTester NFT',
        type: 'error',
        duration: 5000,
      })
      return
    }

    try {
      setIsMinting(true)

      // Get the user's address
      const userAddress = await getAddress('STANDARD', 'MAIN')

      // Call the API route to mint the NFT via relayer
      const response = await fetch('/api/mint-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle "already minted" case specially
        if (data.error === 'Already minted') {
          toaster.create({
            title: 'Already minted',
            description: "You're already a member, thanks again for testing!",
            type: 'error',
            duration: 7000,
          })
          return
        }
        throw new Error(data.error || 'Failed to mint NFT')
      }

      toaster.create({
        title: 'Done!',
        description: `NFT minted! Transaction: ${data.txHash.substring(0, 10)}...`,
        type: 'success',
        duration: 10000,
      })

      return data
    } catch (error) {
      console.error('Failed to mint AlphaTester NFT:', error)

      let errorMessage = 'Failed to mint AlphaTester NFT'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toaster.create({
        title: 'Minting Failed',
        description: errorMessage,
        type: 'error',
        duration: 7000,
      })

      throw error
    } finally {
      setIsMinting(false)
    }
  }

  return {
    mint,
    isMinting,
  }
}
