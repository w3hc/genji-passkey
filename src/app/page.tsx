'use client'

import { Text, VStack, Box, Heading, SimpleGrid, Link } from '@chakra-ui/react'
import { Button } from '@/components/ui/button'
import { useW3PK, base64UrlToArrayBuffer, base64UrlDecode, extractRS } from '@/context/W3PK'
import { useTranslation } from '@/hooks/useTranslation'
import { useState, useEffect } from 'react'
import { toaster } from '@/components/ui/toaster'

const CONTRACT_ADDRESS = '0x2727e2b70ba497cdb078b1d993594b6dc46d2744'

const shimmerStyles = `
  @keyframes colorWave {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  .shimmer-text {
    background: linear-gradient(120deg, #3182ce 0%, #ffffff 25%, #805ad5 50%, #ffffff 75%, #3182ce 100%);
    background-size: 400% 100%;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: colorWave 10s ease-in-out infinite;
  }
`

export default function Home() {
  const {
    isAuthenticated,
    user,
    login,
    signMessage,
    deriveWallet,
    getAddress,
    getStealthKeys,
    generateStealthAddressFor,
  } = useW3PK()
  const t = useTranslation()
  const [primaryAddress, setPrimaryAddress] = useState<string>('')
  const [mainAddress, setMainAddress] = useState<string>('')
  const [strictAddress, setStrictAddress] = useState<string>('')
  const [openbarAddress, setOpenbarAddress] = useState<string>('')
  const [openbarPrivateKey, setOpenbarPrivateKey] = useState<string>('')
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [isLoadingPrimary, setIsLoadingPrimary] = useState(false)
  const [isLoadingMain, setIsLoadingMain] = useState(false)
  const [isLoadingStrict, setIsLoadingStrict] = useState(false)
  const [isLoadingOpenbar, setIsLoadingOpenbar] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    messageHash: string
    signedHash: string
    signature: { r: string; s: string }
    publicKey: { qx: string; qy: string }
    contractAddress: string
    inputHash?: string
    chainId?: number
    savedToDatabase?: boolean
    timestamp: Date
  } | null>(null)

  // Stealth address state
  const [stealthMetaAddress, setStealthMetaAddress] = useState<string>('')
  const [stealthAddress, setStealthAddress] = useState<string>('')
  const [isLoadingStealth, setIsLoadingStealth] = useState(false)
  const [isGeneratingStealth, setIsGeneratingStealth] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadAddresses = async () => {
      if (!isAuthenticated || !user) {
        return
      }

      try {
        // Load PRIMARY address
        if (!primaryAddress) {
          setIsLoadingPrimary(true)
          const primary = await getAddress('PRIMARY', 'PRIMARY')
          if (cancelled) return
          setPrimaryAddress(primary)
          setIsLoadingPrimary(false)
        }

        // Load MAIN address
        if (!mainAddress) {
          setIsLoadingMain(true)
          const mainWallet = await deriveWallet('STANDARD', 'MAIN')
          if (cancelled) return
          setMainAddress(mainWallet.address)
          setIsLoadingMain(false)
        }

        // Load OPENBAR address
        if (!openbarAddress) {
          setIsLoadingOpenbar(true)
          const openbarWallet = await deriveWallet('YOLO', 'OPENBAR')
          if (cancelled) return
          setOpenbarAddress(openbarWallet.address)
          if (openbarWallet.privateKey) {
            setOpenbarPrivateKey(openbarWallet.privateKey)
          }
          setIsLoadingOpenbar(false)
        }

        // STRICT mode is NOT loaded automatically because it requires
        // fresh authentication each time (no persistent sessions)
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load addresses:', error)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPrimary(false)
          setIsLoadingMain(false)
          setIsLoadingOpenbar(false)
        }
      }
    }

    loadAddresses()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user, mainAddress, openbarAddress, primaryAddress, deriveWallet, getAddress])

  const handleDisplayStrictAddress = async () => {
    setIsLoadingStrict(true)
    try {
      // STRICT mode requires fresh authentication each time
      const strict = await getAddress('STRICT', 'STRICT')
      setStrictAddress(strict)
    } catch (error) {
      console.error('Failed to get STRICT address:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to get address',
        type: 'error',
        duration: 5000,
      })
    } finally {
      setIsLoadingStrict(false)
    }
  }

  const handleSignMessage = async (addressType: string, address: string) => {
    const message = `Sign this message from ${addressType} address: ${address}`

    try {
      // For PRIMARY mode, use WebAuthn signing
      if (addressType === 'PRIMARY') {
        await handleSignMessageWithWebAuthn(message)
      } else {
        // For other modes, use the regular signMessage (mnemonic-based)
        const signature = await signMessage(message)
        if (signature) {
          toaster.create({
            title: 'Message Signed',
            description: `Signature: ${signature.substring(0, 20)}...`,
            type: 'success',
            duration: 5000,
          })
        }
      }
    } catch (error) {
      console.error('Failed to sign message:', error)
    }
  }

  const handleSignMessageWithWebAuthn = async (message: string) => {
    try {
      if (!user) {
        throw new Error('No user found')
      }

      // Hash the message
      const messageHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message))
      const h = '0x' + Buffer.from(messageHash).toString('hex')

      console.log('Message to sign:', message)
      console.log('Message hash:', h)

      // Generate a challenge (use the message hash bytes)
      const challengeBytes = new Uint8Array(Buffer.from(h.slice(2), 'hex'))

      // Get credential ID from user object
      const credentialId = (user as any).credentialId
      if (!credentialId) {
        throw new Error('Credential ID not found in user object')
      }

      // Request WebAuthn signature
      const assertionOptions: PublicKeyCredentialRequestOptions = {
        challenge: challengeBytes,
        rpId: window.location.hostname,
        allowCredentials: [
          {
            id: base64UrlDecode(credentialId),
            type: 'public-key',
            transports: ['internal', 'hybrid', 'usb', 'nfc', 'ble'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      }

      const assertion = (await navigator.credentials.get({
        publicKey: assertionOptions,
      })) as PublicKeyCredential | null

      if (!assertion || !assertion.response) {
        throw new Error('WebAuthn signature failed')
      }

      const response = assertion.response as AuthenticatorAssertionResponse

      // WebAuthn signs: SHA-256(authenticatorData || SHA-256(clientDataJSON))
      const authenticatorData = new Uint8Array(response.authenticatorData)
      const clientDataJSON = new Uint8Array(response.clientDataJSON)
      const clientDataHash = await crypto.subtle.digest('SHA-256', clientDataJSON)

      // Concatenate authenticatorData + clientDataHash
      const signedData = new Uint8Array(authenticatorData.length + clientDataHash.byteLength)
      signedData.set(authenticatorData, 0)
      signedData.set(new Uint8Array(clientDataHash), authenticatorData.length)

      // Hash the concatenation to get what was actually signed
      const actualMessageHash = await crypto.subtle.digest('SHA-256', signedData.buffer)
      const actualH = '0x' + Buffer.from(actualMessageHash).toString('hex')

      // Extract r and s from the DER-encoded signature
      const signature = new Uint8Array(response.signature)
      const { r, s } = extractRS(signature)

      // Format signature in Ethereum-compatible format (r + s + v)
      // For P-256, we use v=0 since there's no recovery ID in WebAuthn signatures
      const v = '00'
      const ethereumSignature = r + s.slice(2) + v

      console.log('WebAuthn signature:')
      console.log('  Original hash:', h)
      console.log('  Signed hash:', actualH)
      console.log('  r:', r)
      console.log('  s:', s)
      console.log('  Ethereum format:', ethereumSignature)

      toaster.create({
        title: 'Message Signed with WebAuthn!',
        description: `Signature: ${ethereumSignature.substring(0, 20)}...`,
        type: 'success',
        duration: 7000,
      })
    } catch (error) {
      console.error('Failed to sign message with WebAuthn:', error)
      toaster.create({
        title: 'Signing Failed',
        description: error instanceof Error ? error.message : 'Failed to sign message',
        type: 'error',
        duration: 5000,
      })
    }
  }

  const handleLoadStealthKeys = async () => {
    setIsLoadingStealth(true)
    try {
      const keys = await getStealthKeys()
      if (keys) {
        const metaAddr = keys.stealthMetaAddress || keys.metaAddress || ''
        setStealthMetaAddress(metaAddr)
        toaster.create({
          title: 'Stealth Keys Loaded',
          description: 'Your stealth meta-address is ready',
          type: 'success',
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Failed to load stealth keys:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to load stealth keys',
        type: 'error',
        duration: 5000,
      })
    } finally {
      setIsLoadingStealth(false)
    }
  }

  const handleGenerateStealthAddress = async () => {
    if (!stealthMetaAddress) {
      toaster.create({
        title: 'No Meta-Address',
        description: 'Please load your stealth keys first',
        type: 'warning',
        duration: 3000,
      })
      return
    }

    setIsGeneratingStealth(true)
    try {
      const result = await generateStealthAddressFor(stealthMetaAddress)
      if (result) {
        setStealthAddress(result.stealthAddress)
        toaster.create({
          title: 'Stealth Address Generated',
          description: 'You can now sign a message with this address',
          type: 'success',
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Failed to generate stealth address:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to generate stealth address',
        type: 'error',
        duration: 5000,
      })
    } finally {
      setIsGeneratingStealth(false)
    }
  }

  const handleSendVerifyP256Tx = async () => {
    try {
      if (!user) {
        throw new Error('No user found')
      }

      // Derive the PRIMARY wallet to get the public key
      const primaryWallet = await deriveWallet('PRIMARY', 'PRIMARY')

      if (!primaryWallet.publicKey) {
        throw new Error('No public key found for PRIMARY wallet')
      }

      // Decode the public key to get x and y coordinates
      const publicKeySpki = primaryWallet.publicKey
      const publicKeyBuffer = base64UrlToArrayBuffer(publicKeySpki)

      // Import the public key
      const publicKey = await crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        true,
        ['verify']
      )

      // Export as JWK to get x and y coordinates
      const jwk = await crypto.subtle.exportKey('jwk', publicKey)

      if (!jwk.x || !jwk.y) {
        throw new Error('Invalid P-256 public key: missing x or y coordinates')
      }

      // Convert base64url x and y to hex (each is 32 bytes for P-256)
      const qx = '0x' + Buffer.from(base64UrlToArrayBuffer(jwk.x)).toString('hex')
      const qy = '0x' + Buffer.from(base64UrlToArrayBuffer(jwk.y)).toString('hex')

      // Create a test message hash
      const testMessage = 'Hello from EIP-7951!'
      const messageHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(testMessage)
      )
      const h = '0x' + Buffer.from(messageHash).toString('hex')

      console.log('Message hash to sign:', h)
      console.log('Public key coordinates:')
      console.log('  qx:', qx)
      console.log('  qy:', qy)

      // Step 1: Sign the message hash with WebAuthn

      // Generate a challenge (use the raw message hash bytes)
      const challengeBytes = new Uint8Array(Buffer.from(h.slice(2), 'hex'))

      // Get credential ID from user object
      const credentialId = (user as any).credentialId
      if (!credentialId) {
        throw new Error('Credential ID not found in user object')
      }

      // Request WebAuthn signature
      const assertionOptions: PublicKeyCredentialRequestOptions = {
        challenge: challengeBytes,
        rpId: window.location.hostname,
        allowCredentials: [
          {
            id: base64UrlDecode(credentialId),
            type: 'public-key',
            transports: ['internal', 'hybrid', 'usb', 'nfc', 'ble'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      }

      const assertion = (await navigator.credentials.get({
        publicKey: assertionOptions,
      })) as PublicKeyCredential | null

      if (!assertion || !assertion.response) {
        throw new Error('WebAuthn signature failed')
      }

      const response = assertion.response as AuthenticatorAssertionResponse

      // WebAuthn signs: SHA-256(authenticatorData || SHA-256(clientDataJSON))
      // We need to reconstruct what was actually signed
      const authenticatorData = new Uint8Array(response.authenticatorData)
      const clientDataJSON = new Uint8Array(response.clientDataJSON)
      const clientDataHash = await crypto.subtle.digest('SHA-256', clientDataJSON)

      // Concatenate authenticatorData + clientDataHash
      const signedData = new Uint8Array(authenticatorData.length + clientDataHash.byteLength)
      signedData.set(authenticatorData, 0)
      signedData.set(new Uint8Array(clientDataHash), authenticatorData.length)

      // Hash the concatenation to get what was actually signed
      const actualMessageHash = await crypto.subtle.digest('SHA-256', signedData.buffer)
      const actualH = '0x' + Buffer.from(actualMessageHash).toString('hex')

      console.log('Original message hash:', h)
      console.log('Actual signed hash (WebAuthn):', actualH)
      console.log('Authenticator data length:', authenticatorData.length)
      console.log('Client data JSON:', new TextDecoder().decode(clientDataJSON))

      // Extract r and s from the DER-encoded signature
      const signature = new Uint8Array(response.signature)
      const { r, s } = extractRS(signature)

      console.log('Signature components:')
      console.log('  r:', r)
      console.log('  s:', s)

      // Import ethers for contract interaction
      const { ethers } = await import('ethers')

      // Use RPC URL for the contract call (read-only)

      const rpcUrl = 'https://ethereum-rpc.publicnode.com'
      const provider = new ethers.JsonRpcProvider(rpcUrl)

      const contractABI = [
        'function verifyP256(bytes32 h, bytes32 r, bytes32 s, bytes32 qx, bytes32 qy) external view returns (tuple(bool valid, bytes32 inputHash, address contractAddress, uint256 chainId, uint256 timestamp))',
      ]

      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider)

      // Call the contract with the actual hash that WebAuthn signed
      const result = await contract.verifyP256(actualH, r, s, qx, qy)

      console.log('Verification parameters sent to contract:')
      console.log('  h (actualH):', actualH)
      console.log('  r:', r)
      console.log('  s:', s)
      console.log('  qx:', qx)
      console.log('  qy:', qy)

      console.log('Contract verification result:', result)

      // Extract values from the returned struct
      const [valid, inputHash, returnedContractAddress, chainId, blockTimestamp] = result

      console.log('Verification proof from contract:')
      console.log('  valid:', valid)
      console.log('  inputHash:', inputHash)
      console.log('  contractAddress:', returnedContractAddress)
      console.log('  chainId:', Number(chainId))
      console.log('  timestamp:', Number(blockTimestamp))

      if (valid) {
        const timestamp = new Date(Number(blockTimestamp) * 1000)

        // Store the verification result with additional contract data
        setVerificationResult({
          success: true,
          messageHash: h,
          signedHash: actualH,
          signature: { r, s },
          publicKey: { qx, qy },
          contractAddress: returnedContractAddress,
          inputHash: inputHash,
          chainId: Number(chainId),
          timestamp,
          savedToDatabase: false,
        })

        toaster.create({
          title: 'Verification Successful!',
          description: 'P-256 signature verified on-chain using EIP-7951 precompile.',
          type: 'success',
          duration: 7000,
        })

        // Save to offchain database
        try {
          const response = await fetch('/api/eip7951', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: primaryAddress,
              messageHash: h,
              signedHash: actualH,
              signatureR: r,
              signatureS: s,
              publicKeyQx: qx,
              publicKeyQy: qy,
              contractAddress: CONTRACT_ADDRESS,
              txHash: null,
              verificationTimestamp: timestamp.toISOString(),
              contractValid: valid,
              contractInputHash: inputHash,
              contractReturnedAddress: returnedContractAddress,
              contractChainId: Number(chainId),
              contractBlockTimestamp: Number(blockTimestamp),
            }),
          })

          if (response.ok) {
            setVerificationResult(prev => (prev ? { ...prev, savedToDatabase: true } : null))
            console.log('✅ EIP-7951 verification saved to database')
          } else {
            const errorData = await response.json()
            console.error('❌ Failed to save to database:', errorData)
            toaster.create({
              title: 'Database Save Failed',
              description: `Could not save verification: ${errorData.error || 'Unknown error'}`,
              type: 'warning',
              duration: 5000,
            })
          }
        } catch (error) {
          console.error('❌ Failed to save verification to database:', error)
          toaster.create({
            title: 'Database Error',
            description: 'Could not connect to database. Please check your connection.',
            type: 'warning',
            duration: 5000,
          })
        }
      } else {
        throw new Error('Signature verification failed on contract')
      }

      console.log('PRIMARY address:', primaryAddress)
      console.log('Contract: 0x5586d2Ab0e2Cbf4e44F36cD7d1A5B544ecb13510')
      console.log('Verification result:', result)
    } catch (error) {
      console.error('Failed to send verifyP256 tx:', error)
      toaster.create({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Failed to send transaction',
        type: 'error',
        duration: 5000,
      })
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmerStyles }} />
      <VStack gap={8} align="stretch" py={20}>
        <Box p={6} borderRadius="md" textAlign="center">
          {isAuthenticated ? (
            <>
              <Heading as="h1" size="xl" mb={4}>
                {t.home.title}
              </Heading>
              <Text mb={6} color="gray.400">
                {t.home.subtitle}
              </Text>
              <Box h="20px" />
            </>
          ) : (
            <>
              <Heading as="h1" size="xl" mb={4}>
                {t.home.greeting}
              </Heading>
              <Text mb={6} color="gray.400">
                {t.home.greetingSubtitle}
              </Text>
              <Text fontSize="sm" color="gray.500">
                <Button
                  variant="plain"
                  as="span"
                  color="gray.500"
                  textDecorationStyle="dotted"
                  textUnderlineOffset="3px"
                  cursor="pointer"
                  _hover={{ color: 'gray.300' }}
                  onClick={login}
                  fontSize="sm"
                >
                  {t.common.pleaseLogin}{' '}
                </Button>
              </Text>
            </>
          )}
        </Box>

        {isAuthenticated && user && (
          <>
            <SimpleGrid columns={{ base: 1, md: 1 }} gap={6}>
              <Box p={6} borderWidth="1px" borderRadius="lg" borderColor="gray.700" bg="gray.900">
                <VStack gap={4} align="stretch">
                  <Heading as="h3" size="md">
                    PRIMARY mode (passkey)
                  </Heading>
                  <Box as="span" fontSize="xl" wordBreak="break-all" className="shimmer-text">
                    {isLoadingPrimary ? 'Loading...' : primaryAddress || 'Not available'}
                  </Box>
                  <Text fontSize="xs" color="gray.500" fontStyle="italic">
                    This wallet is derived from your WebAuthn credential stored in your
                    device&apos;s secure element. There&apos;s simply{' '}
                    <strong>no private key at all</strong>. It&apos;s compliant with EIP-7951 that
                    was introduced in Fusaka upgrade (Dec 3, 2025), meaning you can send a
                    transaction with passkey (fingerprint or face recognition).
                  </Text>
                  <Button
                    bg="brand.accent"
                    color="white"
                    _hover={{ bg: 'brand.accent', opacity: 0.9 }}
                    onClick={() => handleSignMessage('PRIMARY', primaryAddress)}
                    disabled={!primaryAddress || isLoadingPrimary}
                  >
                    Sign a message
                  </Button>
                  <Button
                    bg="blue.600"
                    color="white"
                    _hover={{ bg: 'blue.700' }}
                    onClick={() => handleSendVerifyP256Tx()}
                    disabled={!primaryAddress || isLoadingPrimary}
                  >
                    Verify onchain
                  </Button>

                  {verificationResult && (
                    <Box
                      mt={4}
                      p={4}
                      borderWidth="1px"
                      borderRadius="md"
                      borderColor="green.500"
                      bg="green.900"
                    >
                      <VStack gap={3} align="stretch">
                        <Heading as="h4" size="sm" color="green.300">
                          ✓ Verification Successful
                        </Heading>

                        <Text fontSize="xs" color="gray.400">
                          {verificationResult.timestamp.toLocaleString()}
                        </Text>

                        <Box>
                          <Text fontSize="xs" fontWeight="bold" color="gray.300" mb={1}>
                            Contract Address:
                          </Text>
                          <Link
                            href={`https://etherscan.io/address/${verificationResult.contractAddress}#code`}
                            target="_blank"
                            rel="noopener noreferrer"
                            fontSize="xs"
                            color="blue.400"
                            fontFamily="mono"
                            wordBreak="break-all"
                            textDecoration="underline"
                            _hover={{ color: 'blue.300' }}
                          >
                            {verificationResult.contractAddress}
                          </Link>
                        </Box>

                        <Box>
                          <Text fontSize="xs" fontWeight="bold" color="gray.300" mb={1}>
                            Message Hash:
                          </Text>
                          <Text
                            fontSize="xs"
                            color="gray.400"
                            fontFamily="mono"
                            wordBreak="break-all"
                          >
                            {verificationResult.messageHash}
                          </Text>
                        </Box>

                        <Box>
                          <Text fontSize="xs" fontWeight="bold" color="gray.300" mb={1}>
                            WebAuthn Signed Hash:
                          </Text>
                          <Text
                            fontSize="xs"
                            color="gray.400"
                            fontFamily="mono"
                            wordBreak="break-all"
                          >
                            {verificationResult.signedHash}
                          </Text>
                        </Box>

                        <Box>
                          <Text fontSize="xs" fontWeight="bold" color="gray.300" mb={1}>
                            Signature (r, s):
                          </Text>
                          <Text
                            fontSize="xs"
                            color="gray.400"
                            fontFamily="mono"
                            wordBreak="break-all"
                          >
                            r: {verificationResult.signature.r}
                          </Text>
                          <Text
                            fontSize="xs"
                            color="gray.400"
                            fontFamily="mono"
                            wordBreak="break-all"
                          >
                            s: {verificationResult.signature.s}
                          </Text>
                        </Box>

                        <Box>
                          <Text fontSize="xs" fontWeight="bold" color="gray.300" mb={1}>
                            Public Key (qx, qy):
                          </Text>
                          <Text
                            fontSize="xs"
                            color="gray.400"
                            fontFamily="mono"
                            wordBreak="break-all"
                          >
                            qx: {verificationResult.publicKey.qx}
                          </Text>
                          <Text
                            fontSize="xs"
                            color="gray.400"
                            fontFamily="mono"
                            wordBreak="break-all"
                          >
                            qy: {verificationResult.publicKey.qy}
                          </Text>
                        </Box>

                        {verificationResult.inputHash && (
                          <Box>
                            <Text fontSize="xs" fontWeight="bold" color="gray.300" mb={1}>
                              Input Hash:
                            </Text>
                            <Text
                              fontSize="xs"
                              color="gray.400"
                              fontFamily="mono"
                              wordBreak="break-all"
                            >
                              {verificationResult.inputHash}
                            </Text>
                          </Box>
                        )}

                        {verificationResult.chainId && (
                          <Box>
                            <Text fontSize="xs" fontWeight="bold" color="gray.300" mb={1}>
                              Chain ID:
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                              {verificationResult.chainId}
                            </Text>
                          </Box>
                        )}

                        {verificationResult.savedToDatabase && (
                          <Box
                            p={2}
                            borderRadius="md"
                            bg="green.800"
                            borderWidth="1px"
                            borderColor="green.400"
                          >
                            <Text fontSize="sm" fontWeight="bold" color="green.200">
                              This proves EIP-7951 precompiles are in place on Ethereum Mainnet. We
                              live in a Fusaka world now. You will receive a special NFT in the
                              coming days. Thanks for your patience. Let&apos;s keep improving
                              Ethereum UX! Props to everyone involved in this upgrade!! 🎉🎉🎉
                            </Text>
                          </Box>
                        )}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Box>

              <Box p={6} borderWidth="1px" borderRadius="lg" borderColor="gray.700" bg="gray.900">
                <VStack gap={4} align="stretch">
                  <Heading as="h3" size="md">
                    STRICT mode
                  </Heading>
                  {!strictAddress ? (
                    <Button
                      size="xs"
                      variant="outline"
                      colorPalette="blue"
                      onClick={handleDisplayStrictAddress}
                      disabled={isLoadingStrict}
                    >
                      {isLoadingStrict ? 'Authenticating...' : 'Display address'}
                    </Button>
                  ) : (
                    <Text fontSize="sm" color="gray.400" wordBreak="break-all">
                      {strictAddress}
                    </Text>
                  )}
                  <Text fontSize="xs" color="gray.500" fontStyle="italic">
                    The app <strong>can&apos;t</strong> access the private key and persistent
                    sessions are <strong>not</strong> allowed. These wallets are orgin-specific and
                    derived from the mnemonic encrypted with user&apos;s WebAuthn credentials and
                    stored in device indexed DB. You can make use of tags and derive as many wallets
                    as you want.
                  </Text>
                  <Button
                    bg="brand.accent"
                    color="white"
                    _hover={{ bg: 'brand.accent', opacity: 0.9 }}
                    onClick={() => handleSignMessage('STRICT', strictAddress)}
                    disabled={!strictAddress || isLoadingStrict}
                  >
                    Sign a message
                  </Button>
                </VStack>
              </Box>

              <Box p={6} borderWidth="1px" borderRadius="lg" borderColor="gray.700" bg="gray.900">
                <VStack gap={4} align="stretch">
                  <Heading as="h3" size="md">
                    STANDARD mode
                  </Heading>
                  <Text fontSize="sm" color="gray.400" wordBreak="break-all">
                    {isLoadingMain ? 'Loading...' : mainAddress || 'Not available'}
                  </Text>
                  <Text fontSize="xs" color="gray.500" fontStyle="italic">
                    The app <strong>can&apos;t</strong> access the private key. Persistent sessions{' '}
                    <strong>are</strong> allowed. These wallets are orgin-specific and derived from
                    the mnemonic encrypted with user&apos;s WebAuthn credentials and stored in
                    device indexed DB. You can make use of tags and derive as many wallets as you
                    want.
                  </Text>
                  <Button
                    bg="brand.accent"
                    color="white"
                    _hover={{ bg: 'brand.accent', opacity: 0.9 }}
                    onClick={() => handleSignMessage('default', mainAddress)}
                    disabled={!mainAddress || isLoadingMain}
                  >
                    Sign a message
                  </Button>
                </VStack>
              </Box>

              <Box p={6} borderWidth="1px" borderRadius="lg" borderColor="gray.700" bg="gray.900">
                <VStack gap={4} align="stretch">
                  <Heading as="h3" size="md">
                    YOLO mode
                  </Heading>
                  <Text fontSize="sm" color="gray.400" wordBreak="break-all">
                    {isLoadingOpenbar ? 'Loading...' : openbarAddress || 'Not available'}
                  </Text>
                  <Text fontSize="xs" color="gray.500" fontStyle="italic">
                    The app <strong>can</strong> access the private key. Persistent sessions{' '}
                    <strong>are</strong> allowed. These wallets are orgin-specific and derived from
                    the mnemonic encrypted with user&apos;s WebAuthn credentials and stored in
                    device indexed DB. You can make use of tags and derive as many wallets as you
                    want.
                  </Text>
                  {!showPrivateKey ? (
                    <Button
                      size="xs"
                      variant="outline"
                      colorPalette="orange"
                      onClick={() => setShowPrivateKey(true)}
                      disabled={!openbarPrivateKey || isLoadingOpenbar}
                    >
                      Display private key
                    </Button>
                  ) : (
                    <Box
                      p={3}
                      bg="orange.900"
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor="orange.700"
                    >
                      <Text fontSize="xs" color="orange.200" fontWeight="bold" mb={1}>
                        Private Key:
                      </Text>
                      <Text
                        fontSize="xs"
                        color="orange.100"
                        wordBreak="break-all"
                        fontFamily="mono"
                      >
                        {openbarPrivateKey}
                      </Text>
                    </Box>
                  )}
                  <Button
                    bg="brand.accent"
                    color="white"
                    _hover={{ bg: 'brand.accent', opacity: 0.9 }}
                    onClick={() => handleSignMessage('OPENBAR', openbarAddress)}
                    disabled={!openbarAddress || isLoadingOpenbar}
                  >
                    Sign a message
                  </Button>
                </VStack>
              </Box>
            </SimpleGrid>

            {/* <Box p={6} borderWidth="1px" borderRadius="lg" borderColor="blue.900" bg="blue.950">
            <VStack gap={3} align="stretch">
              <Heading as="h4" size="sm" color="blue.300">
                What&apos;s the difference?
              </Heading>
              <VStack gap={2} align="stretch" fontSize="sm" color="gray.300">
                <Text>
                  <Text as="span" fontWeight="bold" color="blue.200">
                    Default Derived Address (MAIN):
                  </Text>{' '}
                  This is your secure primary wallet. The private key is never exposed to the
                  application - only your passkey can sign transactions. Recommended for financial
                  operations and DeFi.
                </Text>
                <Text>
                  <Text as="span" fontWeight="bold" color="orange.200">
                    OPENBAR Tagged Address:
                  </Text>{' '}
                  This is a custom-tagged wallet where the private key is accessible to the
                  application. Each unique tag (like &quot;OPENBAR&quot;) generates a different
                  address. Suitable for gaming, social apps, or non-financial use cases where the
                  app needs direct key access. Users must trust the app developers with this key.
                </Text>
                <Text fontSize="xs" color="gray.500" pt={2}>
                  Note: Both addresses are origin-specific (unique to this domain) and derived from
                  your passkey, but custom tags expose private keys while MAIN keeps them secure.
                </Text>
              </VStack>
            </VStack>
          </Box> */}

            {/* Stealth Addresses Section */}
            <Box p={6} borderWidth="1px" borderRadius="lg" borderColor="purple.700" bg="purple.950">
              <VStack gap={4} align="stretch">
                <Heading as="h3" size="md">
                  Stealth Addresses
                </Heading>
                <Text fontSize="sm" color="gray.300">
                  Privacy-preserving transactions with ERC-5564 stealth addresses. Each transaction
                  uses a unique, unlinkable address that only the recipient can identify and spend
                  from.
                </Text>

                {!stealthMetaAddress ? (
                  <Button
                    bg="brand.accent"
                    color="white"
                    _hover={{ bg: 'brand.accent', opacity: 0.9 }}
                    onClick={handleLoadStealthKeys}
                    disabled={isLoadingStealth}
                  >
                    {isLoadingStealth ? 'Loading...' : 'Load Stealth Keys'}
                  </Button>
                ) : (
                  <VStack gap={3} align="stretch">
                    <Box
                      p={3}
                      bg="gray.900"
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor="gray.700"
                    >
                      <Text fontSize="xs" fontWeight="bold" color="purple.300" mb={1}>
                        Your Stealth Meta-Address:
                      </Text>
                      <Text fontSize="xs" color="gray.400" wordBreak="break-all" fontFamily="mono">
                        {stealthMetaAddress}
                      </Text>
                    </Box>

                    <Button
                      bg="brand.accent"
                      color="white"
                      _hover={{ bg: 'brand.accent', opacity: 0.9 }}
                      onClick={handleGenerateStealthAddress}
                      disabled={isGeneratingStealth}
                      size="sm"
                    >
                      {isGeneratingStealth ? 'Generating...' : 'Generate Stealth Address'}
                    </Button>

                    {stealthAddress && (
                      <Box
                        p={3}
                        bg="gray.900"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="purple.700"
                      >
                        <Text fontSize="xs" fontWeight="bold" color="purple.300" mb={1}>
                          Generated Stealth Address:
                        </Text>
                        <Text
                          fontSize="xs"
                          color="gray.300"
                          wordBreak="break-all"
                          fontFamily="mono"
                          mb={2}
                        >
                          {stealthAddress}
                        </Text>
                        <Button
                          bg="brand.accent"
                          color="white"
                          _hover={{ bg: 'brand.accent', opacity: 0.9 }}
                          onClick={() => handleSignMessage('STEALTH', stealthAddress)}
                          size="xs"
                          width="full"
                        >
                          Sign a message with this address
                        </Button>
                      </Box>
                    )}
                  </VStack>
                )}

                <VStack gap={2} align="stretch" fontSize="sm" color="gray.400">
                  <Text>
                    • <strong>Privacy</strong>: Each transaction uses a unique address
                  </Text>
                  <Text>
                    • <strong>Non-interactive</strong>: No communication needed between sender and
                    recipient
                  </Text>
                  <Text>
                    • <strong>View tag optimization</strong>: Recipients can efficiently scan
                    transactions
                  </Text>
                  <Text>
                    • <strong>ERC-5564 compliant</strong>: Standard implementation using SECP256k1
                  </Text>
                </VStack>
              </VStack>
            </Box>
          </>
        )}
      </VStack>
    </>
  )
}
