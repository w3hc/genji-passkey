'use client'

import { Text, VStack, Box, Heading, Link, Image } from '@chakra-ui/react'
import { Button } from '@/components/ui/button'
import { useW3PK } from '@/context/W3PK'
import { useTranslation } from '@/hooks/useTranslation'
import { useState, useEffect } from 'react'
import { toaster } from '@/components/ui/toaster'
import { brandColors } from '@/theme'

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
  const { isAuthenticated, user, login, signMessage, deriveWallet, getAddress } = useW3PK()
  const t = useTranslation()
  const [primaryAddress, setPrimaryAddress] = useState<string>('')
  const [mainAddress, setMainAddress] = useState<string>('')
  const [openbarAddress, setOpenbarAddress] = useState<string>('')
  const [isLoadingMain, setIsLoadingMain] = useState(false)
  const [mintTxHash, setMintTxHash] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    const loadAddresses = async () => {
      if (!isAuthenticated || !user) {
        return
      }

      try {
        // Load MAIN address
        if (!mainAddress) {
          setIsLoadingMain(true)
          const mainWallet = await deriveWallet('STANDARD', 'MAIN')
          if (cancelled) return
          setMainAddress(mainWallet.address)
          setIsLoadingMain(false)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load addresses:', error)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMain(false)
        }
      }
    }

    loadAddresses()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user, mainAddress, openbarAddress, primaryAddress, deriveWallet, getAddress])

  const handleSignMessage = async (addressType: string, address: string) => {
    const message = `Sign this message from ${addressType} address: ${address}`

    try {
      const signature = await signMessage(message)
      if (signature) {
        toaster.create({
          title: 'Message Signed',
          description: `Signature: ${signature.substring(0, 20)}...`,
          type: 'success',
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Failed to sign message:', error)
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
            <VStack gap={4} align="stretch">
              <Box
                as="span"
                fontSize="xl"
                wordBreak="break-all"
                className="shimmer-text"
                textAlign={'center'}
              >
                {isLoadingMain ? 'Loading...' : mainAddress || 'Not available'}
              </Box>
              <Box textAlign="center" mt={10}>
                <VStack gap={3}>
                  <Button
                    colorPalette="blue"
                    onClick={() => handleSignMessage('Hello world!', mainAddress)}
                    disabled={!mainAddress}
                    size="sm"
                  >
                    Sign a message
                  </Button>
                </VStack>
                {mintTxHash && (
                  <Box
                    mt={8}
                    p={6}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="blue.700"
                    bg="blue.950"
                    maxW="500px"
                    mx="auto"
                  >
                    <VStack gap={4}>
                      <Image
                        src="https://bafybeif54pvansk6tlywsxajimb3qwtp5mm7efsp6loiaoioocpgebirwu.ipfs.dweb.link/pa30.png"
                        alt="Alpha Tester NFT"
                        borderRadius="lg"
                        width="100%"
                        maxW="300px"
                      />
                      <Link
                        href={`https://optimistic.etherscan.io/tx/${mintTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        fontSize="0.875rem"
                        color={brandColors.accent}
                        textDecoration="underline"
                        wordBreak="break-all"
                        width="100%"
                      >
                        {mintTxHash}
                      </Link>
                      <Text
                        fontSize="sm"
                        color="gray.300"
                        textAlign="left"
                        lineHeight="1.6"
                        width="100%"
                      >
                        Thank you for testing W3PK! You now own the Alpha Tester NFT on OP Mainnet,
                        it&apos;s in your wallet. Don&apos;t forget to backup your account so you
                        don&apos;t lose the NFT: we&apos;ll soon deploy a DAO and you&apos;re
                        already a member of it! Thanks again!
                      </Text>
                    </VStack>
                  </Box>
                )}
              </Box>
            </VStack>
          </>
        )}
      </VStack>
    </>
  )
}
