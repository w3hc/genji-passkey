'use client'

import { Text, VStack, Box, Heading, SimpleGrid } from '@chakra-ui/react'
import { Button } from '@/components/ui/button'
import { useW3PK, base64UrlToArrayBuffer, base64UrlDecode, extractRS } from '@/context/W3PK'
import { useTranslation } from '@/hooks/useTranslation'
import { useState, useEffect } from 'react'
import { toaster } from '@/components/ui/toaster'

export default function Home() {
  const { isAuthenticated, user, login, signMessage, deriveWallet } = useW3PK()
  const t = useTranslation()
  const [primaryAddress, setPrimaryAddress] = useState<string>('')
  const [primaryPublicKey, setPrimaryPublicKey] = useState<string>('')
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
    savedToDatabase?: boolean
    timestamp: Date
  } | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadAddresses = async () => {
      if (!isAuthenticated || !user || mainAddress || openbarAddress) {
        return
      }

      try {
        setIsLoadingMain(true)
        const mainWallet = await deriveWallet('STANDARD', 'MAIN')
        if (cancelled) return
        setMainAddress(mainWallet.address)
        setIsLoadingMain(false)

        setIsLoadingOpenbar(true)
        const openbarWallet = await deriveWallet('YOLO', 'OPENBAR')
        if (cancelled) return
        setOpenbarAddress(openbarWallet.address)
        if (openbarWallet.privateKey) {
          setOpenbarPrivateKey(openbarWallet.privateKey)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to derive addresses:', error)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMain(false)
          setIsLoadingOpenbar(false)
        }
      }
    }

    loadAddresses()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user, mainAddress, openbarAddress, deriveWallet])

  const handleDisplayPrimaryAddress = async () => {
    setIsLoadingPrimary(true)
    try {
      const primaryWallet = await deriveWallet('PRIMARY', 'PRIMARY')
      console.log('PRIMARY wallet received:', primaryWallet)
      console.log('Has publicKey?', !!primaryWallet.publicKey)
      console.log('Full wallet object:', JSON.stringify(primaryWallet, null, 2))

      setPrimaryAddress(primaryWallet.address)
      if (primaryWallet.publicKey) {
        setPrimaryPublicKey(primaryWallet.publicKey)
        console.log('Public key stored in state')
      } else {
        console.error('No public key in PRIMARY wallet!')
      }
    } catch (error) {
      console.error('Failed to derive PRIMARY address:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to derive address',
        type: 'error',
        duration: 5000,
      })
    } finally {
      setIsLoadingPrimary(false)
    }
  }

  const handleDisplayStrictAddress = async () => {
    setIsLoadingStrict(true)
    try {
      const strictWallet = await deriveWallet('STRICT', 'STRICT')
      setStrictAddress(strictWallet.address)
    } catch (error) {
      console.error('Failed to derive STRICT address:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to derive address',
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

  const handleSendVerifyP256Tx = async () => {
    try {
      if (!user) {
        throw new Error('No user found')
      }

      // Use the stored public key from state
      if (!primaryPublicKey) {
        throw new Error('No public key found for PRIMARY wallet')
      }

      // Decode the public key to get x and y coordinates
      const publicKeySpki = primaryPublicKey
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

      // Step 2: Call the verifyP256 contract
      // toaster.create({
      //   title: 'Calling Contract',
      //   description: 'Sending transaction to verifyP256 precompile...',
      //   type: 'info',
      //   duration: 3000,
      // })

      // Import ethers for contract interaction
      const { ethers } = await import('ethers')

      // Use Sepolia RPC URL for the contract call (read-only)
      const sepoliaRpcUrl = 'https://1rpc.io/sepolia'
      const provider = new ethers.JsonRpcProvider(sepoliaRpcUrl)

      // First, check if the contract exists
      const contractAddress = '0x8cb7b478776B60784415931eA213B41d363a107e'
      const code = await provider.getCode(contractAddress)

      console.log('Contract code at', contractAddress, ':', code)

      if (code === '0x') {
        throw new Error(
          `No contract found at ${contractAddress}. The EIP-7951 precompile might not be deployed on Sepolia yet, or you may need to use a different network (like Holesky or mainnet after the Fusaka upgrade).`
        )
      }

      const contractABI = [
        'function verifyP256(bytes32 h, bytes32 r, bytes32 s, bytes32 qx, bytes32 qy) external view returns (bool)',
      ]

      const contract = new ethers.Contract(contractAddress, contractABI, provider)

      // Call the contract with the actual hash that WebAuthn signed
      const result = await contract.verifyP256(actualH, r, s, qx, qy)

      console.log('Verification parameters sent to contract:')
      console.log('  h (actualH):', actualH)
      console.log('  r:', r)
      console.log('  s:', s)
      console.log('  qx:', qx)
      console.log('  qy:', qy)

      console.log('Contract verification result:', result)

      if (result) {
        const timestamp = new Date()

        // Store the verification result
        setVerificationResult({
          success: true,
          messageHash: h,
          signedHash: actualH,
          signature: { r, s },
          publicKey: { qx, qy },
          contractAddress: contractAddress,
          timestamp,
          savedToDatabase: false,
        })

        toaster.create({
          title: 'Verification Successful!',
          description: 'P-256 signature verified on-chain using EIP-7951 precompile.',
          type: 'success',
          duration: 7000,
        })

        // Save to database - "I was there" feature
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
              contractAddress: contractAddress,
              txHash: null,
              verificationTimestamp: timestamp.toISOString(),
            }),
          })

          if (response.ok) {
            setVerificationResult(prev => (prev ? { ...prev, savedToDatabase: true } : null))
            console.log('EIP-7951 verification saved to database')
          }
        } catch (error) {
          console.error('Failed to save verification to database:', error)
        }
      } else {
        throw new Error('Signature verification failed on contract')
      }

      console.log('PRIMARY address:', primaryAddress)
      console.log('Contract: 0x8cb7b478776B60784415931eA213B41d363a107e')
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
                  PRIMARY mode
                </Heading>
                {!primaryAddress ? (
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="blue"
                    onClick={handleDisplayPrimaryAddress}
                    disabled={isLoadingPrimary}
                  >
                    {isLoadingPrimary ? 'Loading...' : 'Display public address'}
                  </Button>
                ) : (
                  <Text fontSize="sm" color="gray.400" wordBreak="break-all">
                    {primaryAddress}
                  </Text>
                )}
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                  This wallet is derived from your WebAuthn credential stored in your device&apos;s
                  secure element. There&apos;s simply <strong>no private key at all</strong>.
                  It&apos;s compliant with EIP-7951 that was introduced in Fusaka upgrade (Dec 3,
                  2025), meaning you can send a transaction with passkey (fingerprint or face
                  recognition).
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
                        <Text
                          fontSize="xs"
                          color="gray.400"
                          fontFamily="mono"
                          wordBreak="break-all"
                        >
                          {verificationResult.contractAddress}
                        </Text>
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
                      {verificationResult.savedToDatabase && (
                        <Box
                          p={2}
                          borderRadius="md"
                          bg="green.800"
                          borderWidth="1px"
                          borderColor="green.400"
                        >
                          <Text
                            fontSize="sm"
                            fontWeight="bold"
                            color="green.200"
                            textAlign="center"
                          >
                            🎉 To celebrate the Fusaka upgrade, you will receive a special NFT on OP
                            Mainnet in the coming days. Thanks for your patience. Let&apos;s keep on
                            improving Ethereum UX!
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
                    {isLoadingStrict ? 'Loading...' : 'Display public address'}
                  </Button>
                ) : (
                  <Text fontSize="sm" color="gray.400" wordBreak="break-all">
                    {strictAddress}
                  </Text>
                )}
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                  The app <strong>can&apos;t</strong> access the private key and persistent sessions
                  are <strong>not</strong> allowed. These wallets are orgin-specific and derived
                  from the mnemonic encrypted with user&apos;s WebAuthn credentials and stored in
                  device indexed DB. You can make use of tags and derive as many wallets as you
                  want.
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
                  the mnemonic encrypted with user&apos;s WebAuthn credentials and stored in device
                  indexed DB. You can make use of tags and derive as many wallets as you want.
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
                  the mnemonic encrypted with user&apos;s WebAuthn credentials and stored in device
                  indexed DB. You can make use of tags and derive as many wallets as you want.
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
                    <Text fontSize="xs" color="orange.100" wordBreak="break-all" fontFamily="mono">
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
        </>
      )}
    </VStack>
  )
}
