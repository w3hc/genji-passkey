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
  const { isAuthenticated, user, login } = useW3PK()

  return (
    <Container maxW="container.md" py={20}>
      <VStack spacing={8} align="stretch">
        <Box p={6} borderRadius="md" textAlign="center" mb={8}>
          {isAuthenticated ? (
            <>
              <Heading as="h1" size="xl" mb={4}>
                Welcome!
              </Heading>
              <Text mb={6} color="gray.400">
                It&apos;s a pleasure to have you here!
              </Text>
              <Box h="20px" />
            </>
          ) : (
            <>
              <Heading as="h1" size="xl" mb={4}>
                Hello Anon!
              </Heading>
              <Text mb={6} color="gray.400">
                Sit back, relax, and build something cool!
              </Text>
              <Text fontSize="sm" color="gray.500">
                Please{' '}
                <Text
                  as="span"
                  color="gray.500"
                  textDecorationStyle="dotted"
                  textUnderlineOffset="3px"
                  cursor="pointer"
                  _hover={{ color: 'gray.300' }}
                  onClick={login}
                >
                  login
                </Text>
              </Text>
            </>
          )}
        </Box>
      </VStack>
    </Container>
  )
}
