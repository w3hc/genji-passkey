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

  // 6. Replace homepage content
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

  // 7. Self-destruct - Remove this script and related files
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
