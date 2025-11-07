'use client'

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useEffect,
} from 'react'
import { useToast } from '@chakra-ui/react'
import {
  createWeb3Passkey,
  StealthKeys,
  generateStealthAddress as generateStealthAddressFromMetaAddress,
} from 'w3pk'

interface SecurityScore {
  total: number // 0-100
  level: string // e.g., "vulnerable", "protected"
  nextMilestone?: string // e.g., "Create encrypted backup to reach \"protected\" (40+ pts)"
  breakdown?: Record<string, number> // e.g., { encryptedBackup: 0, passkeyActive: 20, ... }
  // Add other potential fields if the SDK returns more details
}

interface BackupStatus {
  securityScore: SecurityScore
  passkeySync?: {
    // Add other fields as needed
    enabled: boolean
    deviceCount: number
    // ...
  }
  recoveryPhrase?: {
    verified: boolean
    // ...
  }
  // Add other potential fields reported by getBackupStatus
  // e.g., backupExists?: boolean;
}

interface W3pkUser {
  id: string
  username: string
  displayName: string
  ethereumAddress: string
}

interface DerivedWallet {
  address: string
  privateKey?: string
}

interface W3pkType {
  isAuthenticated: boolean
  user: W3pkUser | null
  isLoading: boolean
  login: () => Promise<void>
  register: (username: string) => Promise<void>
  logout: () => void
  signMessage: (message: string) => Promise<string | null>
  deriveWallet: (index: number) => Promise<DerivedWallet>
  generateStealthAddress: () => Promise<{
    stealthAddress: string
    stealthPrivateKey: string
    ephemeralPublicKey: string
  } | null>
  generateStealthAddressFor: (recipientMetaAddress: string) => Promise<{
    stealthAddress: string
    ephemeralPublicKey: string
    viewTag: string
  } | null>
  getStealthKeys: () => Promise<StealthKeys | null>
  getBackupStatus: () => Promise<BackupStatus>
  createZipBackup: (password: string) => Promise<Blob>
}

// TODO: remove logging
interface DebugInfo {
  username: string
  w3pkVersion?: string
  challenge?: string
  credentialId?: string
  attestationObject?: string
  clientDataJSON?: string
  error?: {
    name: string
    message: string
    stack?: string
  }
}

const W3PK = createContext<W3pkType>({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  login: async () => {},
  register: async (_username: string) => {},
  logout: () => {},
  signMessage: async (_message: string) => null,
  deriveWallet: async (_index: number) => ({ address: '', privateKey: '' }),
  generateStealthAddress: async () => null,
  generateStealthAddressFor: async (_recipientMetaAddress: string) => null,
  getStealthKeys: async () => null,
  getBackupStatus: async (): Promise<BackupStatus> => {
    throw new Error('getBackupStatus not initialized')
  },
  createZipBackup: async (_password: string): Promise<Blob> => {
    throw new Error('createZipBackup not initialized')
  },
})

export const useW3PK = () => useContext(W3PK)

interface W3pkProviderProps {
  children: ReactNode
}

