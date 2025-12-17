import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

const ALPHATESTER_CONTRACT_ADDRESS = '0x319503520456Fac47a18879d05A56f919f67ffa5'
const OP_MAINNET_RPC = 'https://mainnet.optimism.io'

// Minimal ABI for safeMint and balanceOf functions
const ALPHATESTER_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
    ],
    name: 'safeMint',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

export async function POST(request: NextRequest) {
  try {
    const { userAddress } = await request.json()

    // Validate user address
    if (!userAddress) {
      return NextResponse.json({ error: 'User address is required' }, { status: 400 })
    }

    // Validate address format
    if (!ethers.isAddress(userAddress)) {
      return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400 })
    }

    // Get relayer private key from environment
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY
    if (!relayerPrivateKey) {
      console.error('RELAYER_PRIVATE_KEY is not configured')
      return NextResponse.json({ error: 'Relayer configuration error' }, { status: 500 })
    }

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(OP_MAINNET_RPC)
    const relayerWallet = new ethers.Wallet(relayerPrivateKey, provider)

    // Connect to the contract
    const contract = new ethers.Contract(
      ALPHATESTER_CONTRACT_ADDRESS,
      ALPHATESTER_ABI,
      relayerWallet
    )

    // Check if user already owns an NFT
    const balance = await contract.balanceOf(userAddress)
    if (balance >= 1n) {
      return NextResponse.json(
        {
          error: 'Already minted',
          message: "You're already a member, thanks again for testing!",
        },
        { status: 400 }
      )
    }

    // Call safeMint function
    console.log(`Minting NFT for address: ${userAddress}`)
    const tx = await contract.safeMint(userAddress)

    console.log(`Transaction submitted: ${tx.hash}`)

    // Wait for transaction confirmation
    const receipt = await tx.wait()

    console.log(`Transaction confirmed in block ${receipt.blockNumber}`)

    return NextResponse.json(
      {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        userAddress,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error minting NFT:', error)

    // Parse error message for better user feedback
    let errorMessage = 'Failed to mint NFT'
    if (error.message) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}
