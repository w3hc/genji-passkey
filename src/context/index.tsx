'use client'

import { type ReactNode, memo } from 'react'
import { ChakraProvider, extendTheme, Center } from '@chakra-ui/react'
import Spinner from '@/components/Spinner'
import dynamic from 'next/dynamic'

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: '#000000',
        color: 'white',
      },
    },
  },
})

// Dynamically import W3pkProvider to avoid SSR issues with w3pk dependencies
const W3pkProvider = dynamic(() => import('./W3PK').then(mod => ({ default: mod.W3pkProvider })), {
  ssr: false,
  loading: () => (
    <Center h="100vh">
      <Spinner size="200px" />
    </Center>
  ),
})

const ContextProvider = memo(function ContextProvider({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      <W3pkProvider>{children}</W3pkProvider>
    </ChakraProvider>
  )
})

export default ContextProvider
