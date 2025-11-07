'use client'

import {
  Container,
  Text,
  VStack,
  Box,
  Heading,
  SimpleGrid,
  Icon,
  Flex,
  HStack,
} from '@chakra-ui/react'
import { useW3PK } from '@/context/W3PK'
import Link from 'next/link'
import { FiEdit3, FiUpload, FiShield, FiEye } from 'react-icons/fi'
import { FaGithub, FaNpm } from 'react-icons/fa'

export default function Home() {
  const { isAuthenticated, user } = useW3PK()

  return (
    <Container maxW="container.md" py={20}>
      <VStack spacing={8} align="stretch">
        {isAuthenticated ? (
          <>
            <Box textAlign="center" mb={8}>
              <Heading as="h1" size="xl" mb={4}>
                Welcome {user?.displayName || user?.username}!
              </Heading>
              <Text color="gray.400" mb={2}>
                It&apos;s a pleasure to have you here!
              </Text>
              <Text color="gray.400" mb={0}>
                Sit back, relax, and enjoy!
              </Text>

              <Text mt={12} fontSize="md" color="white">
                <strong>{user?.id}</strong>
              </Text>
            </Box>

            {/* Code Showcase */}
            <Box
              mt={3}
              // bg="gray.900"
              borderRadius="3xl"
              overflow="hidden"
              position="relative"
              // mb={8}
              // _before={{
              //   content: '""',
              //   position: 'absolute',
              //   inset: '-3px',
              //   borderRadius: 'xl',
              //   padding: '4px',
              //   background: 'linear-gradient(135deg, #8c1c84 0%, #45a2f8 50%, #8c1c84 100%)',
              //   WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              //   WebkitMaskComposite: 'xor',
              //   maskComposite: 'exclude',
              // }}
              // boxShadow="0 0 80px rgba(69, 162, 248, 0.3), 0 0 80px rgba(140, 28, 132, 0.2)"
            >
              <Box
                bg="gray.900"
                p={12}
                fontFamily="monospace"
                fontSize="md"
                // overflowX="auto"
                // position="relative"
                // zIndex={1}
              >
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
                  {/* <Text as="span" color="#9ca3af">
                    ,
                  </Text> */}
                </Text>
                <Text color="#9ca3af" ml={4} mb={1}>
                  {/* <Text as="span" color="#45a2f8">
                    ethereumAddress
                  </Text>
                  <Text as="span" color="#9ca3af">
                    :{' '}
                  </Text>
                  <Text as="span" color="#fbbf24">
                    &apos;0x0000000000000000000000000000000000000000&apos;
                  </Text>
                  <Text as="span" color="#9ca3af">
                    ,
                  </Text> */}
                </Text>
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
            {/* Action Boxes */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Link href="/sig">
                <Box
                  bg="gray.800"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                  _hover={{
                    borderColor: '#8c1c84',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(140, 28, 132, 0.15)',
                  }}
                  transition="all 0.3s ease"
                  cursor="pointer"
                  height="160px"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                >
                  <Box>
                    <Flex align="center" mb={3}>
                      <Box bg="#8c1c84" p={2} borderRadius="md" mr={3}>
                        <Icon as={FiEdit3} color="white" boxSize={5} />
                      </Box>
                      <Heading as="h3" size="md" color="white">
                        Sign Message
                      </Heading>
                    </Flex>
                    <Text color="gray.400" fontSize="sm">
                      Sign messages with the wallet stored on your own device
                    </Text>
                  </Box>
                  <Text mt={2} color="#8c1c84" fontSize="xs" fontWeight="semibold">
                    Sign →
                  </Text>
                </Box>
              </Link>

              <Link href="/settings">
                <Box
                  bg="gray.800"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                  _hover={{
                    borderColor: '#8c1c84',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(140, 28, 132, 0.15)',
                  }}
                  transition="all 0.3s ease"
                  cursor="pointer"
                  height="160px"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                >
                  <Box>
                    <Flex align="center" mb={3}>
                      <Box bg="#8c1c84" p={2} borderRadius="md" mr={3}>
                        <Icon as={FiShield} color="white" boxSize={5} />
                      </Box>
                      <Heading as="h3" size="md" color="white">
                        Settings
                      </Heading>
                    </Flex>
                    <Text color="gray.400" fontSize="sm">
                      Manage your backup, recovery and sync
                    </Text>
                  </Box>
                  <Text mt={2} color="#8c1c84" fontSize="xs" fontWeight="semibold">
                    Settings →
                  </Text>
                </Box>
              </Link>
            </SimpleGrid>

            {/* Additional Info */}
            <Box bg="gray.800" p={4} borderRadius="md" textAlign="center">
              <Text fontSize="sm" color="gray.400" mb={2}>
                Your account is secured with w3pk (passkey)
              </Text>
              <Text fontSize="xs" color="blue.300">
                🔐 All operations require biometric or security key verification
              </Text>
            </Box>
          </>
        ) : (
          <VStack spacing={8} align="stretch">
            {/* <Box bg="whiteAlpha.50" p={6} borderRadius="md" textAlign="center" mb={10}> */}
            <Box p={6} borderRadius="md" textAlign="center" mb={8}>
              <Heading as="h1" size="xl" mb={4}>
                Hello Anon!
              </Heading>
              <Text mb={6} color="gray.400">
                Not your keys, not your coins.
              </Text>
              <Text fontSize="sm" color="gray.500">
                Please register or login
              </Text>
            </Box>

            {/* Code Showcase */}
            <Box
              mt={3}
              // bg="gray.900"
              borderRadius="3xl"
              overflow="hidden"
              position="relative"
              // mb={8}
              // _before={{
              //   content: '""',
              //   position: 'absolute',
              //   inset: '-3px',
              //   borderRadius: 'xl',
              //   padding: '4px',
              //   background: 'linear-gradient(135deg, #8c1c84 0%, #45a2f8 50%, #8c1c84 100%)',
              //   WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              //   WebkitMaskComposite: 'xor',
              //   maskComposite: 'exclude',
              // }}
              // boxShadow="0 0 80px rgba(69, 162, 248, 0.3), 0 0 80px rgba(140, 28, 132, 0.2)"
            >
              <Box
                bg="gray.900"
                p={12}
                fontFamily="monospace"
                fontSize="md"
                // overflowX="auto"
                // position="relative"
                // zIndex={1}
              >
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
                  {/* <Text as="span" color="#9ca3af">
                    ,
                  </Text> */}
                </Text>
                <Text color="#9ca3af" ml={4} mb={1}>
                  {/* <Text as="span" color="#45a2f8">
                    ethereumAddress
                  </Text>
                  <Text as="span" color="#9ca3af">
                    :{' '}
                  </Text>
                  <Text as="span" color="#fbbf24">
                    &apos;0x0000000000000000000000000000000000000000&apos;
                  </Text>
                  <Text as="span" color="#9ca3af">
                    ,
                  </Text> */}
                </Text>
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
        )}
      </VStack>
    </Container>
  )
}
