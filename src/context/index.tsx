'use client'

import { type ReactNode, memo } from 'react'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { ColorModeProvider } from '@/components/ui/color-mode'
import Spinner from '@/components/Spinner'
import dynamic from 'next/dynamic'

// Dynamically import W3pkProvider to avoid SSR issues with w3pk dependencies
const W3pkProvider = dynamic(() => import('./W3PK').then(mod => ({ default: mod.W3pkProvider })), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Spinner size="200px" />
    </div>
  ),
})

const ContextProvider = memo(function ContextProvider({ children }: { children: ReactNode }) {
  return (
    <ColorModeProvider defaultTheme="dark">
      <ChakraProvider value={defaultSystem}>
        <W3pkProvider>{children}</W3pkProvider>
      </ChakraProvider>
    </ColorModeProvider>
  )
})

export default ContextProvider
