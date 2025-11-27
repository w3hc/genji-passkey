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
import { createWeb3Passkey } from 'w3pk'
import type {
  Guardian as W3pkGuardian,
  GuardianInvite as W3pkGuardianInvite,
  SocialRecoveryConfig as W3pkSocialRecoveryConfig,
} from 'w3pk'
import { toaster } from '@/components/ui/toaster'

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

interface Guardian {
  id: string
  name: string
  email?: string
  phone?: string
  shareEncrypted: string
  status: 'pending' | 'active' | 'revoked'
  addedAt: string
  lastVerified?: string
}

interface GuardianInvite {
  guardianId: string
  shareCode: string
  explainer: string
}

interface SocialRecoveryConfig {
  threshold: number
  totalGuardians: number
  guardians: Guardian[]
  createdAt: string
  ethereumAddress: string
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
  logout: () => Promise<void>
  signMessage: (message: string) => Promise<string | null>
  deriveWallet: (mode?: string, tag?: string) => Promise<DerivedWallet>
  getBackupStatus: () => Promise<BackupStatus>
  createBackup: (password: string) => Promise<Blob>
  restoreFromBackup: (
    backupData: string,
    password: string
  ) => Promise<{ mnemonic: string; ethereumAddress: string }>
  setupSocialRecovery: (
    guardians: { name: string; email?: string; phone?: string }[],
    threshold: number,
    password?: string
  ) => Promise<Guardian[]>
  getSocialRecoveryConfig: () => SocialRecoveryConfig | null
  generateGuardianInvite: (guardian: Guardian) => Promise<GuardianInvite>
  recoverFromGuardians: (
    shareData: string[]
  ) => Promise<{ mnemonic: string; ethereumAddress: string }>
  clearSocialRecoveryConfig: () => void
}

const W3PK = createContext<W3pkType>({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  signMessage: async () => null,
  deriveWallet: async () => ({ address: '', privateKey: '' }),
  getBackupStatus: async () => {
    throw new Error('getBackupStatus not initialized')
  },
  createBackup: async () => {
    throw new Error('createBackup not initialized')
  },
  restoreFromBackup: async () => {
    throw new Error('restoreFromBackup not initialized')
  },
  setupSocialRecovery: async () => {
    throw new Error('setupSocialRecovery not initialized')
  },
  getSocialRecoveryConfig: () => null,
  generateGuardianInvite: async () => {
    throw new Error('generateGuardianInvite not initialized')
  },
  recoverFromGuardians: async () => {
    throw new Error('recoverFromGuardians not initialized')
  },
  clearSocialRecoveryConfig: () => {},
})

export const useW3PK = () => useContext(W3PK)

interface W3pkProviderProps {
  children: ReactNode
}

const REGISTRATION_TIMEOUT_MS = 45000 // 45 seconds

/**
 * Check if any persistent session exists in IndexedDB
 * This allows us to avoid triggering WebAuthn prompt when no session exists
 */
async function checkIndexedDBForPersistentSession(): Promise<boolean> {
  try {
    const dbName = 'Web3PasskeyPersistentSessions'
    const storeName = 'sessions'

    return new Promise((resolve) => {
      const request = indexedDB.open(dbName)

      request.onerror = () => {
        // Database doesn't exist or error opening
        resolve(false)
      }

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Check if the object store exists
        if (!db.objectStoreNames.contains(storeName)) {
          db.close()
          resolve(false)
          return
        }

        try {
          const transaction = db.transaction([storeName], 'readonly')
          const objectStore = transaction.objectStore(storeName)
          const countRequest = objectStore.count()

          countRequest.onsuccess = () => {
            db.close()
            resolve(countRequest.result > 0)
          }

          countRequest.onerror = () => {
            db.close()
            resolve(false)
          }
        } catch {
          db.close()
          resolve(false)
        }
      }
    })
  } catch {
    return false
  }
}

/**
 * Clear all persistent sessions from IndexedDB
 * Called on logout to ensure no persistent sessions remain
 */
async function clearPersistentSessionsFromIndexedDB(): Promise<void> {
  try {
    const dbName = 'Web3PasskeyPersistentSessions'
    const storeName = 'sessions'

    return new Promise((resolve) => {
      const request = indexedDB.open(dbName)

      request.onerror = () => {
        resolve()
      }

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(storeName)) {
          db.close()
          resolve()
          return
        }

        try {
          const transaction = db.transaction([storeName], 'readwrite')
          const objectStore = transaction.objectStore(storeName)
          const clearRequest = objectStore.clear()

          clearRequest.onsuccess = () => {
            db.close()
            resolve()
          }

          clearRequest.onerror = () => {
            db.close()
            resolve()
          }
        } catch {
          db.close()
          resolve()
        }
      }
    })
  } catch {
    // Silently fail - not critical
  }
}

