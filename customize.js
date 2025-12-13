#!/usr/bin/env node

/**
 * Customization script for genji-passkey template
 * Removes example pages/routes and customizes the project name
 * Self-destructs after successful completion
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('\n🎨 Genji Customization Tool\n')
  console.log('This will customize your project by:')
  console.log('  • Removing the /about page')
  console.log('  • Removing API routes')
  console.log('  • Changing the project name')
  console.log('  • Removing deploy.yml workflow')
  console.log('  • Updating translations')
  console.log('  • Replacing homepage content')
  console.log('  • Replacing header component')
  console.log('  • Removing this script\n')

  const confirm = await question('Do you want to continue? (y/n): ')
  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.')
    rl.close()
    return
  }

  const projectName = await question('\nEnter your project name: ')
  if (!projectName || projectName.trim() === '') {
    console.log('Error: Project name cannot be empty.')
    rl.close()
    return
  }

  const description = await question('Enter project description (optional): ')

  rl.close()

  console.log('\n🚀 Starting customization...\n')

  // 1. Remove /about page
  console.log('📄 Removing /about page...')
  const aboutDir = path.join(__dirname, 'src/app/about')
  if (fs.existsSync(aboutDir)) {
    fs.rmSync(aboutDir, { recursive: true, force: true })
    console.log('   ✓ Removed src/app/about/')
  }

  // 2. Remove API routes
  console.log('🔌 Removing API routes...')
  const apiDir = path.join(__dirname, 'src/app/api')
  if (fs.existsSync(apiDir)) {
    fs.rmSync(apiDir, { recursive: true, force: true })
    console.log('   ✓ Removed src/app/api/')
  }

  // 3. Update package.json
  console.log('📦 Updating package.json...')
  const packageJsonPath = path.join(__dirname, 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    packageJson.name = projectName.toLowerCase().replace(/\s+/g, '-')
    if (description) {
      packageJson.description = description
    }

    // Remove the customize script from package.json
    if (packageJson.scripts && packageJson.scripts.customize) {
      delete packageJson.scripts.customize
      console.log('   ✓ Removed "customize" script from package.json')
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
    console.log(`   ✓ Updated name to "${packageJson.name}"`)
  }

  // 4. Remove deploy.yml
  console.log('🚫 Removing deploy.yml...')
  const deployYmlPath = path.join(__dirname, '.github/workflows/deploy.yml')
  if (fs.existsSync(deployYmlPath)) {
    fs.unlinkSync(deployYmlPath)
    console.log('   ✓ Removed .github/workflows/deploy.yml')
  }

  // 5. Update translations
  console.log('🌐 Updating translations...')
  const translationsPath = path.join(__dirname, 'src/translations/index.ts')
  if (fs.existsSync(translationsPath)) {
    let content = fs.readFileSync(translationsPath, 'utf8')

    // Remove 'about' from navigation type and all translations
    content = content.replace(/\s+navigation:\s*\{\s*about:\s*string[^}]*\}/gm, match => {
      return match.replace(/\s*about:\s*string\s*/g, '')
    })

    // Remove about translation entries from each language
    content = content.replace(/\s+navigation:\s*\{\s*about:\s*[^,\n]+,?\s*/gm, match => {
      return match.replace(/about:\s*[^,\n]+,?\s*/g, '')
    })

    // Clean up empty navigation objects and trailing commas
    content = content.replace(/navigation:\s*\{\s*,?\s*\}/g, 'navigation: {}')
    content = content.replace(/,(\s*\})/g, '$1')

    fs.writeFileSync(translationsPath, content)
    console.log('   ✓ Updated translations (removed about navigation)')
  }

  // 6. Replace header component
  console.log('📋 Replacing header component...')
  const headerPath = path.join(__dirname, 'src/components/Header.tsx')
  if (fs.existsSync(headerPath)) {
    const newHeaderContent = `'use client'

import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  useDisclosure,
  VStack,
  Link as ChakraLink,
  CloseButton,
} from '@chakra-ui/react'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { MenuRoot, MenuTrigger, MenuPositioner, MenuContent, MenuItem } from '@/components/ui/menu'
import { Dialog, Portal } from '@/components/ui/dialog'
import Link from 'next/link'
import { HiMenu } from 'react-icons/hi'
import LanguageSelector from './LanguageSelector'
import Spinner from './Spinner'
import { useTranslation } from '@/hooks/useTranslation'
import { useW3PK } from '@/context/W3PK'
import { useState, useEffect } from 'react'
import { toaster } from '@/components/ui/toaster'
import { brandColors } from '@/theme'

export default function Header() {
  const { isAuthenticated, user, isLoading, login, register, logout } = useW3PK()
  const t = useTranslation()
  const { open: isOpen, onOpen, onClose } = useDisclosure()
  const [username, setUsername] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [isUsernameInvalid, setIsUsernameInvalid] = useState(false)

  const [scrollPosition, setScrollPosition] = useState(0)

  const shouldSlide = scrollPosition > 0
  const leftSlideValue = shouldSlide ? 2000 : 0
  const rightSlideValue = shouldSlide ? 2000 : 0

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
    // Check if credentials exist in localStorage or IndexedDB
    const hasCredentials = await checkForExistingCredentials()

    if (hasCredentials) {
      // User has credentials - perform normal login
      await login()
    } else {
      // No credentials - prompt for registration
      onOpen()
    }
  }

  const checkForExistingCredentials = async (): Promise<boolean> => {
    try {
      if (typeof window === 'undefined') {
        return false
      }

      // First check for persistent session in IndexedDB
      if (window.indexedDB) {
        const dbName = 'Web3PasskeyPersistentSessions'
        const storeName = 'sessions'

        const hasPersistentSession = await new Promise<boolean>(resolve => {
          const request = indexedDB.open(dbName)

          request.onerror = () => {
            resolve(false)
          }

          request.onsuccess = event => {
            const db = (event.target as IDBOpenDBRequest).result

            if (!db.objectStoreNames.contains(storeName)) {
              db.close()
              resolve(false)
              return
            }

            try {
              const transaction = db.transaction([storeName], 'readonly')
              const objectStore = transaction.objectStore(storeName)
              const countRequest = objectStore.count()

              countRequest.onsuccess = () => {
                db.close()
                resolve(countRequest.result > 0)
              }

              countRequest.onerror = () => {
                db.close()
                resolve(false)
              }
            } catch {
              db.close()
              resolve(false)
            }
          }
        })

        if (hasPersistentSession) {
          return true
        }
      }

      // Then check for w3pk_credential_index in localStorage
      const credentialIndex = localStorage.getItem('w3pk_credential_index')
      if (credentialIndex) {
        return true
      }

      return false
    } catch {
      return false
    }
  }

  const handleRegister = async () => {
    if (!username.trim()) {
      toaster.create({
        title: 'Username Required',
        description: 'Please enter a username to register.',
        type: 'warning',
        duration: 3000,
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
      toaster.create({
        title: 'Registration Failed',
        description: error.message || 'Unable to complete registration. Please try again.',
        type: 'error',
        duration: 8000,
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
      <Box as="header" py={4} position="fixed" w="100%" top={0} zIndex={10} overflow="visible">
        <Container maxW="100%" px={{ base: 4, md: 6 }} overflow="visible">
          <Flex
            as="nav"
            aria-label="Main navigation"
            justify="space-between"
            align="center"
            overflow="visible"
          >
            <Box
              transform={\`translateX(-\${leftSlideValue}px)\`}
              transition="transform 0.5s ease-in-out"
              suppressHydrationWarning
            >
              <Flex align="center" gap={3}>
                <Link href="/">
                  <Flex align="center" gap={5}>
                    <Heading as="h3" size="md" textAlign="center">
                      My app
                    </Heading>
                  </Flex>
                </Link>
              </Flex>
            </Box>

            <Flex
              gap={2}
              align="center"
              transform={\`translateX(\${rightSlideValue}px)\`}
              transition="transform 0.5s ease-in-out"
              suppressHydrationWarning
            >
              {!isAuthenticated ? (
                <Button
                  bg={brandColors.primary}
                  color="white"
                  _hover={{
                    bg: brandColors.secondary,
                  }}
                  onClick={handleLogin}
                  size="xs"
                  px={4}
                >
                  {t.common.login}
                </Button>
              ) : (
                <>
                  {/* <Box>
                    <Text fontSize="sm" color="gray.300">
                      {user?.displayName || user?.username}
                    </Text>
                  </Box> */}
                  <Button
                    bg={brandColors.primary}
                    color="white"
                    _hover={{
                      bg: brandColors.secondary,
                    }}
                    onClick={handleLogout}
                    size="xs"
                    ml={4}
                    px={4}
                  >
                    {t.common.logout}
                  </Button>
                </>
              )}
              <MenuRoot>
                <MenuTrigger asChild>
                  <IconButton aria-label="Options" variant="ghost" size="sm">
                    <HiMenu />
                  </IconButton>
                </MenuTrigger>
                <Portal>
                  <MenuPositioner>
                    <MenuContent minWidth="auto">
                      <Link href="/settings" color="white">
                        <MenuItem value="settings" fontSize="md" px={4} py={3}>
                          {t.navigation.settings}
                        </MenuItem>
                      </Link>
                    </MenuContent>
                  </MenuPositioner>
                </Portal>
              </MenuRoot>
              <LanguageSelector />
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* Registration Modal */}
      <Dialog.Root
        open={isOpen}
        onOpenChange={(e: { open: boolean }) => (e.open ? null : handleModalClose())}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content p={6}>
              <Dialog.Header>
                <Dialog.Title>Register New Account</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body pt={4}>
                <VStack gap={4}>
                  <Text fontSize="sm" color="gray.400">
                    An Ethereum wallet will be created and securely stored on your device, protected
                    by your biometric or PIN thanks to{' '}
                    <ChakraLink
                      href={'https://github.com/w3hc/w3pk/blob/main/src/auth/register.ts#L17-L102'}
                      color={brandColors.accent}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      w3pk
                    </ChakraLink>
                    .
                  </Text>
                  <Field invalid={isUsernameInvalid} label="Username">
                    <Input
                      id="username-input"
                      aria-describedby={
                        isUsernameInvalid && username.trim() ? 'username-error' : undefined
                      }
                      aria-invalid={isUsernameInvalid && username.trim() ? true : undefined}
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      pl={3}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && username.trim()) {
                          handleRegister()
                        }
                      }}
                    />
                    {isUsernameInvalid && username.trim() && (
                      <Field.ErrorText id="username-error">
                        Username must be 3-50 characters long and contain only letters, numbers,
                        underscores, and hyphens. It must start and end with a letter or number.
                      </Field.ErrorText>
                    )}
                  </Field>
                </VStack>
              </Dialog.Body>

              <Dialog.Footer gap={3} pt={6}>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Cancel</Button>
                </Dialog.ActionTrigger>
                <Button colorPalette="blue" onClick={handleRegister} disabled={!username.trim()}>
                  {isRegistering && <Spinner size="50px" />}
                  {!isRegistering && 'Create Account'}
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
`
    fs.writeFileSync(headerPath, newHeaderContent)
    console.log('   ✓ Replaced header component in src/components/Header.tsx')
  }

  // 7. Replace homepage content
  console.log('🏠 Replacing homepage content...')
  const homepagePath = path.join(__dirname, 'src/app/page.tsx')
  if (fs.existsSync(homepagePath)) {
    const newHomepageContent = `'use client'

import { Text, VStack, Box, Heading } from '@chakra-ui/react'
import { Button } from '@/components/ui/button'
import { useW3PK } from '@/context/W3PK'
import { useTranslation } from '@/hooks/useTranslation'
import { useState, useEffect } from 'react'
import { toaster } from '@/components/ui/toaster'

const shimmerStyles = \`
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
\`

export default function Home() {
  const { isAuthenticated, user, login, signMessage, deriveWallet, getAddress } = useW3PK()
  const t = useTranslation()
  const [primaryAddress, setPrimaryAddress] = useState<string>('')
  const [mainAddress, setMainAddress] = useState<string>('')
  const [openbarAddress, setOpenbarAddress] = useState<string>('')
  const [isLoadingMain, setIsLoadingMain] = useState(false)

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
    const message = \`Sign this message from \${addressType} address: \${address}\`

    try {
      const signature = await signMessage(message)
      if (signature) {
        toaster.create({
          title: 'Message Signed',
          description: \`Signature: \${signature.substring(0, 20)}...\`,
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
                <Button
                  colorPalette="blue"
                  onClick={() => handleSignMessage('Hello world!', mainAddress)}
                  disabled={!mainAddress}
                  size="sm"
                >
                  Sign a message
                </Button>
              </Box>
            </VStack>
          </>
        )}
      </VStack>
    </>
  )
}
`
    fs.writeFileSync(homepagePath, newHomepageContent)
    console.log('   ✓ Replaced homepage content in src/app/page.tsx')
  }

  // 8. Self-destruct - Remove this script and related files
  console.log('🗑️  Removing customization scripts...')
  const scriptPath = path.join(__dirname, 'customize.js')
  const tsScriptPath = path.join(__dirname, 'customize.ts')
  const testScriptPath = path.join(__dirname, 'test-customize.js')

  setTimeout(() => {
    try {
      if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath)
        console.log('   ✓ Removed customize.js')
      }
      if (fs.existsSync(tsScriptPath)) {
        fs.unlinkSync(tsScriptPath)
        console.log('   ✓ Removed customize.ts')
      }
      if (fs.existsSync(testScriptPath)) {
        fs.unlinkSync(testScriptPath)
        console.log('   ✓ Removed test-customize.js')
      }

      console.log('\n✅ Customization complete!\n')
      console.log('Next steps:')
      console.log('  1. Review the changes')
      console.log('  2. Run: pnpm install')
      console.log('  3. Run: pnpm dev')
      console.log('\n💡 Your project is ready to build!\n')
    } catch (error) {
      console.error('Warning: Could not remove script files:', error)
      console.log('\nYou can manually delete customize.js and test-customize.js\n')
    }
  }, 100)
}

main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
