import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const {
      walletAddress,
      messageHash,
      signedHash,
      signatureR,
      signatureS,
      publicKeyQx,
      publicKeyQy,
      contractAddress,
      txHash,
      verificationTimestamp,
      contractValid,
      contractInputHash,
      contractReturnedAddress,
      contractChainId,
      contractBlockTimestamp,
    } = await request.json()

    // Validate required fields
    if (
      !walletAddress ||
      !messageHash ||
      !signedHash ||
      !signatureR ||
      !signatureS ||
      !publicKeyQx ||
      !publicKeyQy ||
      !contractAddress ||
      !verificationTimestamp
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      console.error('DATABASE_URL is not configured')
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const sql = neon(databaseUrl)

    // Insert the verification record with on-chain response data
    await sql`
      INSERT INTO eip7951 (
        wallet_address,
        message_hash,
        signed_hash,
        signature_r,
        signature_s,
        public_key_qx,
        public_key_qy,
        contract_address,
        tx_hash,
        verification_timestamp,
        contract_valid,
        contract_input_hash,
        contract_returned_address,
        contract_chain_id,
        contract_block_timestamp
      )
      VALUES (
        ${walletAddress},
        ${messageHash},
        ${signedHash},
        ${signatureR},
        ${signatureS},
        ${publicKeyQx},
        ${publicKeyQy},
        ${contractAddress},
        ${txHash},
        ${verificationTimestamp},
        ${contractValid ?? null},
        ${contractInputHash ?? null},
        ${contractReturnedAddress ?? null},
        ${contractChainId ?? null},
        ${contractBlockTimestamp ?? null}
      )
    `

    return NextResponse.json(
      {
        message: 'EIP-7951 verification recorded successfully',
        data: { walletAddress, verificationTimestamp },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error saving EIP-7951 verification:', error)
    return NextResponse.json(
      {
        error: 'Failed to record verification',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 })
    }

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      console.error('DATABASE_URL is not configured')
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const sql = neon(databaseUrl)

    // Retrieve all verifications for this wallet
    const verifications = await sql`
      SELECT *
      FROM eip7951
      WHERE wallet_address = ${walletAddress}
      ORDER BY verification_timestamp DESC
    `

    return NextResponse.json(
      {
        verifications,
        count: verifications.length,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching EIP-7951 verifications:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch verifications',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