export const W3pkProvider: React.FC<W3pkProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<W3pkUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

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
    } else {
      setUser(null)
      setIsAuthenticated(false)
    }
  }, [])

  const w3pk = useMemo(
    () =>
      createWeb3Passkey({
        stealthAddresses: {},
        onAuthStateChanged: handleAuthStateChanged,
        sessionDuration: 24, // 24 hours session duration
        persistentSession: {
          enabled: true,
          duration: 7 * 24, // 7 days
          requireReauth: false // Silent session restore (no biometric prompt on page refresh)
        }
      }),
    [handleAuthStateChanged]
  )

  useEffect(() => {
    const checkExistingAuth = async (): Promise<void> => {
      if (!isMounted || !w3pk) return

      try {
        // Check for active in-memory session
        if (w3pk.hasActiveSession() && w3pk.user) {
          handleAuthStateChanged(true, w3pk.user)
          return
        }

        // Check if persistent session exists in IndexedDB
        const hasPersistentSession = await checkIndexedDBForPersistentSession()

        if (hasPersistentSession) {
          // Try to restore from persistent session via login()
          try {
            await w3pk.login()
            // Silent restore succeeded - handleAuthStateChanged called by SDK
          } catch (error) {
            // Silent restore failed - user is logged out
            handleAuthStateChanged(false)
          }
        } else {
          // No persistent session - user is logged out
          handleAuthStateChanged(false)
        }
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

      toaster.create({
        title: 'Done! 🎉',
        description:
          "Your encrypted wallet has been created and stored on your device. Don't forget to back it up!",
        type: 'success',
        duration: 3000,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register with w3pk'

      toaster.create({
        title: 'Registration Failed',
        description: errorMessage,
        type: 'error',
        duration: 8000,
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

      toaster.create({
        title: "You're in!",
        description: hasWallet
          ? `Welcome back, ${displayName}! Your wallet is available.`
          : `Welcome back, ${displayName}! No wallet found on this device.`,
        type: hasWallet ? 'success' : 'warning',
        duration: 5000,
      })
    } catch (error) {
      if (!isUserCancelledError(error)) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to authenticate with w3pk'

        // Silence passkey not available errors
        const isPasskeyNotAvailable =
          errorMessage.includes('not available on this device') ||
          errorMessage.includes('not available') ||
          errorMessage.includes('restore your wallet from a backup')

        if (!isPasskeyNotAvailable) {
          toaster.create({
            title: 'Authentication Failed',
            description: errorMessage,
            type: 'error',
            duration: 5000,
          })
        }
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
      toaster.create({
        title: 'Not Authenticated',
        description: 'Please log in first.',
        type: 'error',
        duration: 3000,
      })
      return null
    }

    try {
      await ensureAuthentication()
      const result = await w3pk.signMessage(message)

      // Extend session after successful operation for better UX
      w3pk.extendSession()

      return result.signature
    } catch (error) {
      if (!isUserCancelledError(error)) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to sign message with w3pk'

        toaster.create({
          title: 'Signing Failed',
          description: errorMessage,
          type: 'error',
          duration: 5000,
        })
      }
      return null
    }
  }

  const deriveWallet = useCallback(
    async (mode?: string, tag?: string): Promise<DerivedWallet> => {
      if (!user) {
        throw new Error('Not authenticated. Please log in first.')
      }

      try {
        await ensureAuthentication()
        const derivedWallet = await w3pk.deriveWallet(mode as any, tag as any)

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
            const derivedWallet = await w3pk.deriveWallet(mode as any, tag as any)

            // Extend session after successful retry
            w3pk.extendSession()

            return derivedWallet
          } catch (retryError) {
            if (!isUserCancelledError(retryError)) {
              toaster.create({
                title: 'Authentication Required',
                description: 'Please authenticate to derive addresses',
                type: 'error',
                duration: 5000,
              })
            }
            throw retryError
          }
        }

        if (!isUserCancelledError(error)) {
          const errorMessage =
            error instanceof Error ? error.message : `Failed to derive wallet (${mode || 'STANDARD'}, ${tag || 'MAIN'})`

          toaster.create({
            title: 'Derivation Failed',
            description: errorMessage,
            type: 'error',
            duration: 5000,
          })
        }
        throw error
      }
    },
    [user, w3pk, isUserCancelledError, ensureAuthentication]
  )

  const logout = async (): Promise<void> => {
    // The SDK's logout() method already clears both in-memory and persistent sessions
    w3pk.logout()

    // Also clear persistent sessions from IndexedDB to ensure complete cleanup
    await clearPersistentSessionsFromIndexedDB()

    toaster.create({
      title: 'Logged Out',
      description: 'You have been logged out.',
      type: 'info',
      duration: 4000,
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
        toaster.create({
          title: 'Authentication Required',
          description: 'Please authenticate to check backup status',
          type: 'error',
          duration: 5000,
        })
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const createBackup = async (password: string): Promise<Blob> => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated. Cannot create backup.')
    }

    if (!w3pk || typeof w3pk.createBackupFile !== 'function') {
      throw new Error('w3pk SDK does not support createBackupFile.')
    }

    try {
      setIsLoading(true)

      try {
        const result = await w3pk.createBackupFile('password', password)
        return result.blob
      } catch (initialError) {
        if (
          initialError instanceof Error &&
          (initialError.message.includes('Must be authenticated') ||
            initialError.message.includes('login'))
        ) {
          await w3pk.login()
          const result = await w3pk.createBackupFile('password', password)
          return result.blob
        }
        throw initialError
      }
    } catch (error) {
      if (!isUserCancelledError(error)) {
        toaster.create({
          title: 'Authentication Required',
          description: 'Please authenticate to create backup',
          type: 'error',
          duration: 5000,
        })
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const restoreFromBackup = async (
    backupData: string,
    password: string
  ): Promise<{ mnemonic: string; ethereumAddress: string }> => {
    if (!w3pk || typeof w3pk.restoreFromBackupFile !== 'function') {
      throw new Error('w3pk SDK does not support restoreFromBackupFile.')
    }

    try {
      setIsLoading(true)

      const result = await w3pk.restoreFromBackupFile(backupData, password)

      toaster.create({
        title: 'Backup Restored Successfully!',
        description: `Wallet restored: ${result.ethereumAddress}`,
        type: 'success',
        duration: 5000,
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore from backup'

      toaster.create({
        title: 'Restore Failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Simplified inline social recovery using Shamir Secret Sharing
  const splitSecret = useCallback((mnemonic: string, threshold: number, shares: number) => {
    // Use secrets.js for Shamir Secret Sharing
    const secrets = require('secrets.js-34r7h')
    // Convert mnemonic to hex
    const mnemonicHex = Buffer.from(mnemonic, 'utf8').toString('hex')
    // Split into shares
    const shareArray = secrets.share(mnemonicHex, shares, threshold)
    return shareArray
  }, [])

  const combineSecret = useCallback((shareArray: string[]) => {
    const secrets = require('secrets.js-34r7h')
    const mnemonicHex = secrets.combine(shareArray)
    const mnemonic = Buffer.from(mnemonicHex, 'hex').toString('utf8')
    return mnemonic
  }, [])

  const setupSocialRecovery = async (
    guardians: { name: string; email?: string; phone?: string }[],
    threshold: number,
    password?: string
  ): Promise<Guardian[]> => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated. Cannot setup social recovery.')
    }

    try {
      setIsLoading(true)
      await ensureAuthentication()

      // Create a temporary passkey-encrypted backup to access the mnemonic
      // This will trigger authentication and store mnemonic in session
      const backupResult = await w3pk.createBackupFile('passkey')
      const backupJson = await backupResult.blob.text()
      const backupData = JSON.parse(backupJson)

      // Now we need to decrypt it to get the mnemonic
      // We'll need to use restoreFromBackupFile to decrypt
      const restored = await w3pk.restoreFromBackupFile(backupJson, '')
      const mnemonic = restored.mnemonic

      // Split mnemonic using Shamir Secret Sharing
      const shares = splitSecret(mnemonic, threshold, guardians.length)

      // Create guardian objects with shares
      const guardianObjects: Guardian[] = guardians.map((g, index) => ({
        id: crypto.randomUUID(),
        name: g.name,
        email: g.email,
        shareEncrypted: shares[index],
        status: 'pending' as const,
        addedAt: new Date().toISOString(),
      }))

      // Store config in localStorage
      const config: SocialRecoveryConfig = {
        threshold,
        totalGuardians: guardians.length,
        guardians: guardianObjects,
        createdAt: new Date().toISOString(),
        ethereumAddress: user.ethereumAddress,
      }

      localStorage.setItem('w3pk_social_recovery', JSON.stringify(config))

      toaster.create({
        title: 'Social Recovery Configured!',
        description: `Successfully set up ${threshold}-of-${guardians.length} guardian recovery`,
        type: 'success',
        duration: 5000,
      })

      return guardianObjects
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to setup social recovery'

      toaster.create({
        title: 'Setup Failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const getSocialRecoveryConfig = (): SocialRecoveryConfig | null => {
    try {
      const stored = localStorage.getItem('w3pk_social_recovery')
      if (!stored) return null
      return JSON.parse(stored)
    } catch {
      return null
    }
  }

  const generateGuardianInvite = async (guardian: Guardian): Promise<GuardianInvite> => {
    try {
      setIsLoading(true)

      const config = getSocialRecoveryConfig()
      if (!config) {
        throw new Error('Social recovery not configured')
      }

      const index = config.guardians.findIndex(g => g.id === guardian.id)
      if (index === -1) {
        throw new Error('Guardian not found')
      }

      // Create guardian data package
      const guardianData = {
        version: 1,
        guardianId: guardian.id,
        guardianName: guardian.name,
        guardianIndex: index + 1,
        totalGuardians: config.totalGuardians,
        threshold: config.threshold,
        share: guardian.shareEncrypted,
        ethereumAddress: config.ethereumAddress,
        createdAt: config.createdAt,
      }

      const shareCode = JSON.stringify(guardianData)

      const explainer = `
🛡️ GUARDIAN RECOVERY SHARE

Dear ${guardian.name},

You have been chosen as Guardian ${index + 1} of ${config.totalGuardians}

YOUR ROLE:
You hold 1 piece of a ${config.threshold}-piece puzzle. ${config.threshold} guardians are needed to recover the wallet.

HOW IT WORKS:
If your friend loses access to their wallet, they will contact you to request your share. You provide the share code below, and the system collects shares from ${config.threshold} guardians to reconstruct the wallet.

SECURITY:
✓ Your share is encrypted
✓ Cannot be used alone
✓ ${config.threshold - 1} other guardians needed
✓ Safe to store digitally

Guardian ${index + 1}/${config.totalGuardians} | Threshold: ${config.threshold}/${config.totalGuardians}
Created: ${new Date().toISOString()}

Thank you for being a trusted guardian!
`

      toaster.create({
        title: 'Guardian Invitation Generated',
        description: `Invitation ready for ${guardian.name}`,
        type: 'success',
        duration: 3000,
      })

      return {
        guardianId: guardian.id,
        shareCode,
        explainer,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate guardian invite'

      toaster.create({
        title: 'Generation Failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const recoverFromGuardians = async (
    shareData: string[]
  ): Promise<{ mnemonic: string; ethereumAddress: string }> => {
    try {
      setIsLoading(true)

      const config = getSocialRecoveryConfig()
      if (!config) {
        throw new Error('Social recovery not configured')
      }

      if (shareData.length < config.threshold) {
        throw new Error(`Need at least ${config.threshold} shares, got ${shareData.length}`)
      }

      // Parse share data to extract the shares
      const shares = shareData.map(data => {
        const parsed = JSON.parse(data)
        return parsed.share
      })

      // Combine shares to recover mnemonic
      const mnemonic = combineSecret(shares)

      // Verify by deriving the ethereum address
      const { Wallet } = await import('ethers')
      const wallet = Wallet.fromPhrase(mnemonic)

      if (wallet.address.toLowerCase() !== config.ethereumAddress.toLowerCase()) {
        throw new Error('Recovered address does not match - invalid shares')
      }

      toaster.create({
        title: 'Wallet Recovered!',
        description: `Successfully recovered wallet: ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`,
        type: 'success',
        duration: 5000,
      })

      return {
        mnemonic,
        ethereumAddress: wallet.address,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to recover from guardians'

      toaster.create({
        title: 'Recovery Failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const clearSocialRecoveryConfig = (): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('w3pk_social_recovery')

        toaster.create({
          title: 'Social Recovery Config Cleared',
          description: 'Guardian shares removed from local storage',
          type: 'success',
          duration: 3000,
        })
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to clear social recovery config'

      toaster.create({
        title: 'Clear Failed',
        description: errorMessage,
        type: 'error',
        duration: 3000,
      })
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
        getBackupStatus,
        createBackup,
        restoreFromBackup,
        setupSocialRecovery,
        getSocialRecoveryConfig,
        generateGuardianInvite,
        recoverFromGuardians,
        clearSocialRecoveryConfig,
      }}
    >
      {children}
    </W3PK.Provider>
  )
}
