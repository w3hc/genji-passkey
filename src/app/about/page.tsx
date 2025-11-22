'use client'

import { Container, Heading, Text, Box, VStack, HStack, Flex, Link, Icon, Input, Button, useToast } from '@chakra-ui/react'
import { FaGithub, FaNpm } from 'react-icons/fa'
import { useState } from 'react'

export default function About() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        toast({
          title: 'Success!',
          description: 'You have been subscribed to w3pk updates',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        setEmail('')
      } else {
        throw new Error('Subscription failed')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to subscribe. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxW="container.md" py={20}>
      <VStack spacing={8} align="stretch">
        <Heading size="xl" textAlign="center">
          About{' '}
          <Text as="span" color="#45a2f8">
            w3pk
          </Text>
        </Heading>

        <Text fontSize="lg" color="gray.400">
          w3pk is a passwordless Web3 authentication SDK with encrypted wallets and privacy
          features.
        </Text>

        {/* Email Subscription Box */}
        <Box
          p={6}
          borderRadius="lg"
          bg="gray.900"
          borderWidth="1px"
          borderColor="gray.700"
        >
          <Text fontSize="sm" color="gray.300" mb={4}>
            w3pk is under heavy dev, receive emails when we ship new features (EIP-1193 support, SIWE support, AI capacities, chain abstraction, ...)
          </Text>
          <HStack spacing={3}>
            <Input
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
              bg="gray.800"
              borderColor="gray.600"
              _hover={{ borderColor: 'gray.500' }}
              _focus={{ borderColor: '#45a2f8', boxShadow: '0 0 0 1px #45a2f8' }}
            />
            <Button
              onClick={handleEmailSubmit}
              isLoading={isSubmitting}
              bg="#45a2f8"
              color="white"
              _hover={{ bg: '#3691e7' }}
              _active={{ bg: '#2780d6' }}
              px={8}
            >
              Subscribe
            </Button>
          </HStack>
        </Box>

        {/* Features List */}
        <Box mt={8}>
          <Heading size="md" mb={4}>
            Features
          </Heading>
          <VStack align="stretch" spacing={2}>
            <Text>🔐 Passwordless authentication (WebAuthn/FIDO2)</Text>
            <Text>🛡️ Origin-specific key isolation with tag-based access control</Text>
            <Text>⏱️ Session management (configurable duration, prevents repeated prompts)</Text>
            <Text>🌱 HD wallet generation (BIP39/BIP44)</Text>
            <Text>🔢 Multi-address derivation</Text>
            <Text>
              🌐 Origin-specific addresses (deterministic derivation per website with tag support)
            </Text>
            <Text>
              🥷 ERC-5564 stealth addresses (opt-in, privacy-preserving transactions with view tags)
            </Text>
            <Text>🧮 ZK primitives (zero-knowledge proof generation and verification)</Text>
            <Text>🔗 Chainlist support (2390+ networks, auto-filtered RPC endpoints)</Text>
            <Text>⚡ EIP-7702 network detection (329+ supported networks)</Text>
            <Text>🔍 Build verification (IPFS CIDv1 hashing for package integrity)</Text>
            <Text>🛡️ Three-layer backup & recovery system</Text>
            <VStack align="stretch" pl={6} spacing={1}>
              <Text>• Passkey auto-sync (iCloud/Google/Microsoft)</Text>
              <Text>• Encrypted backups (ZIP/QR with password protection)</Text>
              <Text>• Social recovery (Shamir Secret Sharing)</Text>
            </VStack>
          </VStack>
        </Box>

        {/* Code Showcase */}
        <Box mt={3} borderRadius="3xl" overflow="hidden" position="relative">
          <Box bg="gray.900" p={12} fontFamily="monospace" fontSize="md">
            <Text color="#ffffff" mb={1}>
              <Text as="span" color="#ffffff">
                import
              </Text>{' '}
              {'{ '}
              <Text as="span" color="#45a2f8">
                createWeb3Passkey
              </Text>
              {' }'}{' '}
              <Text as="span" color="#ffffff">
                from
              </Text>{' '}
              <Text as="span" color="#8c1c84">
                &apos;w3pk&apos;
              </Text>
            </Text>
            <Text mb={2}>&nbsp;</Text>
            <Text color="#ffffff" mb={2}>
              <Text as="span" color="#ffffff">
                const
              </Text>{' '}
              <Text as="span" color="#45a2f8">
                w3pk
              </Text>{' '}
              <Text as="span" color="#9ca3af">
                =
              </Text>{' '}
              <Text as="span" color="#45a2f8">
                createWeb3Passkey
              </Text>
              <Text as="span" color="#ffffff">
                ()
              </Text>
            </Text>
            <Text mb={2}>&nbsp;</Text>
            <Text color="#6b7280" mb={1}>
              {'// Register'}
            </Text>
            <Text color="#ffffff" mb={1}>
              <Text as="span" color="#ffffff">
                await
              </Text>{' '}
              <Text as="span" color="#45a2f8">
                w3pk
              </Text>
              <Text as="span" color="#ffffff">
                .
              </Text>
              <Text as="span" color="#45a2f8">
                register
              </Text>
              <Text as="span" color="#ffffff">
                ({'{'}
              </Text>
            </Text>
            <Text color="#ffffff" ml={4} mb={1}>
              <Text as="span" color="#ffffff">
                username
              </Text>
              <Text as="span" color="#9ca3af">
                :{' '}
              </Text>
              <Text as="span" color="#8c1c84">
                &apos;alice&apos;
              </Text>
            </Text>
            <Text color="#9ca3af" ml={4} mb={1}></Text>
            <Text color="#ffffff" mb={2}>
              {'}'})
            </Text>
            <Text mb={2}>&nbsp;</Text>
            <Text color="#6b7280" mb={1}>
              {'// Login'}
            </Text>
            <Text color="#ffffff" mb={1}>
              <Text as="span" color="#ffffff">
                await
              </Text>{' '}
              <Text as="span" color="#45a2f8">
                w3pk
              </Text>
              <Text as="span" color="#ffffff">
                .
              </Text>
              <Text as="span" color="#45a2f8">
                login
              </Text>
              <Text as="span" color="#ffffff">
                ()
              </Text>
            </Text>
            <Text mb={2}>&nbsp;</Text>
            <Text color="#6b7280" mb={1}>
              {'// Logout'}
            </Text>
            <Text color="#ffffff">
              <Text as="span" color="#ffffff">
                await
              </Text>{' '}
              <Text as="span" color="#45a2f8">
                w3pk
              </Text>
              <Text as="span" color="#ffffff">
                .
              </Text>
              <Text as="span" color="#45a2f8">
                logout
              </Text>
              <Text as="span" color="#ffffff">
                ()
              </Text>
            </Text>
          </Box>
        </Box>

        <Box pt={6} pb={12}>
          {/* Social Links */}
          <HStack spacing={4} justify="center" py={4} borderColor="gray.800" bg="gray.950">
            <Link href="https://github.com/w3hc/w3pk" target="_blank" rel="noopener noreferrer">
              <Flex
                align="center"
                gap={2}
                px={4}
                py={2}
                borderRadius="md"
                bg="gray.800"
                _hover={{
                  bg: 'gray.700',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(69, 162, 248, 0.3)',
                }}
                transition="all 0.2s"
                cursor="pointer"
              >
                <Icon as={FaGithub} boxSize={5} color="#45a2f8" />
                <Text fontSize="sm" fontWeight="medium">
                  GitHub
                </Text>
              </Flex>
            </Link>

            <Link
              href="https://www.npmjs.com/package/w3pk"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Flex
                align="center"
                gap={2}
                px={4}
                py={2}
                borderRadius="md"
                bg="gray.800"
                _hover={{
                  bg: 'gray.700',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(140, 28, 132, 0.3)',
                }}
                transition="all 0.2s"
                cursor="pointer"
              >
                <Icon as={FaNpm} boxSize={5} color="#8c1c84" />
                <Text fontSize="sm" fontWeight="medium">
                  NPM
                </Text>
              </Flex>
            </Link>
          </HStack>
        </Box>
      </VStack>
    </Container>
  )
}
