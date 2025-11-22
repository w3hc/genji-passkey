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
  deriveWalletWithCustomTag: (tag: string) => Promise<DerivedWallet>
  getBackupStatus: () => Promise<BackupStatus>
  createZipBackup: (password: string) => Promise<Blob>
  restoreFromBackup: (backupData: string, password: string) => Promise<{ mnemonic: string; ethereumAddress: string }>
}

interface AuthStateData {
  isAuthenticated: boolean
  user: W3pkUser
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
  deriveWalletWithCustomTag: async () => ({ address: '', privateKey: '' }),
  getBackupStatus: async () => {
    throw new Error('getBackupStatus not initialized')
  },
  createZipBackup: async () => {
    throw new Error('createZipBackup not initialized')
  },
  restoreFromBackup: async () => {
    throw new Error('restoreFromBackup not initialized')
  },
})

export const useW3PK = () => useContext(W3PK)

interface W3pkProviderProps {
  children: ReactNode
}

const AUTH_STATE_KEY = 'w3pk_auth_state' // For UI state restoration only
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

      // Store UI state only - W3PK SDK handles session management
      if (typeof window !== 'undefined' && window.localStorage) {
        const authStateData: AuthStateData = {
          isAuthenticated: true,
          user: userData,
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
        sessionDuration: 24, // 24 hours session duration
      }),
    [handleAuthStateChanged]
  )

  useEffect(() => {
    const checkExistingAuth = async (): Promise<void> => {
      if (!isMounted || !w3pk) return

      try {
        // Priority 1: Check if W3PK SDK has an active session
        if (w3pk.hasActiveSession() && w3pk.user) {
          handleAuthStateChanged(true, w3pk.user)
          return
        }

        // Priority 2: Restore session from localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          const storedAuthState = localStorage.getItem(AUTH_STATE_KEY)

          if (storedAuthState) {
            try {
              const authData = JSON.parse(storedAuthState) as AuthStateData

              if (authData.isAuthenticated && authData.user) {
                // Restore UI state first
                handleAuthStateChanged(true, authData.user)

                // Proactively restore W3PK session
                // This will prompt for passkey authentication on page load
                // instead of waiting for the first user action
                try {
                  await w3pk.login()
                  // Session restored successfully - user won't be prompted again
                } catch (error) {
                  // User cancelled or authentication failed
                  // Silent fail - they'll be prompted when they perform an action
                  if (!isUserCancelledError(error)) {
                    console.warn('Failed to restore session:', error)
                  }
                }
                return
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
  }, [isMounted, w3pk, handleAuthStateChanged, isUserCancelledError])

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
      const errorMessage = error instanceof Error ? error.message : 'Failed to register with w3pk'

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
        title: "You're in!",
        description: hasWallet
          ? `Welcome back, ${displayName}! Your wallet is available.`
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

  const ensureAuthentication = useCallback(async (): Promise<void> => {
    // If W3PK SDK session is active, we're good
    if (w3pk.hasActiveSession()) {
      return
    }

    // No active session - prompt for login
    // W3PK SDK will handle session creation and management
    await w3pk.login()
  }, [w3pk])

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

      // Extend session after successful operation for better UX
      w3pk.extendSession()

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

      // Extend session after successful operation
      w3pk.extendSession()

      return derivedWallet
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('Not authenticated') || error.message.includes('login'))
      ) {
        try {
          await w3pk.login()
          const derivedWallet = await w3pk.deriveWallet(tag)

          // Extend session after successful retry
          w3pk.extendSession()

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

  const deriveWalletWithCustomTag = useCallback(
    async (tag: string): Promise<DerivedWallet> => {
      if (!user) {
        throw new Error('Not authenticated. Please log in first.')
      }

      try {
        await ensureAuthentication()
        const derivedWallet = await w3pk.deriveWallet(tag)

        // Extend session after successful operation
        w3pk.extendSession()

        return derivedWallet
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes('Not authenticated') ||
            error.message.includes('login') ||
            error.message.includes('Failed to derive wallet'))
        ) {
          try {
            await w3pk.login()
            const derivedWallet = await w3pk.deriveWallet(tag)

            // Extend session after successful retry
            w3pk.extendSession()

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
            error instanceof Error ? error.message : `Failed to derive wallet with tag ${tag}`

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
    },
    [user, w3pk, isUserCancelledError, toast, ensureAuthentication]
  )

  const logout = (): void => {
    w3pk.logout()
    w3pk.clearSession() // Explicitly clear W3PK session

    // Clear UI state from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(AUTH_STATE_KEY)
    }

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

  const restoreFromBackup = async (backupData: string, password: string): Promise<{ mnemonic: string; ethereumAddress: string }> => {
    if (!w3pk || typeof w3pk.restoreFromBackup !== 'function') {
      throw new Error('w3pk SDK does not support restoreFromBackup.')
    }

    try {
      setIsLoading(true)

      const result = await w3pk.restoreFromBackup(backupData, password)

      toast({
        title: 'Backup Restored Successfully!',
        description: `Wallet restored: ${result.ethereumAddress}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore from backup'

      toast({
        title: 'Restore Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
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
        deriveWalletWithCustomTag,
        getBackupStatus,
        createZipBackup,
        restoreFromBackup,
      }}
    >
      {children}
    </W3PK.Provider>
  )
}
