'use client'

import { Button as ChakraButton } from '@chakra-ui/react'
import { forwardRef } from 'react'

export const Button = forwardRef<HTMLButtonElement, React.ComponentProps<typeof ChakraButton>>(
  (props, ref) => {
    const minPadding = 6
    const paddingX = props.px !== undefined ? Math.max(Number(props.px), minPadding) : minPadding

    return <ChakraButton ref={ref} {...props} px={paddingX} />
  }
)

Button.displayName = 'Button'
