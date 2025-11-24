'use client'

import { createToaster } from '@chakra-ui/react'
import { Toaster as ChakraToaster, ToastRoot, ToastTitle, ToastDescription } from '@chakra-ui/react/toast'

export const toaster = createToaster({
  placement: 'bottom',
  pauseOnPageIdle: true,
})

type ToastType = Parameters<Parameters<typeof ChakraToaster>[0]['children']>[0]

export const Toaster = () => {
  return (
    <ChakraToaster toaster={toaster}>
      {(toast: ToastType) => (
        <ToastRoot key={toast.id}>
          {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
          {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
        </ToastRoot>
      )}
    </ChakraToaster>
  )
}
