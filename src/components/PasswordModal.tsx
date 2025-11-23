import React, { useState, useEffect } from 'react'
import { Text, Box, Flex, CloseButton } from '@chakra-ui/react'
import { Dialog, Portal } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ListRoot, ListItem } from '@/components/ui/list'
import { Field } from '@/components/ui/field'
import { MdCheckCircle, MdWarning } from 'react-icons/md'
import { isStrongPassword } from 'w3pk'
import { toaster } from '@/components/ui/toaster'

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (password: string) => void
  title: string
  description: string
}

const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  description, // Use the description prop here
}) => {
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPasswordStrong, setIsPasswordStrong] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)

  // Validate password strength in real-time
  useEffect(() => {
    if (password) {
      setIsPasswordStrong(isStrongPassword(password))
    } else {
      setIsPasswordStrong(false)
    }
  }, [password])

  const handleSubmit = async () => {
    if (!password.trim()) {
      toaster.create({
        title: 'Password Required.',
        description: 'Please enter your password.',
        type: 'warning',
        duration: 3000,
      })
      return
    }

    if (!isPasswordStrong) {
      toaster.create({
        title: 'Weak Password.',
        description: 'Please use a stronger password that meets all requirements.',
        type: 'warning',
        duration: 3000,
      })
      return
    }

    setIsSubmitting(true)
    try {
      onSubmit(password)
      setPassword('') // Clear password after successful submission
      setPasswordTouched(false)
    } catch (error) {
      console.error('Error in password modal submit:', error)
      toaster.create({
        title: 'Submission Error.',
        description: (error as Error).message || 'An unexpected error occurred.',
        type: 'error',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
      // Optionally close the modal here if onSubmit handles success/failure states
      // onClose(); // Or let the parent component control closing
    }
  }

  const handleClose = () => {
    setPassword('') // Clear password when closing
    setPasswordTouched(false)
    onClose()
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (!passwordTouched && e.target.value.length > 0) {
      setPasswordTouched(true)
    }
  }

  // Password strength requirements
  const hasMinLength = password.length >= 12
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e: { open: boolean }) => (e.open ? null : handleClose())}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content p={6}>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body pt={4}>
          <Text mb={4}>{description}</Text>
          <Field required invalid={passwordTouched && !isPasswordStrong}>
            <Field.Label htmlFor="password">Password</Field.Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              aria-describedby="password-requirements password-status"
              aria-invalid={passwordTouched && !isPasswordStrong ? true : undefined}
              autoFocus
              pl={3}
            />
            {passwordTouched && !isPasswordStrong && (
              <Field.ErrorText id="password-status">
                Password does not meet all requirements
              </Field.ErrorText>
            )}
            {passwordTouched && isPasswordStrong && (
              <Field.HelperText id="password-status" color="green.400">
                Strong password!
              </Field.HelperText>
            )}
          </Field>

          {/* Password Requirements */}
          <Box mt={4} id="password-requirements" aria-live="polite" aria-atomic="false">
            <Text fontSize="sm" fontWeight="bold" mb={2} color="white">
              Password must include:
            </Text>
            <Flex align="center" gap={2}>
              {hasMinLength ? <MdCheckCircle color="green" /> : <MdWarning color="gray" />}
              At least 12 characters
              <span className="sr-only">{hasMinLength ? ' (satisfied)' : ' (required)'}</span>
            </Flex>

            <Flex align="center" gap={2}>
              {hasUpperCase ? <MdCheckCircle color="green" /> : <MdWarning color="gray" />}
              One uppercase letter
            </Flex>
            <span className="sr-only">{hasUpperCase ? ' (satisfied)' : ' (required)'}</span>
            <Flex align="center" gap={2}>
              {hasLowerCase ? <MdCheckCircle color="green" /> : <MdWarning color="gray" />}
              One lowercase letter
            </Flex>
            <span className="sr-only">{hasLowerCase ? ' (satisfied)' : ' (required)'}</span>
            <Flex align="center" gap={2}>
              {hasNumber ? <MdCheckCircle color="green" /> : <MdWarning color="gray" />}
              One number
            </Flex>
            <span className="sr-only">{hasNumber ? ' (satisfied)' : ' (required)'}</span>
            <Flex align="center" gap={2}>
              {hasSpecialChar ? <MdCheckCircle color="green" /> : <MdWarning color="gray" />}
              One special character
            </Flex>
            <span className="sr-only">{hasSpecialChar ? ' (satisfied)' : ' (required)'}</span>
          </Box>
            </Dialog.Body>

            <Dialog.Footer gap={3} pt={6}>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="blue"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={!isPasswordStrong}
              >
                Submit
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

export default PasswordModal
