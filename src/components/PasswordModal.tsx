import React, { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Text,
  FormErrorMessage,
  FormHelperText,
  List,
  ListItem,
  ListIcon,
  Box,
} from '@chakra-ui/react'
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons'
import { isStrongPassword } from 'w3pk'

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
  const toast = useToast()

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
      toast({
        title: 'Password Required.',
        description: 'Please enter your password.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!isPasswordStrong) {
      toast({
        title: 'Weak Password.',
        description: 'Please use a stronger password that meets all requirements.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
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
      toast({
        title: 'Submission Error.',
        description: (error as Error).message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
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
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {/* Use the Text component here */}
          <Text mb={4}>{description}</Text>
          <FormControl isRequired isInvalid={passwordTouched && !isPasswordStrong}>
            <FormLabel htmlFor="password">Password</FormLabel>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              autoFocus
            />
            {passwordTouched && !isPasswordStrong && (
              <FormErrorMessage>
                Password does not meet all requirements
              </FormErrorMessage>
            )}
            {passwordTouched && isPasswordStrong && (
              <FormHelperText color="green.400">
                Strong password!
              </FormHelperText>
            )}
          </FormControl>

          {/* Password Requirements */}
          <Box mt={4}>
            <Text fontSize="sm" fontWeight="bold" mb={2} color="white">
              Password must include:
            </Text>
            <List spacing={1} fontSize="sm">
              <ListItem color="white">
                <ListIcon
                  as={hasMinLength ? CheckCircleIcon : WarningIcon}
                  color={hasMinLength ? 'green.500' : 'gray.400'}
                />
                At least 12 characters
              </ListItem>
              <ListItem color="white">
                <ListIcon
                  as={hasUpperCase ? CheckCircleIcon : WarningIcon}
                  color={hasUpperCase ? 'green.500' : 'gray.400'}
                />
                One uppercase letter
              </ListItem>
              <ListItem color="white">
                <ListIcon
                  as={hasLowerCase ? CheckCircleIcon : WarningIcon}
                  color={hasLowerCase ? 'green.500' : 'gray.400'}
                />
                One lowercase letter
              </ListItem>
              <ListItem color="white">
                <ListIcon
                  as={hasNumber ? CheckCircleIcon : WarningIcon}
                  color={hasNumber ? 'green.500' : 'gray.400'}
                />
                One number
              </ListItem>
              <ListItem color="white">
                <ListIcon
                  as={hasSpecialChar ? CheckCircleIcon : WarningIcon}
                  color={hasSpecialChar ? 'green.500' : 'gray.400'}
                />
                One special character
              </ListItem>
            </List>
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button onClick={handleClose} mr={3} variant="outline">
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!isPasswordStrong}
          >
            Submit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default PasswordModal
