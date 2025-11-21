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
import { createWeb3Passkey, StealthKeys } from 'w3pk'

interface SecurityScore {
  total: number
  level: string
  nextMilestone?: string
  breakdown?: Record<string, number>
}

interface PasskeySync {
  enabled: boolean
  deviceCount: number
}

interface RecoveryPhrase {
  verified: boolean
}

interface BackupStatus {
  securityScore: SecurityScore
  passkeySync?: PasskeySync
  recoveryPhrase?: RecoveryPhrase
  backupExists?: boolean
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

interface StealthAddressResult {
  stealthAddress: string
  ephemeralPublicKey: string
  viewTag: string
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
  generateStealthAddress: () => Promise<StealthAddressResult | null>
  getStealthKeys: () => Promise<StealthKeys | null>
  getBackupStatus: () => Promise<BackupStatus>
  createZipBackup: (password: string) => Promise<Blob>
}

interface AuthStateData {
  isAuthenticated: boolean
  user: W3pkUser
  expiresAt: number
}

const W3PK = createContext<W3pkType>({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  signMessage: async () => null,
  deriveWallet: async () => ({ address: '', privateKey: '' }),
  generateStealthAddress: async () => null,
  getStealthKeys: async () => null,
  getBackupStatus: async () => {
    throw new Error('getBackupStatus not initialized')
  },
  createZipBackup: async () => {
    throw new Error('createZipBackup not initialized')
  },
})

export const useW3PK = () => useContext(W3PK)

interface W3pkProviderProps {
  children: ReactNode
}

const AUTH_STATE_KEY = 'w3pk_auth_state'
const AUTH_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours
const REGISTRATION_TIMEOUT_MS = 45000 // 45 seconds

export const W3pkProvider: React.FC<W3pkProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<W3pkUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const toast = useToast()

  const isUserCancelledError = useCallback((error: unknown): boolean => {
    if (error && typeof error === 'object' && 'name' in error && 'message' in error) {
      const err = error as { name: string; message: string }
      return (
        err.name === 'NotAllowedError' ||
        err.message.includes('NotAllowedError') ||
        err.message.includes('timed out') ||
        err.message.includes('not allowed')
      )
    }
    return false
  }, [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleAuthStateChanged = useCallback((isAuth: boolean, w3pkUser?: unknown) => {
    if (isAuth && w3pkUser && typeof w3pkUser === 'object') {
      const userObj = w3pkUser as Record<string, string>
      const userData: W3pkUser = {
        id: userObj.id,
        username: userObj.username,
        displayName: userObj.displayName,
        ethereumAddress: userObj.ethereumAddress,
      }
      setUser(userData)
      setIsAuthenticated(true)

      if (typeof window !== 'undefined' && window.localStorage) {
        const authStateData: AuthStateData = {
          isAuthenticated: true,
          user: userData,
          expiresAt: Date.now() + AUTH_EXPIRY_MS,
        }
        localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(authStateData))
      }
    } else {
      setUser(null)
      setIsAuthenticated(false)

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(AUTH_STATE_KEY)
      }
    }
  }, [])

  const w3pk = useMemo(
    () =>
      createWeb3Passkey({
        stealthAddresses: {},
        debug: process.env.NODE_ENV === 'development',
        onAuthStateChanged: handleAuthStateChanged,
      }),
    [handleAuthStateChanged]
  )

  useEffect(() => {
    const checkExistingAuth = async (): Promise<void> => {
      if (!isMounted || !w3pk) return

      try {
        if (w3pk.isAuthenticated && w3pk.user) {
          handleAuthStateChanged(true, w3pk.user)
          return
        }

        if (typeof window !== 'undefined' && window.localStorage) {
          const storedAuthState = localStorage.getItem(AUTH_STATE_KEY)
          if (storedAuthState) {
            try {
              const authData = JSON.parse(storedAuthState) as AuthStateData
              if (authData.isAuthenticated && authData.user && authData.expiresAt > Date.now()) {
                handleAuthStateChanged(true, authData.user)
                return
              } else {
                localStorage.removeItem(AUTH_STATE_KEY)
              }
            } catch {
              localStorage.removeItem(AUTH_STATE_KEY)
            }
          }
        }

        handleAuthStateChanged(false)
      } catch {
        handleAuthStateChanged(false)
      }
    }

    checkExistingAuth()
  }, [isMounted, w3pk, handleAuthStateChanged])

