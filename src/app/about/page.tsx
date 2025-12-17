'use client'

import { Heading, Text, Box, VStack, HStack, Flex, Link, Icon, List } from '@chakra-ui/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { brandColors } from '@/theme'
import { FaGithub, FaNpm } from 'react-icons/fa'
import { useState } from 'react'
import { toaster } from '@/components/ui/toaster'

export default function About() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@')) {
      toaster.create({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        type: 'error',
        duration: 3000,
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
        toaster.create({
          title: 'Success!',
          description: 'You have been subscribed to w3pk updates',
          type: 'success',
          duration: 3000,
        })
        setEmail('')
      } else {
        throw new Error('Subscription failed')
      }
    } catch (error) {
      toaster.create({
        title: 'Error',
        description: 'Failed to subscribe. Please try again.',
        type: 'error',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <VStack gap={8} align="stretch" py={20}>
      <Heading size="xl" textAlign="center">
        About{' '}
        <Text as="span" color={brandColors.accent}>
          w3pk
        </Text>
      </Heading>

      <Text fontSize="lg">
        w3pk is a passwordless Web3 authentication SDK with encrypted wallets and privacy features.
        You can use it in any JS/TS-based web app (Next.js, Vue, Angular, Svelte, …).{' '}
        <Link
          href="https://github.com/w3hc/genji-passkey"
          target="_blank"
          rel="noopener noreferrer"
          color={brandColors.accent}
          _hover={{ color: '#3691e7' }}
        >
          Genji
        </Link>{' '}
        is a Next.js app template, feel free to fork it and build whatever you want!
      </Text>

      {/* Email Subscription Box */}
      <Box p={6} borderRadius="lg" bg="gray.900" borderWidth="1px" borderColor="gray.700">
        <Text fontSize="sm" color="gray.300" mb={4}>
          w3pk is under dev. Receive emails when we ship new features (EIP-1193 support, AI
          capacities, Viem helpers, chain abstraction, and more)
        </Text>
        <HStack gap={3}>
          <Input
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
            bg="gray.800"
            borderColor="gray.600"
            pl={3}
            _hover={{ borderColor: 'gray.500' }}
            _focus={{
              borderColor: brandColors.accent,
              boxShadow: `0 0 0 1px ${brandColors.accent}`,
            }}
          />
          <Button
            onClick={handleEmailSubmit}
            loading={isSubmitting}
            bg={brandColors.accent}
            color="white"
            _hover={{ bg: '#3691e7' }}
            _active={{ bg: '#2780d6' }}
            px={8}
          >
            Subscribe
          </Button>
        </HStack>
      </Box>

      <Box pt={6} pb={12}>
        {/* Social Links */}
        <HStack mt={20} gap={6} justify="center" py={4} borderColor="gray.800">
          <Link
            href="https://github.com/w3hc/w3pk"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View w3pk on GitHub (opens in new tab)"
          >
            <Flex
              align="center"
              gap={3}
              px={6}
              py={3}
              borderRadius="md"
              bg="gray.800"
              minW="140px"
              justify="center"
              _hover={{
                bg: 'gray.700',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(69, 162, 248, 0.3)',
              }}
              transition="all 0.2s"
              cursor="pointer"
            >
              <Icon as={FaGithub} boxSize={6} color={brandColors.accent} />
              <Text fontSize="md" fontWeight="medium">
                GitHub
              </Text>
            </Flex>
          </Link>

          <Link
            href="https://www.npmjs.com/package/w3pk"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View w3pk on NPM (opens in new tab)"
          >
            <Flex
              align="center"
              gap={3}
              px={6}
              py={3}
              borderRadius="md"
              bg="gray.800"
              minW="140px"
              justify="center"
              _hover={{
                bg: 'gray.700',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(140, 28, 132, 0.3)',
              }}
              transition="all 0.2s"
              cursor="pointer"
            >
              <Icon as={FaNpm} boxSize={6} color={brandColors.primary} />
              <Text fontSize="md" fontWeight="medium">
                NPM
              </Text>
            </Flex>
          </Link>
        </HStack>
      </Box>

      {/* Code Showcase */}
      <Box mt={3} borderRadius="3xl" overflow="hidden" position="relative">
        <Box bg="gray.900" p={12} fontFamily="monospace" fontSize="md">
          <Text color="#ffffff" mb={1}>
            <Text as="span" color="#ffffff">
              import
            </Text>{' '}
            {'{ '}
            <Text as="span" color={brandColors.accent}>
              createWeb3Passkey
            </Text>
            {' }'}{' '}
            <Text as="span" color="#ffffff">
              from
            </Text>{' '}
            <Text as="span" color={brandColors.primary}>
              &apos;w3pk&apos;
            </Text>
          </Text>
          <Text mb={2}>&nbsp;</Text>
          <Text color="#ffffff" mb={2}>
            <Text as="span" color="#ffffff">
              const
            </Text>{' '}
            <Text as="span" color={brandColors.accent}>
              w3pk
            </Text>{' '}
            <Text as="span" color="#9ca3af">
              =
            </Text>{' '}
            <Text as="span" color={brandColors.accent}>
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
            <Text as="span" color={brandColors.accent}>
              w3pk
            </Text>
            <Text as="span" color="#ffffff">
              .
            </Text>
            <Text as="span" color={brandColors.accent}>
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
            <Text as="span" color={brandColors.primary}>
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
            <Text as="span" color={brandColors.accent}>
              w3pk
            </Text>
            <Text as="span" color="#ffffff">
              .
            </Text>
            <Text as="span" color={brandColors.accent}>
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
            <Text as="span" color={brandColors.accent}>
              w3pk
            </Text>
            <Text as="span" color="#ffffff">
              .
            </Text>
            <Text as="span" color={brandColors.accent}>
              logout
            </Text>
            <Text as="span" color="#ffffff">
              ()
            </Text>
          </Text>
        </Box>
      </Box>

      {/* Features List */}
      <Box mt={12}>
        <Heading size="xl" mb={6}>
          Features
        </Heading>
        <List.Root
          gap={2}
          fontSize="lg"
          pl={6}
          css={{
            '& li::marker': {
              color: brandColors.primary,
            },
          }}
        >
          <List.Item
            cursor="pointer"
            transition="color 0.2s"
            _hover={{ color: brandColors.accent }}
          >
            Passwordless authentication (WebAuthn/FIDO2)
          </List.Item>
          <List.Item
            cursor="pointer"
            transition="color 0.2s"
            _hover={{ color: brandColors.accent }}
          >
            Origin-specific key isolation with tag-based access control
          </List.Item>
          <List.Item
            cursor="pointer"
            transition="color 0.2s"
            _hover={{ color: brandColors.accent }}
          >
            Session management (in-memory + optional persistent)
          </List.Item>
          <List.Item
            cursor="pointer"
            transition="color 0.2s"
            _hover={{ color: brandColors.accent }}
          >
            HD wallet generation (BIP39/BIP44)
          </List.Item>
          <List.Item
            cursor="pointer"
            transition="color 0.2s"
            _hover={{ color: brandColors.accent }}
          >
            Multi-address derivation with security modes (STANDARD/STRICT/YOLO)
          </List.Item>
          <List.Item
            cursor="pointer"
            transition="color 0.2s"
            _hover={{ color: brandColors.accent }}
          >
            Multiple signing methods (EIP-191, SIWE/EIP-4361, EIP-712, rawHash)
          </List.Item>
          <List.Item
            cursor="pointer"
            transition="color 0.2s"
            _hover={{ color: brandColors.accent }}
          >
            ERC-5564 stealth addresses (opt-in)
          </List.Item>
          <List.Item
            cursor="pointer"
            transition="color 0.2s"
            _hover={{ color: brandColors.accent }}
          >
            ZK primitives (zero-knowledge proof generation and verification)
          </List.Item>
          <List.Item
            cursor="pointer"
            transition="color 0.2s"
            _hover={{ color: brandColors.accent }}
          >
            Chainlist support (2390+ networks)
          </List.Item>
          <List.Item
            cursor="pointer"
            transition="color 0.2s"
            _hover={{ color: brandColors.accent }}
          >
            EIP-7702 network detection (329+ networks)
          </List.Item>
          <List.Item
            cursor="pointer"
            transition="color 0.2s"
            _hover={{ color: brandColors.accent }}
          >
            EIP-7951 PRIMARY mode (P-256 passkey signing)
          </List.Item>
          <List.Item
            cursor="pointer"
            transition="color 0.2s"
            _hover={{ color: brandColors.accent }}
          >
            Build verification (IPFS CIDv1 hashing)
          </List.Item>
          <List.Item
            cursor="pointer"
            transition="color 0.2s"
            _hover={{ color: brandColors.accent }}
          >
            Three-layer backup & recovery (passkey sync, encrypted backups, social recovery)
          </List.Item>
        </List.Root>
      </Box>
    </VStack>
  )
}
