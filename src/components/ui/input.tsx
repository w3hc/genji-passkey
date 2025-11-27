'use client'

import { Input as ChakraInput } from "@chakra-ui/react"
import { forwardRef } from "react"

export const Input = forwardRef<HTMLInputElement, React.ComponentProps<typeof ChakraInput>>((props, ref) => {
  return (
    <ChakraInput
      ref={ref}
      px={3}
      {...props}
    />
  )
})

Input.displayName = 'Input'
