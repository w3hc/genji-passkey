'use client'

import { Button as ChakraButton } from "@chakra-ui/react"
import { forwardRef } from "react"

export const Button = forwardRef<HTMLButtonElement, React.ComponentProps<typeof ChakraButton>>((props, ref) => {
  return <ChakraButton ref={ref} px={props.px ?? 6} {...props} />
})

Button.displayName = 'Button'