  const register = async (username: string): Promise<void> => {
    try {
      setIsLoading(true)

      const registrationPromise = w3pk.register({ username })
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Registration timed out. Please try again or check browser console for errors.'
              )
            ),
          REGISTRATION_TIMEOUT_MS
        )
      )

      await Promise.race([registrationPromise, timeoutPromise])

      toast({
        title: 'Done! 🎉',
        description:
          "Your encrypted wallet has been created and stored on your device. Don't forget to back it up!",
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to register with w3pk'

      toast({
        title: 'Registration Failed',
        description: errorMessage,
        status: 'error',
        duration: 8000,
        isClosable: true,
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (): Promise<void> => {
    try {
      setIsLoading(true)

      const result = await w3pk.login()
      const hasWallet = w3pk.isAuthenticated
      const displayName = result.displayName || result.username || 'Anon'

      toast({
        title: 'Login Successful! ✅',
        description: hasWallet
          ? `Oh! It's you, ${displayName}! Welcome back! Your wallet is available.`
          : `Welcome back, ${displayName}! No wallet found on this device.`,
        status: hasWallet ? 'success' : 'warning',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      if (!isUserCancelledError(error)) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to authenticate with w3pk'

        toast({
          title: 'Authentication Failed',
          description: errorMessage,
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

  const ensureAuthentication = async (): Promise<void> => {
    if (!w3pk.hasActiveSession()) {
      await w3pk.login()
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
      await ensureAuthentication()
      const signature = await w3pk.signMessage(message)
      return signature
    } catch (error) {
      if (!isUserCancelledError(error)) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to sign message with w3pk'

        toast({
          title: 'Signing Failed',
          description: errorMessage,
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

    const tag = `WALLET_${index}`

    try {
      await ensureAuthentication()
      const derivedWallet = await w3pk.deriveWallet(tag)
      return derivedWallet
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('Not authenticated') || error.message.includes('login'))
      ) {
        try {
          await w3pk.login()
          const derivedWallet = await w3pk.deriveWallet(tag)
          return derivedWallet
        } catch (retryError) {
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

      if (!isUserCancelledError(error)) {
        const errorMessage =
          error instanceof Error ? error.message : `Failed to derive wallet at index ${index}`

        toast({
          title: 'Derivation Failed',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
      throw error
    }
  }

  const generateStealthAddress = async (): Promise<StealthAddressResult | null> => {
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

    if (!w3pk.stealth) {
      toast({
        title: 'Stealth Addresses Not Available',
        description: 'Stealth address module is not enabled',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    }

    try {
      await ensureAuthentication()
      const result = await w3pk.stealth.generateStealthAddress()
      return result
    } catch (error) {
      if (!isUserCancelledError(error)) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to generate stealth address'

        toast({
          title: 'Generation Failed',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
      return null
    }
  }

  const getStealthKeys = async (): Promise<StealthKeys | null> => {
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

    if (!w3pk.stealth) {
      toast({
        title: 'Stealth Addresses Not Available',
        description: 'Stealth address module is not enabled',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    }

    try {
      await ensureAuthentication()
      const keys = await w3pk.stealth.getKeys()
      return keys
    } catch (error) {
      if (!isUserCancelledError(error)) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to get stealth keys'

        toast({
          title: 'Failed to Get Keys',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
      return null
    }
  }

  const logout = (): void => {
    w3pk.logout()

    toast({
      title: 'Logged Out',
      description: 'You have been logged out.',
      status: 'info',
      duration: 4000,
      isClosable: true,
    })
  }

  const getBackupStatus = async (): Promise<BackupStatus> => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated. Cannot check backup status.')
    }

    if (!w3pk || typeof w3pk.getBackupStatus !== 'function') {
      throw new Error('w3pk SDK does not support getBackupStatus.')
    }

    try {
      setIsLoading(true)

      try {
        const result = await w3pk.getBackupStatus()
        return result
      } catch (initialError) {
        if (
          initialError instanceof Error &&
          (initialError.message.includes('Must be authenticated') ||
            initialError.message.includes('login'))
        ) {
          await w3pk.login()
          const result = await w3pk.getBackupStatus()
          return result
        }
        throw initialError
      }
    } catch (error) {
      if (!isUserCancelledError(error)) {
        toast({
          title: 'Authentication Required',
          description: 'Please authenticate to check backup status',
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

  const createZipBackup = async (password: string): Promise<Blob> => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated. Cannot create backup.')
    }

    if (!w3pk || typeof w3pk.createZipBackup !== 'function') {
      throw new Error('w3pk SDK does not support createZipBackup.')
    }

    try {
      setIsLoading(true)

      try {
        const result = await w3pk.createZipBackup(password)
        return result
      } catch (initialError) {
        if (
          initialError instanceof Error &&
          (initialError.message.includes('Must be authenticated') ||
            initialError.message.includes('login'))
        ) {
          await w3pk.login()
          const result = await w3pk.createZipBackup(password)
          return result
        }
        throw initialError
      }
    } catch (error) {
      if (!isUserCancelledError(error)) {
        toast({
          title: 'Authentication Required',
          description: 'Please authenticate to create backup',
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
        getStealthKeys,
        getBackupStatus,
        createZipBackup,
      }}
    >
      {children}
    </W3PK.Provider>
  )
}