export const W3pkProvider: React.FC<W3pkProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<W3pkUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const toast = useToast()

  // Helper function to check if error is user-cancelled WebAuthn
  const isUserCancelledError = (error: any): boolean => {
    return (
      error?.name === 'NotAllowedError' ||
      error?.message?.includes('NotAllowedError') ||
      error?.message?.includes('timed out') ||
      error?.message?.includes('not allowed')
    )
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Stable callback to prevent w3pk re-creation
  const handleAuthStateChanged = useCallback((isAuth: boolean, w3pkUser?: any) => {
    if (isAuth && w3pkUser) {
      const userData: W3pkUser = {
        id: w3pkUser.id,
        username: w3pkUser.username,
        displayName: w3pkUser.displayName,
        ethereumAddress: w3pkUser.ethereumAddress,
      }
      setUser(userData)
      setIsAuthenticated(true)

      // Store authentication state in localStorage with expiration (24 hours)
      if (typeof window !== 'undefined' && window.localStorage) {
        const authStateData = {
          isAuthenticated: true,
          user: userData,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        }
        localStorage.setItem('w3pk_auth_state', JSON.stringify(authStateData))
      }
    } else {
      setUser(null)
      setIsAuthenticated(false)

      // Clear stored authentication state
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('w3pk_auth_state')
      }
    }
  }, [])

  // Initialize w3pk SDK with stealth address capabilities only
  const w3pk = useMemo(
    () =>
      createWeb3Passkey({
        stealthAddresses: {}, // Enable stealth address generation
        debug: process.env.NODE_ENV === 'development',
        onAuthStateChanged: handleAuthStateChanged,
      }),
    [handleAuthStateChanged]
  )

  // Check for existing authentication state on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      if (!isMounted || !w3pk) return

      try {
        console.log('Checking for existing authentication state...')

        // Check if w3pk already has an authenticated user
        if (w3pk.isAuthenticated && w3pk.user) {
          console.log('Found existing w3pk authentication, restoring state...')
          handleAuthStateChanged(true, w3pk.user)
          return
        }

        // Check for stored authentication state in localStorage (if available)
        if (typeof window !== 'undefined' && window.localStorage) {
          const storedAuthState = localStorage.getItem('w3pk_auth_state')
          if (storedAuthState) {
            try {
              const authData = JSON.parse(storedAuthState)
              if (authData.isAuthenticated && authData.user && authData.expiresAt > Date.now()) {
                console.log('Found valid stored authentication, restoring...')
                handleAuthStateChanged(true, authData.user)
                return
              } else {
                console.log('Stored authentication expired, clearing...')
                localStorage.removeItem('w3pk_auth_state')
              }
            } catch (parseError) {
              console.error('Failed to parse stored auth state:', parseError)
              localStorage.removeItem('w3pk_auth_state')
            }
          }
        }

        console.log('No existing authentication found')
        handleAuthStateChanged(false)
      } catch (error) {
        console.error('Error checking authentication state:', error)
        handleAuthStateChanged(false)
      }
    }

    checkExistingAuth()
  }, [isMounted, w3pk, handleAuthStateChanged])

  // TODO: remove logging
  const sendDebugInfo = async (debugInfo: DebugInfo) => {
    try {
      const response = await fetch('/api/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(debugInfo),
      })

      if (!response.ok) {
        console.error(
          '[W3PK] Failed to send debug info to server:',
          response.status,
          response.statusText
        )
      } else {
        console.log('[W3PK] Debug info successfully sent to server.')
      }
    } catch (fetchError) {
      console.error('[W3PK] Error sending debug info to server:', fetchError)
    }
  }

  const register = async (username: string) => {
    // TODO: remove logging
    let capturedChallenge: string | undefined = undefined
    let capturedCredentialId: string | undefined = undefined
    let capturedAttestationObject: string | undefined = undefined
    let capturedClientDataJSON: string | undefined = undefined

    try {
      setIsLoading(true)
      console.log('=== Starting Registration with w3pk ===')
      console.log('Username:', username)
      console.log('w3pk instance:', w3pk)
      // Add timeout wrapper to detect hanging registration
      const registrationPromise = w3pk.register({
        username,
      })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          console.error('[W3PK] Registration timeout - w3pk.register() did not complete')
          reject(
            new Error(
              'Registration timed out. Please try again or check browser console for errors.'
            )
          )
        }, 45000)
      )

      await Promise.race([registrationPromise, timeoutPromise])

      console.log('Registration successful')

      toast({
        title: 'Done! 🎉',
        description:
          "Your encrypted wallet has been created and stored on your device. Don't forget to back it up!",
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      console.error('Registration failed:', error)
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      })

      // TODO: remove logging
      const debugInfo: DebugInfo = {
        username,
        error: {
          name: error.name || 'UnknownError',
          message: error.message || 'Registration failed',
          stack: error.stack || 'No stack trace',
        },
      }

      if (error.message?.includes('atob')) {
        console.warn('[W3PK] Detected potential internal atob error in w3pk SDK.')
        console.log('[W3PK] Sending debug info for username:', username)
        await sendDebugInfo(debugInfo)
      } else {
        await sendDebugInfo(debugInfo)
      }

      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to register with w3pk',
        status: 'error',
        duration: 8000,
        isClosable: true,
      })
      throw error
    } finally {
      console.log('[W3PK] Registration cleanup, setting loading to false')
      setIsLoading(false)
    }
  }

  const login = async () => {
    try {
      setIsLoading(true)
      console.log('=== Starting Login with w3pk ===')

      const result = await w3pk.login()
      console.log('Login successful, user:', result.username)

      const hasWallet = w3pk.isAuthenticated
      const displayName = result.displayName || result.username || 'Anon'

      toast({
        title: 'Login Successful! ✅',
        description: hasWallet
          ? `Oh! It's you, ${displayName}! Welcome back! Your wallet is available.`
          : `Welcome back, ${displayName}! Welcome back! No wallet found on this device.`,
        status: hasWallet ? 'success' : 'warning',
        duration: 5000,
        isClosable: true,
      })
    } catch (error: any) {
      console.error('Authentication failed:', error)

      if (!isUserCancelledError(error)) {
        toast({
          title: 'Authentication Failed',
          description: error.message || 'Failed to authenticate with w3pk',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signMessage = async (message: string): Promise<string | null> => {
    if (!user) {
      toast({
        title: 'Not Authenticated',
        description: 'Please log in first.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    }

    try {
      console.log('=== Starting Message Signing with w3pk ===')

      // Check if we have an active session, if not, require fresh authentication
      const hasSession = w3pk.hasActiveSession()
      if (!hasSession) {
        console.log('No active session, requiring fresh authentication...')
        await w3pk.login()
        console.log('Fresh authentication completed')
      } else {
        console.log('Active session detected, using existing session')
      }

      const signature = await w3pk.signMessage(message)
      console.log('Message signed successfully')

      return signature
    } catch (error: any) {
      console.error('Message signing failed:', error)

      // Don't show toast for user-cancelled errors
      if (!isUserCancelledError(error)) {
        toast({
          title: 'Signing Failed',
          description: error.message || 'Failed to sign message with w3pk',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
      return null
    }
  }

  const deriveWallet = async (index: number): Promise<DerivedWallet> => {
    if (!user) {
      throw new Error('Not authenticated. Please log in first.')
    }

    try {
      console.log(`=== Deriving Wallet at Index ${index} ===`)

      // Check if we have an active session
      const hasSession = w3pk.hasActiveSession()
      if (!hasSession) {
        console.log('No active session, requiring fresh authentication...')
        await w3pk.login()
        console.log('Fresh authentication completed')
      } else {
        console.log('Active session detected, using existing session')
      }

      const derivedWallet = await w3pk.deriveWallet(index)
      console.log(`Wallet derived successfully at index ${index}:`, derivedWallet.address)

      return derivedWallet
    } catch (error: any) {
      console.error(`Wallet derivation failed at index ${index}:`, error)

      // If it's an auth error, try to login once and retry
      if (error.message?.includes('Not authenticated') || error.message?.includes('login')) {
        console.log('Authentication required, prompting for login...')
        try {
          await w3pk.login()
          const derivedWallet = await w3pk.deriveWallet(index)
          console.log(`Wallet derived successfully after re-authentication at index ${index}`)
          return derivedWallet
        } catch (retryError: any) {
          console.error('Retry after authentication failed:', retryError)

          // Don't show toast for user-cancelled errors
          if (!isUserCancelledError(retryError)) {
            toast({
              title: 'Authentication Required',
              description: 'Please authenticate to derive addresses',
              status: 'error',
              duration: 5000,
              isClosable: true,
            })
          }
          throw retryError
        }
      }

      // Don't show toast for user-cancelled errors
      if (!isUserCancelledError(error)) {
        toast({
          title: 'Derivation Failed',
          description: error.message || `Failed to derive wallet at index ${index}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
      throw error
    }
  }

  const logout = () => {
    w3pk.logout()

    toast({
      title: 'Logged Out',
      description: 'You have been logged out.',
      status: 'info',
      duration: 4000,
      isClosable: true,
    })
  }

  const generateStealthAddress = async (): Promise<{
    stealthAddress: string
    stealthPrivateKey: string
    ephemeralPublicKey: string
  } | null> => {
    if (!user) {
      toast({
        title: 'Not Authenticated',
        description: 'Please log in first',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    }

    try {
      console.log('=== Generating Stealth Address with w3pk ===')

      if (!w3pk.stealth) {
        throw new Error('Stealth address module not initialized')
      }

      // Generate stealth address (returns stealthAddress, ephemeralPublicKey, viewTag)
      const stealthResult = await w3pk.stealth.generateStealthAddress()
      console.log('Stealth address generated:', stealthResult.stealthAddress)

      // Get user's stealth keys to compute the private key
      const keys = await w3pk.stealth.getKeys()
      console.log('Retrieved stealth keys')

      // Import computeStealthPrivateKey from w3pk
      const { computeStealthPrivateKey } = await import('w3pk')

      // Compute the stealth private key
      const stealthPrivateKey = computeStealthPrivateKey(
        keys.viewingKey,
        keys.spendingKey,
        stealthResult.ephemeralPublicKey
      )
      console.log('Stealth private key computed')

      return {
        stealthAddress: stealthResult.stealthAddress,
        stealthPrivateKey,
        ephemeralPublicKey: stealthResult.ephemeralPublicKey,
      }
    } catch (error: any) {
      console.error('Stealth address generation failed:', error)
      toast({
        title: 'Stealth Address Failed',
        description: error.message || 'Failed to generate stealth address',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return null
    }
  }

  const generateStealthAddressFor = async (
    recipientMetaAddress: string
  ): Promise<{
    stealthAddress: string
    ephemeralPublicKey: string
    viewTag: string
  } | null> => {
    if (!user) {
      toast({
        title: 'Not Authenticated',
        description: 'Please log in first',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    }

    try {
      console.log('=== Generating Stealth Address for Recipient ===')
      console.log('Recipient meta-address:', recipientMetaAddress)

      // Call the ERC-5564 compliant generateStealthAddress function with recipient's meta-address
      const result = generateStealthAddressFromMetaAddress(recipientMetaAddress)

      console.log('Stealth address generated:', result.stealthAddress)
      console.log('Ephemeral public key:', result.ephemeralPubKey)
      console.log('View tag:', result.viewTag)

      return {
        stealthAddress: result.stealthAddress,
        ephemeralPublicKey: result.ephemeralPubKey,
        viewTag: result.viewTag,
      }
    } catch (error: any) {
      console.error('Stealth address generation failed:', error)
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate stealth address',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return null
    }
  }

  const getStealthKeys = async (): Promise<StealthKeys | null> => {
    if (!user) {
      toast({
        title: 'Not Authenticated',
        description: 'Please log in first',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    }

    try {
      console.log('=== Getting Stealth Keys with w3pk ===')

      if (!w3pk.stealth) {
        throw new Error('Stealth address module not initialized')
      }

      // Check if we have an active session
      const hasSession = w3pk.hasActiveSession()
      if (!hasSession) {
        console.log('No active session, requiring fresh authentication...')
        await w3pk.login()
        console.log('Fresh authentication completed')
      } else {
        console.log('Active session detected, using existing session')
      }

      const stealthKeys = await w3pk.stealth.getKeys()
      console.log('Stealth keys retrieved successfully')
      // @ts-ignore - stealthMetaAddress is in new ERC-5564 implementation
      console.log('Meta address:', stealthKeys.stealthMetaAddress || stealthKeys.metaAddress)

      return stealthKeys
    } catch (error: any) {
      console.error('Failed to get stealth keys:', error)

      // If it's an auth error, try to login once and retry
      if (error.message?.includes('Not authenticated') || error.message?.includes('login')) {
        console.log('Authentication required, prompting for login...')
        try {
          await w3pk.login()
          if (!w3pk.stealth) {
            throw new Error('Stealth address module not initialized')
          }
          const stealthKeys = await w3pk.stealth.getKeys()
          console.log('Stealth keys retrieved successfully after re-authentication')
          return stealthKeys
        } catch (retryError: any) {
          console.error('Retry after authentication failed:', retryError)

          // Don't show toast for user-cancelled errors
          if (!isUserCancelledError(retryError)) {
            toast({
              title: 'Authentication Required',
              description: 'Please authenticate to access stealth keys',
              status: 'error',
              duration: 5000,
              isClosable: true,
            })
          }
          return null
        }
      }

      // Don't show toast for user-cancelled errors
      if (!isUserCancelledError(error)) {
        toast({
          title: 'Stealth Keys Failed',
          description: error.message || 'Failed to get stealth keys',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
      return null
    }
  }

  const getBackupStatus = async (): Promise<BackupStatus> => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated in context. Cannot check backup status.')
    }

    if (!w3pk || typeof w3pk.getBackupStatus !== 'function') {
      throw new Error('w3pk SDK does not support getBackupStatus.')
    }

    try {
      setIsLoading(true)
      console.log('=== Getting Backup Status with w3pk SDK ===')

      // Check if the SDK has an active session (this might be sufficient for getBackupStatus)
      const hasSession = w3pk.hasActiveSession?.() // Check if method exists
      console.log('Active session check (getBackupStatus):', hasSession)

      let result: BackupStatus
      try {
        // Attempt the call directly first
        result = await w3pk.getBackupStatus()
      } catch (initialError) {
        console.error('Initial getBackupStatus failed:', initialError)

        // If it fails due to auth requirement, attempt to login first
        if (
          (initialError as Error).message?.includes('Must be authenticated') ||
          (initialError as Error).message?.includes('login')
        ) {
          console.log('Authentication required, prompting for fresh login...')
          try {
            await w3pk.login() // Attempt fresh login (likely WebAuthn)
            console.log('Fresh authentication successful, retrying getBackupStatus...')
            result = await w3pk.getBackupStatus() // Retry the operation
          } catch (retryError) {
            console.error('Retry after authentication failed:', retryError)
            if (!isUserCancelledError(retryError)) {
              toast({
                title: 'Authentication Required',
                description: 'Please authenticate to check backup status',
                status: 'error',
                duration: 5000,
                isClosable: true,
              })
            }
            throw retryError // Re-throw the retry error
          }
        } else {
          // If the initial error wasn't auth-related, re-throw it
          throw initialError
        }
      }

      console.log('Backup Status retrieved:', result)
      return result
    } catch (error) {
      console.error('Error getting backup status:', error)
      // Re-throw the error so the calling component can handle it (e.g., show toast)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const createZipBackup = async (password: string): Promise<Blob> => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated in context. Cannot create backup.')
    }

    if (!w3pk || typeof w3pk.createZipBackup !== 'function') {
      throw new Error('w3pk SDK does not support createZipBackup.')
    }

    try {
      setIsLoading(true)
      console.log('=== Creating ZIP Backup with w3pk SDK ===')

      // Check if the SDK has an active session (this might be required for createZipBackup too)
      const hasSession = w3pk.hasActiveSession?.() // Check if method exists
      console.log('Active session check (createZipBackup):', hasSession)

      let result: Blob
      try {
        // Attempt the call directly first, passing the password
        result = await w3pk.createZipBackup(password)
      } catch (initialError) {
        console.error('Initial createZipBackup failed:', initialError)

        // If it fails due to auth requirement, attempt to login first
        if (
          (initialError as Error).message?.includes('Must be authenticated') ||
          (initialError as Error).message?.includes('login')
        ) {
          console.log('Authentication required, prompting for fresh login...')
          try {
            await w3pk.login() // Attempt fresh login (likely WebAuthn)
            console.log('Fresh authentication successful, retrying createZipBackup...')
            result = await w3pk.createZipBackup(password) // Retry the operation with password
          } catch (retryError) {
            console.error('Retry after authentication failed:', retryError)
            if (!isUserCancelledError(retryError)) {
              toast({
                title: 'Authentication Required',
                description: 'Please authenticate to create backup',
                status: 'error',
                duration: 5000,
                isClosable: true,
              })
            }
            throw retryError // Re-throw the retry error
          }
        } else {
          // If the initial error wasn't auth-related, re-throw it
          throw initialError
        }
      }

      console.log('ZIP Backup blob created successfully.')
      return result
    } catch (error) {
      console.error('Error creating backup:', error)
      // Re-throw the error so the calling component can handle it
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <W3PK.Provider
      value={{
        isAuthenticated: isMounted && isAuthenticated,
        user,
        isLoading,
        login,
        register,
        logout,
        signMessage,
        deriveWallet,
        generateStealthAddress,
        generateStealthAddressFor,
        getStealthKeys,
        getBackupStatus, // Add the new method
        createZipBackup, // Add the new method
      }}
    >
      {children}
    </W3PK.Provider>
  )
}
