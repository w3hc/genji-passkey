'use client'

import {
  Box,
  Button,
  Flex,
  Heading,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
  VStack,
  useToast,
  FormErrorMessage,
  Link as ChakraLink,
} from '@chakra-ui/react'
import Link from 'next/link'
import { HamburgerIcon } from '@chakra-ui/icons'
import LanguageSelector from './LanguageSelector'
import Spinner from './Spinner'
import { useTranslation } from '@/hooks/useTranslation'
import { useW3PK } from '@/context/W3PK'
import { useState, useEffect } from 'react'
import { FaGithub } from 'react-icons/fa'

export default function Header() {
  const { isAuthenticated, user, isLoading, login, register, logout } = useW3PK()
  const t = useTranslation()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [username, setUsername] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [isUsernameInvalid, setIsUsernameInvalid] = useState(false)

  const [scrollPosition, setScrollPosition] = useState(0)

  const shouldSlide = scrollPosition > 0
  const leftSlideValue = shouldSlide ? 2000 : 0
  const rightSlideValue = shouldSlide ? 2000 : 0

  const GitHubIcon = FaGithub

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const validateUsername = (input: string): boolean => {
    if (!input.trim()) {
      return true
    }

    const trimmedInput = input.trim()

    // Check overall format and length (3-50 chars)
    // Alphanumeric, underscore, and hyphen allowed
    // Must start and end with alphanumeric
    const formatValid =
      /^[a-zA-Z0-9]([a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test(trimmedInput) &&
      trimmedInput.length >= 3 &&
      trimmedInput.length <= 50

    return formatValid
  }

  const handleLogin = async () => {
    await login()
  }

  const handleRegister = async () => {
    if (!username.trim()) {
      toast({
        title: 'Username Required',
        description: 'Please enter a username to register.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      setIsUsernameInvalid(true)
      return
    }

    const isValid = validateUsername(username)
    if (!isValid) {
      // toast({
      //   title: 'Invalid Username',
      //   description:
      //     'Username must be 3-50 characters long and contain only letters, numbers, underscores, and hyphens. It must start and end with a letter or number.',
      //   status: 'error',
      //   duration: 5000,
      //   isClosable: true,
      // })
      setIsUsernameInvalid(true)
      return
    }

    setIsUsernameInvalid(false)

    try {
      setIsRegistering(true)
      console.log('[Header] Starting registration for:', username.trim())

      // Add timeout to prevent infinite loading
      const registrationPromise = register(username.trim())
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Registration timeout after 60 seconds')), 60000)
      )

      await Promise.race([registrationPromise, timeoutPromise])

      console.log('[Header] Registration completed successfully')
      setUsername('')
      onClose()
    } catch (error: any) {
      console.error('[Header] Registration failed:', error)

      // Show user-friendly error message
      toast({
        title: 'Registration Failed',
        description: error.message || 'Unable to complete registration. Please try again.',
        status: 'error',
        duration: 8000,
        isClosable: true,
      })
    } finally {
      console.log('[Header] Cleaning up registration state')
      setIsRegistering(false)
    }
  }

  useEffect(() => {
    const isValid = validateUsername(username)
    if (isValid) {
      setIsUsernameInvalid(false)
    }
  }, [username])

  const handleLogout = () => {
    logout()
  }

  const handleModalClose = () => {
    setUsername('')
    setIsUsernameInvalid(false)
    onClose()
  }

  return (
    <>
      <Box as="header" py={4} position="fixed" w="100%" top={0} zIndex={10}>
        <Flex as="nav" aria-label="Main navigation" justify="space-between" align="center" px={4}>
          <Box
            transform={`translateX(-${leftSlideValue}px)`}
            transition="transform 0.5s ease-in-out"
          >
            <Flex align="center" gap={3}>
              <Link href="/">
                <Heading as="h3" size="md" textAlign="center">
                  Genji
                </Heading>
              </Link>
            </Flex>
          </Box>

          <Flex
            gap={2}
            align="center"
            transform={`translateX(${rightSlideValue}px)`}
            transition="transform 0.5s ease-in-out"
          >
            {!isAuthenticated ? (
              <Flex align="center" gap={3}>
                <Button
                  variant="link"
                  fontSize="sm"
                  color="gray.300"
                  _hover={{ color: 'white', textDecoration: 'underline' }}
                  onClick={onOpen}
                >
                  {t.common.register}
                </Button>
                <Button
                  bg="#8c1c84"
                  color="white"
                  _hover={{
                    bg: '#6d1566',
                  }}
                  onClick={handleLogin}
                  isLoading={isLoading}
                  spinner={<Spinner size="16px" />}
                  loadingText="Authenticating..."
                  size="sm"
                >
                  {t.common.login}
                </Button>
              </Flex>
            ) : (
              <>
                <Box>
                  <Text fontSize="sm" color="gray.300">
                    {user?.displayName || user?.username}
                  </Text>
                </Box>
                <Button
                  bg="#8c1c84"
                  color="white"
                  _hover={{
                    bg: '#6d1566',
                  }}
                  onClick={handleLogout}
                  size="sm"
                  ml={4}
                >
                  {t.common.logout}
                </Button>
              </>
            )}
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Options"
                icon={<HamburgerIcon />}
                variant="ghost"
                size="sm"
              />
              <MenuList minWidth="auto">
                <Link href="/about" color="white">
                  <MenuItem fontSize="md" px={4} py={3}>
                    {t.navigation.about}
                  </MenuItem>
                </Link>
                <Link href="/settings" color="white">
                  <MenuItem fontSize="md" px={4} py={3}>
                    {t.navigation.settings}
                  </MenuItem>
                </Link>
              </MenuList>
            </Menu>
            <LanguageSelector />
          </Flex>
        </Flex>
      </Box>

      {/* Registration Modal */}
      <Modal isOpen={isOpen} onClose={handleModalClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Register New Account</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.400">
                An Ethereum wallet will be created and securely stored on your device, protected by
                your biometric or PIN thanks to{' '}
                <ChakraLink
                  href={'https://github.com/w3hc/w3pk/blob/main/src/auth/register.ts#L17-L102'}
                  color="#45a2f8"
                  isExternal
                >
                  w3pk
                </ChakraLink>
                .
              </Text>
              <FormControl isInvalid={isUsernameInvalid}>
                {' '}
                <FormLabel htmlFor="username-input">Username</FormLabel>
                <Input
                  id="username-input"
                  aria-describedby={isUsernameInvalid && username.trim() ? 'username-error' : undefined}
                  aria-invalid={isUsernameInvalid && username.trim() ? true : undefined}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  bg="gray.700"
                  border="1px solid"
                  borderColor="gray.600"
                  _hover={{ borderColor: 'gray.500' }}
                  _focus={{
                    borderColor: '#8c1c84',
                    boxShadow: '0 0 0 1px #8c1c84',
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && username.trim()) {
                      handleRegister()
                    }
                  }}
                />
                {isUsernameInvalid && username.trim() && (
                  <FormErrorMessage id="username-error">
                    Username must be 3-50 characters long and contain only letters, numbers,
                    underscores, and hyphens. It must start and end with a letter or number.
                  </FormErrorMessage>
                )}
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleModalClose}>
              Cancel
            </Button>
            <Button
              bg="#8c1c84"
              color="white"
              _hover={{ bg: '#6d1566' }}
              onClick={handleRegister}
              isLoading={isRegistering}
              spinner={<Spinner size="16px" />}
              loadingText="Creating..."
              isDisabled={!username.trim()}
            >
              Create Account
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
