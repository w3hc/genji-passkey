'use client'

import { Dialog as ChakraDialog, Portal } from '@chakra-ui/react'
import { forwardRef } from 'react'

const DialogContent = forwardRef<HTMLDivElement, any>((props, ref) => {
  return <ChakraDialog.Content ref={ref} p={6} {...props} />
})

DialogContent.displayName = 'DialogContent'

export const Dialog = {
  Root: ChakraDialog.Root,
  Trigger: ChakraDialog.Trigger,
  Backdrop: ChakraDialog.Backdrop,
  Positioner: ChakraDialog.Positioner,
  Content: DialogContent,
  Header: ChakraDialog.Header,
  Title: ChakraDialog.Title,
  Description: ChakraDialog.Description,
  Body: ChakraDialog.Body,
  Footer: ChakraDialog.Footer,
  CloseTrigger: ChakraDialog.CloseTrigger,
  ActionTrigger: ChakraDialog.ActionTrigger,
}

export { Portal }
