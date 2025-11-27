'use client'

import { Text, VStack, Box, Heading, SimpleGrid } from '@chakra-ui/react'
import { Button } from '@/components/ui/button'
import { useW3PK } from '@/context/W3PK'
import { useTranslation } from '@/hooks/useTranslation'
import { useState, useEffect } from 'react'
import { toaster } from '@/components/ui/toaster'

export default function Home() {
  const { isAuthenticated, user, login, signMessage, deriveWallet } = useW3PK()
  const t = useTranslation()
  const [mainAddress, setMainAddress] = useState<string>('')
  const [openbarAddress, setOpenbarAddress] = useState<string>('')
  const [openbarPrivateKey, setOpenbarPrivateKey] = useState<string>('')
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [isLoadingMain, setIsLoadingMain] = useState(false)
  const [isLoadingOpenbar, setIsLoadingOpenbar] = useState(false)

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
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Box p={6} borderWidth="1px" borderRadius="lg" borderColor="gray.700" bg="gray.900">
              <VStack gap={4} align="stretch">
                <Heading as="h3" size="md">
                  Default Derived Address
                </Heading>
                <Text fontSize="sm" color="gray.400" wordBreak="break-all">
                  {isLoadingMain ? 'Loading...' : mainAddress || 'Not available'}
                </Text>
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                  Private key cannot be displayed (secure MAIN wallet)
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
                  OPENBAR Tagged Address
                </Heading>
                <Text fontSize="sm" color="gray.400" wordBreak="break-all">
                  {isLoadingOpenbar ? 'Loading...' : openbarAddress || 'Not available'}
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

          <Box p={6} borderWidth="1px" borderRadius="lg" borderColor="blue.900" bg="blue.950">
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
          </Box>
        </>
      )}
    </VStack>
  )
}
