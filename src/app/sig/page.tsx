'use client'

import {
  Container,
  Heading,
  Text,
  useToast,
  Button,
  Box,
  VStack,
  FormControl,
  FormLabel,
  Textarea,
  Alert,
  AlertIcon,
  AlertDescription,
  Code,
  Divider,
} from '@chakra-ui/react'
import { useW3PK } from '@/context/W3PK'
import Spinner from '@/components/Spinner'
import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

export default function Web3() {
  const { isAuthenticated, user, signMessage } = useW3PK()
  const t = useTranslation()
  const toast = useToast()

  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [isSigningMessage, setIsSigningMessage] = useState(false)

  const handleSignMessage = async () => {
    if (!message.trim()) {
      toast({
        title: 'Message Required',
        description: 'Please enter a message to sign',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      setIsSigningMessage(true)
      console.log('=== Starting Message Signing ===')
      console.log('Message to sign:', message)

      // Use the signMessage method from WebAuthn context
      const messageSignature = await signMessage(message.trim())

      if (messageSignature) {
        console.log('Message signed successfully:', messageSignature)
        setSignature(messageSignature)

        toast({
          title: 'Message Signed Successfully',
          description: 'Your message has been cryptographically signed with fresh authentication',
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (error: any) {
      console.error('Message signing failed:', error)
      // Error handling is done in the signMessage method
    } finally {
      setIsSigningMessage(false)
    }
  }

  const clearSignature = () => {
    setSignature('')
    setMessage('')
  }

  const copySignature = () => {
    navigator.clipboard.writeText(signature)
    toast({
      title: 'Copied',
      description: 'Signature copied to clipboard',
      status: 'info',
      duration: 2000,
      isClosable: true,
    })
  }

  const copyAddress = () => {
    if (user?.ethereumAddress) {
      navigator.clipboard.writeText(user.ethereumAddress)
      toast({
        title: 'Copied',
        description: 'Ethereum address copied to clipboard',
        status: 'info',
        duration: 2000,
        isClosable: true,
      })
    }
  }

  if (!isAuthenticated) {
    return (
      <Container maxW="container.md" py={20}>
        <VStack spacing={8} align="stretch">
          <Box bg="whiteAlpha.50" p={6} borderRadius="md" textAlign="center">
            <Alert status="warning" bg="transparent" color="orange.200">
              <AlertIcon />
              <AlertDescription>
                Please log in to access message signing functionality.
              </AlertDescription>
            </Alert>
          </Box>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="lg" mb={4}>
            Sign Message
          </Heading>
          <Text color="gray.400" mb={6}>
            Cryptographically sign a message with your client-side encrypted Ethereum wallet
          </Text>
        </Box>

        <VStack spacing={6} align="stretch">
          <Box bg="gray.800" p={4} borderRadius="md">
            <Text fontSize="sm" color="gray.400" mb={2}>
              Logged in as: <strong>{user?.displayName || user?.username}</strong>
            </Text>
            <Text fontSize="xs" color="gray.500" mb={2}>
              Ethereum Address:
              <Code
                fontSize="xs"
                ml={2}
                cursor="pointer"
                onClick={copyAddress}
                _hover={{ bg: 'gray.600' }}
                title="Click to copy"
              >
                {user?.ethereumAddress}
              </Code>
            </Text>
            <Text fontSize="xs" color="blue.300">
              🔒 Your private key is encrypted client-side and never sent to the server
            </Text>
          </Box>

          <Divider />

          <FormControl>
            <FormLabel>Message to Sign</FormLabel>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Enter the message you want to sign..."
              bg="gray.700"
              border="1px solid"
              borderColor="gray.600"
              _hover={{ borderColor: 'gray.500' }}
              _focus={{ borderColor: '#8c1c84', boxShadow: '0 0 0 1px #8c1c84' }}
              resize="vertical"
              minH="100px"
            />
          </FormControl>

          <Button
            bg="#8c1c84"
            color="white"
            _hover={{ bg: '#6d1566' }}
            onClick={handleSignMessage}
            isLoading={isSigningMessage}
            spinner={<Spinner size="16px" />}
            loadingText="Signing..."
            isDisabled={!message.trim()}
            size="lg"
          >
            Sign Message
          </Button>

          {signature && (
            <Box>
              <Divider mb={4} />
              <FormControl>
                <FormLabel>Signature</FormLabel>
                <Box position="relative">
                  <Code
                    display="block"
                    whiteSpace="pre-wrap"
                    wordBreak="break-all"
                    bg="gray.700"
                    p={4}
                    borderRadius="md"
                    fontSize="sm"
                    maxH="200px"
                    overflowY="auto"
                  >
                    {signature}
                  </Code>
                </Box>

                <VStack spacing={3} mt={4}>
                  <Button
                    variant="outline"
                    colorScheme="blue"
                    onClick={copySignature}
                    size="sm"
                    width="full"
                  >
                    Copy Signature
                  </Button>
                  <Button
                    variant="ghost"
                    colorScheme="gray"
                    onClick={clearSignature}
                    size="sm"
                    width="full"
                  >
                    Clear
                  </Button>
                </VStack>
              </FormControl>
            </Box>
          )}
        </VStack>

        <Box bg="gray.800" p={4} borderRadius="md">
          <Text fontSize="sm" color="gray.400" mb={2}>
            <strong>About Client-Side Message Signing:</strong>
          </Text>
          <Text fontSize="xs" color="gray.500" mb={3}>
            Your Ethereum wallet is generated and encrypted entirely on your device using your
            WebAuthn passkey. The private key never leaves your browser and is encrypted with keys
            derived from your biometric authentication. Message signing happens locally in your
            browser for maximum security.
          </Text>
          <Text fontSize="xs" color="gray.500" mb={3}>
            You can verify signatures on{' '}
            <Text
              as="a"
              href="https://etherscan.io/verifiedSignatures#"
              target="_blank"
              rel="noopener noreferrer"
              color="blue.300"
              textDecoration="underline"
              _hover={{ color: 'blue.200' }}
            >
              Etherscan&apos;s Verify Signature tool
            </Text>{' '}
            using your Ethereum address and the signature above.
          </Text>
          <Text fontSize="xs" color="yellow.300">
            🔐 Security Note: Your wallet is protected by both your device&apos;s biometric security
            and strong encryption. If you lose access to your device or passkey, your wallet cannot
            be recovered.
          </Text>
        </Box>
      </VStack>
    </Container>
  )
}
