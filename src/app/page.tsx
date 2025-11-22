'use client'

import {
  Container,
  Text,
  VStack,
  Box,
  Heading,
  SimpleGrid,
  Button,
  useToast,
} from '@chakra-ui/react'
import { useW3PK } from '@/context/W3PK'
import { useTranslation } from '@/hooks/useTranslation'
import { useState, useEffect } from 'react'

export default function Home() {
  const { isAuthenticated, user, login, signMessage, deriveWalletWithCustomTag } = useW3PK()
  const t = useTranslation()
  const [mainAddress, setMainAddress] = useState<string>('')
  const [openbarAddress, setOpenbarAddress] = useState<string>('')
  const [openbarPrivateKey, setOpenbarPrivateKey] = useState<string>('')
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [isLoadingMain, setIsLoadingMain] = useState(false)
  const [isLoadingOpenbar, setIsLoadingOpenbar] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const loadAddresses = async () => {
      if (isAuthenticated && user && (!mainAddress || !openbarAddress)) {
        // Add a small delay to ensure W3PK session is fully established
        await new Promise(resolve => setTimeout(resolve, 100))

        // Load MAIN address
        if (!mainAddress) {
          setIsLoadingMain(true)
          try {
            const derivedWallet = await deriveWalletWithCustomTag('MAIN')
            setMainAddress(derivedWallet.address)
          } catch (error) {
            console.error('Failed to derive MAIN address:', error)
          } finally {
            setIsLoadingMain(false)
          }
        }

        // Load OPENBAR address
        if (!openbarAddress) {
          setIsLoadingOpenbar(true)
          try {
            const derivedWallet = await deriveWalletWithCustomTag('OPENBAR')
            setOpenbarAddress(derivedWallet.address)
            if (derivedWallet.privateKey) {
              setOpenbarPrivateKey(derivedWallet.privateKey)
            }
          } catch (error) {
            console.error('Failed to derive OPENBAR address:', error)
            toast({
              title: 'Failed to Load OPENBAR Address',
              description: error instanceof Error ? error.message : 'Unknown error occurred',
              status: 'error',
              duration: 5000,
              isClosable: true,
            })
          } finally {
            setIsLoadingOpenbar(false)
          }
        }
      }
    }

    loadAddresses()
  }, [isAuthenticated, user, deriveWalletWithCustomTag, mainAddress, openbarAddress, toast])

  const handleSignMessage = async (addressType: string, address: string) => {
    const message = `Sign this message from ${addressType} address: ${address}`

    try {
      const signature = await signMessage(message)
      if (signature) {
        toast({
          title: 'Message Signed',
          description: `Signature: ${signature.substring(0, 20)}...`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('Failed to sign message:', error)
    }
  }

  return (
    <Container maxW="container.md" py={20}>
      <VStack spacing={8} align="stretch">
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
                  variant="link"
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
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box p={6} borderWidth="1px" borderRadius="lg" borderColor="gray.600" bg="gray.800">
                <VStack spacing={4} align="stretch">
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
                    colorScheme="blue"
                    onClick={() => handleSignMessage('default', mainAddress)}
                    isDisabled={!mainAddress || isLoadingMain}
                  >
                    Sign a message
                  </Button>
                </VStack>
              </Box>

              <Box p={6} borderWidth="1px" borderRadius="lg" borderColor="gray.600" bg="gray.800">
                <VStack spacing={4} align="stretch">
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
                      colorScheme="orange"
                      onClick={() => setShowPrivateKey(true)}
                      isDisabled={!openbarPrivateKey || isLoadingOpenbar}
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
                    colorScheme="blue"
                    onClick={() => handleSignMessage('OPENBAR', openbarAddress)}
                    isDisabled={!openbarAddress || isLoadingOpenbar}
                  >
                    Sign a message
                  </Button>
                </VStack>
              </Box>
            </SimpleGrid>

            <Box p={6} borderWidth="1px" borderRadius="lg" borderColor="blue.900" bg="blue.950">
              <VStack spacing={3} align="stretch">
                <Heading as="h4" size="sm" color="blue.300">
                  What&apos;s the difference?
                </Heading>
                <VStack spacing={2} align="stretch" fontSize="sm" color="gray.300">
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
                    Note: Both addresses are origin-specific (unique to this domain) and derived
                    from your passkey, but custom tags expose private keys while MAIN keeps them
                    secure.
                  </Text>
                </VStack>
              </VStack>
            </Box>
          </>
        )}
      </VStack>
    </Container>
  )
}
