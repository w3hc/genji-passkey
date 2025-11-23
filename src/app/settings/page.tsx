// app/settings/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  Heading,
  VStack,
  Text,
  Code,
  TabsRoot,
  TabsList,
  TabsContent,
  TabsTrigger,
  IconButton,
  useDisclosure,
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogBody,
  DialogCloseTrigger,
  HStack,
  SimpleGrid,
  Icon,
  ListRoot,
  ListItem,
  Badge,
  Link as ChakraLink,
  Flex,
} from '@chakra-ui/react'
import { toaster } from '@/components/ui/toaster'
import { MdDelete, MdCheckCircle, MdWarning, MdInfo, MdDownload, MdLock } from 'react-icons/md'
import {
  FiShield,
  FiCheckCircle,
  FiCloud,
  FiUsers,
  FiKey,
  FiDownload,
  FiDatabase,
  FiHardDrive,
  FiUpload,
} from 'react-icons/fi'
import { useW3PK } from '../../../src/context/W3PK'
import { useTranslation } from '@/hooks/useTranslation'
import Spinner from '../../../src/components/Spinner'
import PasswordModal from '../../components/PasswordModal'
import { CodeBlock } from '@/components/CodeBlock'
import { detectBrowser, isWebAuthnAvailable } from '../../../src/utils/browserDetection'
import { brandColors } from '@/theme'
import {
  inspectLocalStorage,
  inspectIndexedDB,
  formatValue,
  maskSensitiveData,
  clearLocalStorageItem,
  clearIndexedDBRecord,
  type LocalStorageItem,
  type IndexedDBInfo,
} from '../../../src/utils/storageInspection'

interface StoredAccount {
  username: string
  ethereumAddress: string
  id: string
  displayName?: string
}

const SettingsPage = () => {
  const t = useTranslation()
  const [backupStatus, setBackupStatus] = useState<string | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showRestorePasswordModal, setShowRestorePasswordModal] = useState(false)
  const [selectedBackupFile, setSelectedBackupFile] = useState<string | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [accountToDelete, setAccountToDelete] = useState<StoredAccount | null>(null)
  const { open: isOpen, onOpen, onClose } = useDisclosure()

  const [localStorageData, setLocalStorageData] = useState<LocalStorageItem[]>([])
  const [indexedDBData, setIndexedDBData] = useState<IndexedDBInfo[]>([])
  const [isInspectingLocalStorage, setIsInspectingLocalStorage] = useState(false)
  const [isInspectingIndexedDB, setIsInspectingIndexedDB] = useState(false)
  const [showLocalStorageModal, setShowLocalStorageModal] = useState(false)
  const [showIndexedDBModal, setShowIndexedDBModal] = useState(false)

  const { isAuthenticated, user, getBackupStatus, createZipBackup, restoreFromBackup, logout } =
    useW3PK()

  const handleInspectLocalStorage = async () => {
    setIsInspectingLocalStorage(true)
    try {
      const data = await inspectLocalStorage()
      setLocalStorageData(data)

      toaster.create({
        title: 'LocalStorage Inspected',
        description: `Found ${data.length} items. Scroll down to see results.`,
        type: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('Error inspecting localStorage:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to inspect localStorage',
        type: 'error',
        duration: 3000,
      })
    } finally {
      setIsInspectingLocalStorage(false)
    }
  }

  const handleInspectIndexedDB = async () => {
    setIsInspectingIndexedDB(true)
    try {
      const data = await inspectIndexedDB()
      setIndexedDBData(data)

      const totalRecords = data.reduce((sum, db) => sum + db.records.length, 0)
      toaster.create({
        title: 'IndexedDB Inspected',
        description: `Found ${data.length} database(s) with ${totalRecords} record(s). Scroll down to see results.`,
        type: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('Error inspecting IndexedDB:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to inspect IndexedDB',
        type: 'error',
        duration: 3000,
      })
    } finally {
      setIsInspectingIndexedDB(false)
    }
  }

  const handleClearLocalStorageItem = async (key: string) => {
    const success = clearLocalStorageItem(key)
    if (success) {
      const updatedData = localStorageData.filter(item => item.key !== key)
      setLocalStorageData(updatedData)

      toaster.create({
        title: 'Item Cleared',
        description: `Removed "${key}" from localStorage`,
        type: 'success',
        duration: 2000,
      })
    } else {
      toaster.create({
        title: 'Error',
        description: `Failed to clear "${key}"`,
        type: 'error',
        duration: 3000,
      })
    }
  }

  const handleClearIndexedDBRecord = async (dbName: string, storeName: string, key: string) => {
    const success = await clearIndexedDBRecord(dbName, storeName, key)
    if (success) {
      const updatedData = indexedDBData.map(db => {
        if (db.name === dbName) {
          return {
            ...db,
            records: db.records.filter(
              record => !(record.store === storeName && record.key === key)
            ),
          }
        }
        return db
      })
      setIndexedDBData(updatedData)

      toaster.create({
        title: 'Record Cleared',
        description: `Removed record from ${dbName}/${storeName}`,
        type: 'success',
        duration: 2000,
      })
    } else {
      toaster.create({
        title: 'Error',
        description: 'Failed to clear record',
        type: 'error',
        duration: 3000,
      })
    }
  }

  const loadAccounts = useCallback(() => {
    try {
      const storedAccounts: StoredAccount[] = []

      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(localStorage)

        keys.forEach(key => {
          try {
            const value = localStorage.getItem(key)
            if (value) {
              try {
                const parsed = JSON.parse(value)
                if (parsed.username && parsed.ethereumAddress) {
                  storedAccounts.push({
                    username: parsed.username,
                    ethereumAddress: parsed.ethereumAddress,
                    id: parsed.id || parsed.username,
                    displayName: parsed.displayName,
                  })
                } else if (parsed.user && parsed.user.username && parsed.user.ethereumAddress) {
                  storedAccounts.push({
                    username: parsed.user.username,
                    ethereumAddress: parsed.user.ethereumAddress,
                    id: parsed.user.id || parsed.user.username,
                    displayName: parsed.user.displayName,
                  })
                }
              } catch (e) {
                // Not JSON
              }
            }
          } catch (e) {
            // Skip invalid keys
          }
        })
      }

      if (user && !storedAccounts.find(acc => acc.ethereumAddress === user.ethereumAddress)) {
        storedAccounts.push({
          username: user.username,
          ethereumAddress: user.ethereumAddress,
          id: user.id,
          displayName: user.displayName,
        })
      }

      const uniqueAccounts = Array.from(
        new Map(storedAccounts.map(acc => [acc.ethereumAddress, acc])).values()
      )

      setAccounts(uniqueAccounts)
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }, [user])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const handleDeleteAccount = (account: StoredAccount) => {
    setAccountToDelete(account)
    onOpen()
  }

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(localStorage)
        const keysToRemove: string[] = []

        keys.forEach(key => {
          try {
            const value = localStorage.getItem(key)
            if (value) {
              if (
                value.includes(accountToDelete.ethereumAddress) ||
                value.includes(accountToDelete.username) ||
                value.includes(accountToDelete.id)
              ) {
                keysToRemove.push(key)
              }
            }
          } catch (e) {
            // Skip this key
          }
        })

        keysToRemove.forEach(key => {
          localStorage.removeItem(key)
        })

        toaster.create({
          title: 'Account Removed',
          description: `Account ${accountToDelete.username} has been removed from this device.`,
          type: 'success',
          duration: 3000,
        })

        // If we deleted the current user's account, log them out
        if (user && user.ethereumAddress === accountToDelete.ethereumAddress) {
          toaster.create({
            title: 'Logging out',
            description: 'You removed your current account. Logging out...',
            type: 'info',
            duration: 2000,
          })
          setTimeout(() => {
            logout()
          }, 2000)
        }

        loadAccounts()
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to remove account. Please try again.',
        type: 'error',
        duration: 5000,
      })
    } finally {
      setAccountToDelete(null)
      onClose()
    }
  }

  if (!isAuthenticated || !getBackupStatus || !createZipBackup) {
    const browserInfo = detectBrowser()
    const webAuthnAvailable = isWebAuthnAvailable()

    let alertStatus: 'info' | 'warning' | 'error' = 'warning'
    if (browserInfo.warningLevel === 'error') alertStatus = 'error'
    else if (browserInfo.warningLevel === 'warning') alertStatus = 'warning'
    else if (browserInfo.warningLevel === 'info') alertStatus = 'info'

    return (
      <VStack gap={8} align="stretch" py={20}>
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={4}>
            {t.settings.title}
          </Heading>
          <Text fontSize="lg" color="gray.400">
            {t.settings.loginRequired}
          </Text>
        </Box>

        <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
          <HStack mb={4}>
            <Icon as={MdInfo} color={brandColors.primary} boxSize={6} />
            <Heading size="md">Browser Info</Heading>
          </HStack>
          <VStack align="stretch" gap={3}>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.400">
                Browser:
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="white">
                {browserInfo.name}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.400">
                Version:
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="white">
                {browserInfo.fullVersion || browserInfo.version}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.400">
                Operating System:
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="white">
                {browserInfo.os}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.400">
                WebAuthn Support:
              </Text>
              <Badge colorPalette={webAuthnAvailable ? 'green' : 'red'}>
                {webAuthnAvailable ? 'Available' : 'Not Available'}
              </Badge>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.400">
                Compatibility:
              </Text>
              <Badge
                colorPalette={
                  browserInfo.isSupported && !browserInfo.hasKnownIssues
                    ? 'green'
                    : browserInfo.hasKnownIssues
                      ? 'yellow'
                      : 'red'
                }
              >
                {browserInfo.isSupported && !browserInfo.hasKnownIssues
                  ? 'Fully Supported'
                  : browserInfo.hasKnownIssues
                    ? 'Known Issues'
                    : 'Not Supported'}
              </Badge>
            </HStack>
          </VStack>
        </Box>

        {browserInfo.recommendation && (
          <Box
            p={4}
            bg={
              alertStatus === 'error'
                ? 'red.900/90'
                : alertStatus === 'warning'
                  ? 'yellow.900/90'
                  : 'blue.900/90'
            }
            borderRadius="lg"
          >
            <Box fontSize="sm">
              <Text fontWeight="bold" mb={1}>
                {alertStatus === 'error'
                  ? 'Browser Not Supported'
                  : alertStatus === 'warning'
                    ? 'Known Issues Detected'
                    : 'Recommendation'}
              </Text>
              <Text fontSize="sm">{browserInfo.recommendation}</Text>
            </Box>
          </Box>
        )}

        {!webAuthnAvailable && (
          <Box p={4} bg="red.900/90" borderRadius="lg">
            <Box fontSize="sm">
              <Text fontWeight="bold" mb={1}>
                WebAuthn Not Available
              </Text>
              <Text fontSize="sm">
                Your browser does not support WebAuthn, which is required for w3pk authentication.
                Please update your browser or use a supported browser:
              </Text>
              <ListRoot gap={1} mt={2} ml={4} fontSize="xs">
                <ListItem>Chrome 67+ (May 2018)</ListItem>
                <ListItem>Firefox 60+ (May 2018)</ListItem>
                <ListItem>Safari 14+ (September 2020)</ListItem>
                <ListItem>Edge 18+ (November 2018)</ListItem>
                <ListItem>Samsung Internet 11+ (February 2020)</ListItem>
              </ListRoot>
            </Box>
          </Box>
        )}

        {browserInfo.os === 'Android' && (
          <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
            <Heading size="sm" mb={3} color={brandColors.primary}>
              Recommended Browsers for Android
            </Heading>
            <ListRoot gap={2} fontSize="sm">
              <ListItem>
                <HStack>
                  <Icon
                    as={browserInfo.name === 'Samsung Internet' ? MdCheckCircle : MdInfo}
                    color={browserInfo.name === 'Samsung Internet' ? 'green.400' : 'gray.400'}
                  />
                  <Text color="gray.300">
                    <strong>Samsung Internet</strong> (Best for Samsung devices) - ✅ Confirmed
                    working
                  </Text>
                </HStack>
              </ListItem>
              <ListItem>
                <HStack>
                  <Icon
                    as={browserInfo.name === 'Chrome' ? MdCheckCircle : MdInfo}
                    color={browserInfo.name === 'Chrome' ? 'green.400' : 'gray.400'}
                  />
                  <Text color="gray.300">
                    <strong>Chrome</strong> - ✅ Reliable
                  </Text>
                </HStack>
              </ListItem>
              <ListItem>
                <HStack>
                  <Icon
                    as={browserInfo.name === 'Edge' ? MdCheckCircle : MdInfo}
                    color={browserInfo.name === 'Edge' ? 'green.400' : 'gray.400'}
                  />
                  <Text color="gray.300">
                    <strong>Edge</strong> - ✅ Reliable
                  </Text>
                </HStack>
              </ListItem>
              <ListItem>
                <HStack>
                  <Icon as={MdWarning} color="yellow.400" />
                  <Text color="gray.300">
                    <strong>Firefox Mobile</strong> - ⚠️ Avoid (known passkey persistence issues)
                  </Text>
                </HStack>
              </ListItem>
            </ListRoot>
          </Box>
        )}

        <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
          <Heading size="sm" mb={3} color={brandColors.primary}>
            Debug & Inspect Storage
          </Heading>
          <Text fontSize="sm" color="gray.400" mb={4}>
            Inspect browser storage and activity logs
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Button
              onClick={handleInspectLocalStorage}
              loading={isInspectingLocalStorage}
              loadingText="Inspecting..."
              variant="outline"
              colorPalette="purple"
              size="sm"
            >
              <Icon as={FiHardDrive} mr={2} />
              Inspect LocalStorage
            </Button>
            <Button
              onClick={handleInspectIndexedDB}
              loading={isInspectingIndexedDB}
              loadingText="Inspecting..."
              variant="outline"
              colorPalette="purple"
              size="sm"
            >
              <Icon as={FiDatabase} mr={2} />
              Inspect IndexedDB
            </Button>
          </SimpleGrid>
        </Box>

        {localStorageData.length > 0 && (
          <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="purple.600">
            <HStack mb={4} justify="space-between">
              <HStack>
                <Icon as={FiHardDrive} color={brandColors.primary} boxSize={6} />
                <Heading size="md">LocalStorage Results</Heading>
              </HStack>
              <Badge colorPalette="purple">{localStorageData.length} items</Badge>
            </HStack>
            <VStack align="stretch" gap={3}>
              {localStorageData.map((item, index) => (
                <Box
                  key={index}
                  bg="gray.950"
                  p={4}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={item.type.startsWith('w3pk') ? 'purple.700' : 'gray.800'}
                >
                  <VStack align="stretch" gap={2}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="bold" color="white" flex={1}>
                        {item.key}
                      </Text>
                      <HStack gap={2}>
                        {item.encrypted && (
                          <Badge colorPalette="orange" fontSize="xs">
                            Encrypted
                          </Badge>
                        )}
                        <Badge
                          colorPalette={item.type.startsWith('w3pk') ? 'purple' : 'gray'}
                          fontSize="xs"
                        >
                          {item.type}
                        </Badge>
                        <IconButton
                          aria-label="Clear item"
                          size="xs"
                          colorPalette="red"
                          variant="ghost"
                          onClick={() => handleClearLocalStorageItem(item.key)}
                        >
                          <MdDelete />
                        </IconButton>
                      </HStack>
                    </HStack>

                    {item.parsedValue && (
                      <Box bg="black" p={3} borderRadius="md" overflowX="auto">
                        <CodeBlock>
                          {formatValue(maskSensitiveData(item.key, item.parsedValue))}
                        </CodeBlock>
                      </Box>
                    )}

                    {!item.parsedValue && (
                      <Text fontSize="xs" color="gray.500" fontFamily="monospace">
                        {item.value}
                      </Text>
                    )}
                  </VStack>
                </Box>
              ))}
            </VStack>
          </Box>
        )}

        {indexedDBData.length > 0 && (
          <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="purple.600">
            <HStack mb={4} justify="space-between">
              <HStack>
                <Icon as={FiDatabase} color={brandColors.primary} boxSize={6} />
                <Heading size="md">IndexedDB Results</Heading>
              </HStack>
              <Badge colorPalette="purple">{indexedDBData.length} database(s)</Badge>
            </HStack>
            <VStack align="stretch" gap={4}>
              {indexedDBData.map((db, dbIndex) => (
                <Box
                  key={dbIndex}
                  bg="gray.950"
                  p={4}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="purple.700"
                >
                  <VStack align="stretch" gap={3}>
                    <HStack justify="space-between">
                      <Text fontSize="md" fontWeight="bold" color="white">
                        {db.name}
                      </Text>
                      <Badge colorPalette="purple" fontSize="xs">
                        v{db.version}
                      </Badge>
                    </HStack>

                    <Text fontSize="xs" color="gray.400">
                      Stores: {db.stores.join(', ')}
                    </Text>

                    <Text fontSize="xs" color="gray.400">
                      Records: {db.records.length}
                    </Text>

                    {db.records.length > 0 && (
                      <VStack align="stretch" gap={2} mt={2}>
                        {db.records.map((record, recordIndex) => (
                          <Box
                            key={recordIndex}
                            bg="black"
                            p={3}
                            borderRadius="md"
                            border="1px solid"
                            borderColor="gray.900"
                          >
                            <HStack justify="space-between" mb={2}>
                              <Text fontSize="xs" color="gray.400">
                                Store: {record.store} | Key: {record.key}
                              </Text>
                              <IconButton
                                aria-label="Clear record"
                                size="xs"
                                colorPalette="red"
                                variant="ghost"
                                onClick={() =>
                                  handleClearIndexedDBRecord(db.name, record.store, record.key)
                                }
                              >
                                <MdDelete />
                              </IconButton>
                            </HStack>
                            <Box overflowX="auto">
                              <CodeBlock>
                                {formatValue(maskSensitiveData(record.key, record.value))}
                              </CodeBlock>
                            </Box>
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </VStack>
                </Box>
              ))}
            </VStack>
          </Box>
        )}

        <Box bg="whiteAlpha.50" p={6} borderRadius="md" textAlign="center">
          <Box bg="transparent" color="blue.200" p={4} borderRadius="md">
            <Text>Please log in or register to access your settings and manage your wallet.</Text>
          </Box>
        </Box>
      </VStack>
    )
  }

  const handleGetBackupStatus = async () => {
    setIsCheckingStatus(true)
    setBackupStatus(null)
    try {
      const statusObject = await getBackupStatus()

      if (
        statusObject &&
        statusObject.securityScore &&
        typeof statusObject.securityScore.total === 'number'
      ) {
        const scoreValue = statusObject.securityScore.total
        const scoreLevel = statusObject.securityScore.level || 'unknown'
        const statusString = `Security Score: ${scoreValue}/100 (Level: ${scoreLevel})`
        setBackupStatus(statusString)
      } else {
        setBackupStatus('Error: Unexpected status data format.')
      }

      toaster.create({
        title: 'Backup Status Retrieved.',
        type: 'info',
        duration: 3000,
      })
    } catch (error) {
      toaster.create({
        title: 'Error retrieving status.',
        description: (error as Error).message || 'An unexpected error occurred.',
        type: 'error',
        duration: 5000,
      })
      setBackupStatus(null)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    try {
      setShowPasswordModal(true)
    } catch (error) {
      console.error('Error creating backup:', error)
      toaster.create({
        title: 'Error creating backup.',
        description: (error as Error).message || 'An unexpected error occurred.',
        type: 'error',
        duration: 5000,
      })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handlePasswordSubmit = async (password: string) => {
    setShowPasswordModal(false)

    try {
      const backupBlob = await createZipBackup(password)

      let fileExtension = '.zip'
      let mimeType = 'application/zip'

      try {
        const fullText = await backupBlob.text()
        JSON.parse(fullText)
        fileExtension = '.json'
        mimeType = 'application/json'

        const jsonBlob = new Blob([fullText], { type: mimeType })

        const link = document.createElement('a')
        link.href = URL.createObjectURL(jsonBlob)
        link.download = `w3pk_backup_${user?.username || 'user'}_${new Date().toISOString().slice(0, 10)}${fileExtension}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(backupBlob)
        link.download = `w3pk_backup_${user?.username || 'user'}_${new Date().toISOString().slice(0, 10)}${fileExtension}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      toaster.create({
        title: 'Backup Created Successfully!',
        type: 'success',
        duration: 3000,
      })
    } catch (error) {
      toaster.create({
        title: 'Error creating backup.',
        description: (error as Error).message || 'An unexpected error occurred.',
        type: 'error',
        duration: 5000,
      })
    }
  }

  const handleModalClose = () => {
    setShowPasswordModal(false)
  }

  const handleRestoreBackup = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.zip,.json,.enc'
    fileInput.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      try {
        const textContent = await file.text()

        try {
          JSON.parse(textContent)
          setSelectedBackupFile(textContent)
          setShowRestorePasswordModal(true)
          return
        } catch (jsonError) {
          // Not JSON, try ZIP
        }

        if (file.name.endsWith('.zip')) {
          const JSZip = (await import('jszip')).default

          const arrayBuffer = await file.arrayBuffer()

          try {
            const zip = await JSZip.loadAsync(arrayBuffer)

            const encFileName = Object.keys(zip.files).find(
              name =>
                name.endsWith('.txt.enc') && !name.startsWith('__MACOSX') && !zip.files[name].dir
            )

            if (!encFileName) {
              throw new Error('No encrypted recovery file found in ZIP backup')
            }

            const encryptedContent = await zip.files[encFileName].async('string')

            setSelectedBackupFile(encryptedContent)
            setShowRestorePasswordModal(true)
          } catch (zipError) {
            setSelectedBackupFile(textContent)
            setShowRestorePasswordModal(true)
          }
        } else {
          setSelectedBackupFile(textContent)
          setShowRestorePasswordModal(true)
        }
      } catch (error) {
        toaster.create({
          title: 'Error reading file',
          description: (error as Error).message || 'Failed to read backup file',
          type: 'error',
          duration: 5000,
        })
      }
    }
    fileInput.click()
  }

  const handleRestorePasswordSubmit = async (password: string) => {
    setShowRestorePasswordModal(false)

    if (!selectedBackupFile) {
      toaster.create({
        title: 'No backup file selected',
        type: 'error',
        duration: 3000,
      })
      return
    }

    setIsRestoring(true)
    try {
      let backupToRestore = selectedBackupFile

      try {
        const backupObj = JSON.parse(selectedBackupFile)

        if (backupObj['recovery-phrase.txt.enc']) {
          const encryptedContent = backupObj['recovery-phrase.txt.enc']
          backupToRestore = encryptedContent
        } else if (!backupObj.version && (backupObj.encrypted || backupObj.mnemonic)) {
          toaster.create({
            title: 'Incompatible Backup Version',
            description:
              'This backup was created with an older version of w3pk. Please create a new backup with the current version.',
            type: 'warning',
            duration: 8000,
          })
          setIsRestoring(false)
          return
        }
      } catch (e) {
        // Not JSON or parsing error
      }

      const result = await restoreFromBackup(backupToRestore, password)

      toaster.create({
        title: 'Wallet Restored!',
        description: `Successfully restored wallet: ${result.ethereumAddress.slice(0, 6)}...${result.ethereumAddress.slice(-4)}`,
        type: 'success',
        duration: 5000,
      })

      setSelectedBackupFile(null)
    } catch (error) {
      // Error toast shown in restoreFromBackup
    } finally {
      setIsRestoring(false)
    }
  }

  const handleRestoreModalClose = () => {
    setShowRestorePasswordModal(false)
    setSelectedBackupFile(null)
  }

  return (
    <>
      <VStack gap={8} align="stretch" py={20}>
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={4}>
            {t.settings.title}
          </Heading>
          <Text fontSize="lg" color="gray.400">
            Manage your accounts, backups, and recovery options
          </Text>
        </Box>

        <TabsRoot colorPalette="purple" variant="plain" size="lg" defaultValue="accounts">
          <TabsList
            bg="gray.900"
            p={2}
            borderRadius="xl"
            gap={2}
            border="1px solid"
            borderColor="gray.700"
          >
            <TabsTrigger
              value="accounts"
              px={6}
              py={3}
              borderRadius="lg"
              fontWeight="medium"
              transition="all 0.2s"
              _selected={{
                bg: brandColors.primary,
                color: 'white',
                shadow: 'lg',
              }}
              _hover={{
                bg: 'gray.800',
              }}
            >
              Accounts
            </TabsTrigger>
            <TabsTrigger
              value="backup"
              px={6}
              py={3}
              borderRadius="lg"
              fontWeight="medium"
              transition="all 0.2s"
              _selected={{
                bg: brandColors.primary,
                color: 'white',
                shadow: 'lg',
              }}
              _hover={{
                bg: 'gray.800',
              }}
            >
              Backup
            </TabsTrigger>
            <TabsTrigger
              value="sync"
              px={6}
              py={3}
              borderRadius="lg"
              fontWeight="medium"
              transition="all 0.2s"
              _selected={{
                bg: brandColors.primary,
                color: 'white',
                shadow: 'lg',
              }}
              _hover={{
                bg: 'gray.800',
              }}
            >
              Sync
            </TabsTrigger>
            <TabsTrigger
              value="recovery"
              px={6}
              py={3}
              borderRadius="lg"
              fontWeight="medium"
              transition="all 0.2s"
              _selected={{
                bg: brandColors.primary,
                color: 'white',
                shadow: 'lg',
              }}
              _hover={{
                bg: 'gray.800',
              }}
            >
              Social recovery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" pt={8}>
            <VStack gap={6} align="stretch">
              <Box>
                <Heading as="h2" size="lg" mb={4}>
                  Accounts on this Device
                </Heading>
                <Text fontSize="md" color="gray.400" mb={6}>
                  These are all the accounts stored on this device. You can remove any account to
                  free up space.
                </Text>
              </Box>

              {accounts.length === 0 ? (
                <Box
                  bg="gray.900"
                  p={8}
                  borderRadius="lg"
                  textAlign="center"
                  border="1px solid"
                  borderColor="gray.700"
                >
                  <Text color="gray.400">No accounts found on this device.</Text>
                </Box>
              ) : (
                accounts.map(account => (
                  <Box
                    key={account.ethereumAddress}
                    bg="gray.900"
                    p={6}
                    borderRadius="lg"
                    border={
                      user?.ethereumAddress === account.ethereumAddress
                        ? `2px solid ${brandColors.primary}`
                        : '1px solid'
                    }
                    borderColor={
                      user?.ethereumAddress === account.ethereumAddress
                        ? brandColors.primary
                        : 'gray.700'
                    }
                  >
                    <HStack justify="space-between" align="start">
                      <Box flex={1}>
                        <HStack mb={3}>
                          <Text fontSize="lg" fontWeight="bold" color="white">
                            {account.displayName || account.username}
                          </Text>
                          {user?.ethereumAddress === account.ethereumAddress && (
                            <Badge colorPalette="purple">Current</Badge>
                          )}
                        </HStack>
                        <Text fontSize="sm" color="gray.400" mb={2}>
                          Username: {account.username}
                        </Text>
                        <Code fontSize="xs" bg="gray.800" color="gray.300" p={2} borderRadius="md">
                          {account.ethereumAddress}
                        </Code>
                      </Box>
                      <IconButton
                        aria-label="Delete account"
                        colorPalette="red"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAccount(account)}
                      >
                        <MdDelete />
                      </IconButton>
                    </HStack>
                  </Box>
                ))
              )}

              <Box p={4} bg="yellow.900/90" borderRadius="lg">
                <Box fontSize="sm">
                  <Text fontWeight="bold" mb={1}>
                    Warning
                  </Text>
                  <Text fontSize="xs" color="gray.300">
                    Removing an account will delete all its data from this device. Make sure you
                    have a backup before removing an account. This action cannot be undone.
                  </Text>
                </Box>
              </Box>
            </VStack>
          </TabsContent>

          <TabsContent value="backup" pt={8}>
            <VStack gap={8} align="stretch">
              {/* Header */}
              <Box>
                <Heading size="lg" mb={4}>
                  Wallet Backup
                </Heading>
                <Text color="gray.400" mb={6}>
                  Create encrypted backups of your wallet to ensure you never lose access
                </Text>
              </Box>

              {/* Current User Info */}
              <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
                <HStack mb={4}>
                  <Icon as={FiShield} color={brandColors.primary} boxSize={6} />
                  <Heading size="md">Current Account</Heading>
                </HStack>
                <VStack align="stretch" gap={3}>
                  <HStack>
                    <Text fontSize="sm" color="gray.400">
                      Logged in as:
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" color="white">
                      {user?.displayName || user?.username}
                    </Text>
                  </HStack>
                  <HStack>
                    <Text fontSize="xs" color="gray.500">
                      Address:
                    </Text>
                    <Code fontSize="xs" bg="gray.800" color="gray.300" px={2} py={1}>
                      {user?.ethereumAddress}
                    </Code>
                  </HStack>
                  <HStack>
                    <Icon as={MdLock} color="blue.300" boxSize={3} />
                    <Text fontSize="xs" color="blue.300">
                      Your private key is encrypted client-side and never sent to the server
                    </Text>
                  </HStack>
                </VStack>
              </Box>

              {/* Security Score */}
              <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
                <HStack mb={4}>
                  <Icon as={FiCheckCircle} color={brandColors.primary} boxSize={6} />
                  <Heading size="md">Security Status</Heading>
                </HStack>
                {isCheckingStatus ? (
                  <HStack justify="center" py={4}>
                    <Spinner size="sm" />
                    <Text color="gray.400" fontSize="sm">
                      Checking backup status...
                    </Text>
                  </HStack>
                ) : (
                  <Text color="gray.300" fontSize="lg">
                    {backupStatus || 'Click on the "Check Status" button'}
                  </Text>
                )}
              </Box>

              <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
                <Box
                  bg="gray.900"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                  _hover={{ borderColor: brandColors.primary, transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <Icon as={MdInfo} color={brandColors.primary} boxSize={6} mb={3} />
                  <Heading size="sm" mb={3}>
                    Check Backup Status
                  </Heading>
                  <Text fontSize="sm" color="gray.400" mb={4}>
                    Get your current security score and backup recommendations
                  </Text>
                  <Button
                    bg={brandColors.primary}
                    color="white"
                    _hover={{ bg: brandColors.secondary }}
                    onClick={handleGetBackupStatus}
                    loading={isCheckingStatus}
                    spinner={<Spinner size="16px" />}
                    loadingText="Checking..."
                    disabled={isCheckingStatus || isCreatingBackup || isRestoring}
                    width="full"
                  >
                    Check Status
                  </Button>
                </Box>

                <Box
                  bg="gray.900"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                  _hover={{ borderColor: brandColors.primary, transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <Icon as={MdDownload} color={brandColors.primary} boxSize={6} mb={3} />
                  <Heading size="sm" mb={3}>
                    Create ZIP Backup
                  </Heading>
                  <Text fontSize="sm" color="gray.400" mb={4}>
                    Download an encrypted ZIP file protected by your password
                  </Text>
                  <Button
                    bg={brandColors.primary}
                    color="white"
                    _hover={{ bg: brandColors.secondary }}
                    onClick={handleCreateBackup}
                    loading={isCreatingBackup}
                    spinner={<Spinner size="16px" />}
                    loadingText="Creating..."
                    disabled={isCheckingStatus || isCreatingBackup || isRestoring}
                    width="full"
                  >
                    Create Backup
                  </Button>
                </Box>

                <Box
                  bg="gray.900"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                  _hover={{ borderColor: brandColors.primary, transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <Icon as={FiUpload} color={brandColors.primary} boxSize={6} mb={3} />
                  <Heading size="sm" mb={3}>
                    Restore from Backup
                  </Heading>
                  <Text fontSize="sm" color="gray.400" mb={4}>
                    Restore your wallet from an encrypted backup file
                  </Text>
                  <Button
                    bg={brandColors.primary}
                    color="white"
                    _hover={{ bg: brandColors.secondary }}
                    onClick={handleRestoreBackup}
                    loading={isRestoring}
                    spinner={<Spinner size="16px" />}
                    loadingText="Restoring..."
                    disabled={isCheckingStatus || isCreatingBackup || isRestoring}
                    width="full"
                  >
                    Restore Backup
                  </Button>
                </Box>
              </SimpleGrid>

              <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
                <Heading size="sm" mb={4} color={brandColors.primary}>
                  About Client-Side Backup
                </Heading>
                <VStack align="stretch" gap={3} fontSize="sm" color="gray.400">
                  <Text>
                    Your wallet&apos;s core secret (the mnemonic phrase) is generated and encrypted
                    entirely on your device. The backup process retrieves this encrypted data from
                    your browser&apos;s local storage using your password, then packages it into a
                    secure ZIP file for you to download.
                  </Text>
                  <Text>
                    The encryption key for your wallet is derived using a WebAuthn signature, which
                    requires your biometric authentication (fingerprint, face scan) or device PIN.
                    This means even if someone gains access to the encrypted data stored in your
                    browser, they cannot decrypt it without your physical device and authentication.
                  </Text>
                  <Text>
                    Your backup ZIP file is encrypted using AES-256-GCM with a key derived from the
                    password you provide. Store this file securely and remember your password.
                  </Text>
                  <Box p={4} bg="yellow.900/90" mt={2}>
                    <Text fontSize="xs">
                      If you lose access to your device, passkey, AND the backup file/password, your
                      wallet cannot be recovered.
                    </Text>
                  </Box>
                </VStack>
              </Box>
            </VStack>
          </TabsContent>

          <TabsContent value="recovery" pt={8}>
            <VStack gap={8} align="stretch">
              <Box>
                <Heading size="lg" mb={4}>
                  Recovery Options
                </Heading>
                <Text color="gray.400" mb={6}>
                  Multiple ways to recover your wallet in case of device loss or failure
                </Text>
              </Box>

              <Box p={4} bg="rgba(139, 92, 246, 0.1)" borderRadius="lg">
                <Box fontSize="sm">
                  <Text fontWeight="bold" mb={1}>
                    Coming Soon
                  </Text>
                  <Text>
                    These recovery features are already available in the w3pk SDK and will be
                    implemented in this app soon. w3pk provides a three-layer recovery system for
                    maximum security and flexibility.
                  </Text>
                </Box>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                <Box
                  bg="gray.900"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                  _hover={{ borderColor: brandColors.primary, transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <Icon as={FiKey} color={brandColors.primary} boxSize={8} mb={4} />
                  <Badge colorPalette="purple" mb={2}>
                    LAYER 1
                  </Badge>
                  <Heading size="md" mb={3}>
                    Passkey Auto-Sync
                  </Heading>
                  <Text fontSize="sm" color="gray.400" mb={4}>
                    WebAuthn credentials automatically sync via platform services (iCloud Keychain,
                    Google Password Manager)
                  </Text>
                  <ListRoot gap={2} fontSize="sm">
                    <ListItem>
                      <Icon as={FiCheckCircle} color="green.400" />
                      Automatic (no user action needed)
                    </ListItem>
                    <ListItem>
                      <Icon as={FiCheckCircle} color="green.400" />
                      Instant recovery on new device
                    </ListItem>
                    <ListItem>
                      <Icon as={FiCheckCircle} color="green.400" />
                      Hardware-protected security
                    </ListItem>
                    <ListItem>
                      <Icon as={MdWarning} color="yellow.400" />
                      Platform-specific (Apple/Google)
                    </ListItem>
                  </ListRoot>
                </Box>

                <Box
                  bg="gray.900"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                  _hover={{ borderColor: brandColors.primary, transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <Icon as={FiDownload} color={brandColors.primary} boxSize={8} mb={4} />
                  <Badge colorPalette="purple" mb={2}>
                    LAYER 2
                  </Badge>
                  <Heading size="md" mb={3}>
                    Encrypted Backups
                  </Heading>
                  <Text fontSize="sm" color="gray.400" mb={4}>
                    Password-protected ZIP files or QR codes that you can store offline or in the
                    cloud
                  </Text>
                  <ListRoot gap={2} fontSize="sm">
                    <ListItem>
                      <Icon as={FiCheckCircle} color="green.400" />
                      Works across any platform
                    </ListItem>
                    <ListItem>
                      <Icon as={FiCheckCircle} color="green.400" />
                      Military-grade encryption (AES-256-GCM)
                    </ListItem>
                    <ListItem>
                      <Icon as={FiCheckCircle} color="green.400" />
                      Multiple backup formats
                    </ListItem>
                    <ListItem>
                      <Icon as={MdWarning} color="yellow.400" />
                      Must remember password
                    </ListItem>
                  </ListRoot>
                </Box>

                <Box
                  bg="gray.900"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                  _hover={{ borderColor: brandColors.primary, transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <Icon as={FiUsers} color={brandColors.primary} boxSize={8} mb={4} />
                  <Badge colorPalette="purple" mb={2}>
                    LAYER 3
                  </Badge>
                  <Heading size="md" mb={3}>
                    Social Recovery
                  </Heading>
                  <Text fontSize="sm" color="gray.400" mb={4}>
                    Split your recovery phrase among trusted friends/family using Shamir Secret
                    Sharing (e.g., 3-of-5)
                  </Text>
                  <ListRoot gap={2} fontSize="sm">
                    <ListItem>
                      <Icon as={FiCheckCircle} color="green.400" />
                      No single point of failure
                    </ListItem>
                    <ListItem>
                      <Icon as={FiCheckCircle} color="green.400" />
                      Information-theoretic security
                    </ListItem>
                    <ListItem>
                      <Icon as={FiCheckCircle} color="green.400" />
                      Survives forgotten passwords
                    </ListItem>
                    <ListItem>
                      <Icon as={MdWarning} color="yellow.400" />
                      Requires trusted guardians
                    </ListItem>
                  </ListRoot>
                </Box>

                <Box
                  bg="gray.900"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                  _hover={{ borderColor: brandColors.primary, transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <Icon as={FiShield} color={brandColors.primary} boxSize={8} mb={4} />
                  <Badge colorPalette="green" mb={2}>
                    UNIVERSAL
                  </Badge>
                  <Heading size="md" mb={3}>
                    Manual Mnemonic
                  </Heading>
                  <Text fontSize="sm" color="gray.400" mb={4}>
                    Your 12-word recovery phrase - the ultimate backup that works with any
                    BIP39-compatible wallet
                  </Text>
                  <ListRoot gap={2} fontSize="sm">
                    <ListItem>
                      <Icon as={FiCheckCircle} color="green.400" />
                      Compatible with MetaMask, Ledger, etc.
                    </ListItem>
                    <ListItem>
                      <Icon as={FiCheckCircle} color="green.400" />
                      Never changes
                    </ListItem>
                    <ListItem>
                      <Icon as={FiCheckCircle} color="green.400" />
                      Simple and universal
                    </ListItem>
                    <ListItem>
                      <Icon as={MdWarning} color="yellow.400" />
                      Keep it absolutely secret
                    </ListItem>
                  </ListRoot>
                </Box>
              </SimpleGrid>

              <Box
                p={6}
                borderColor={brandColors.accent}
                border="2px solid"
                borderRadius="xl"
                textAlign="center"
                boxShadow="0 10px 100px rgba(69, 162, 248, 0.2)"
              >
                <Heading size="md" mb={3} color="white">
                  Learn More About Recovery
                </Heading>
                <Text fontSize="sm" color="gray.400" mb={4}>
                  Read the complete recovery architecture documentation
                </Text>
                <ChakraLink
                  href="https://github.com/w3hc/w3pk/blob/main/docs/RECOVERY.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    bg="white"
                    color={brandColors.accent}
                    _hover={{ bg: 'gray.100' }}
                    size="sm"
                  >
                    View Documentation
                  </Button>
                </ChakraLink>
              </Box>
            </VStack>
          </TabsContent>

          <TabsContent value="sync" pt={8}>
            <VStack gap={8} align="stretch">
              <Box>
                <Heading size="lg" mb={4}>
                  Device Sync
                </Heading>
                <Text color="gray.400" mb={6}>
                  Your passkey automatically syncs across devices using platform services
                </Text>
              </Box>

              <Box p={4} bg="rgba(139, 92, 246, 0.1)" borderRadius="lg">
                <Box fontSize="sm">
                  <Text fontWeight="bold" mb={1}>
                    Coming Soon
                  </Text>
                  <Text>
                    Sync status and management features are already available in the w3pk SDK and
                    will be implemented in this app soon. Your passkey is already syncing
                    automatically via your platform provider (Apple iCloud, Google, or Microsoft).
                  </Text>
                </Box>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                <Box
                  bg="gray.900"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                >
                  <Icon as={FiCloud} color={brandColors.primary} boxSize={8} mb={4} />
                  <Heading size="md" mb={3}>
                    Apple iCloud
                  </Heading>
                  <Text fontSize="sm" color="gray.400" mb={4}>
                    For iOS and macOS devices with iCloud Keychain enabled
                  </Text>
                  <ListRoot gap={2} fontSize="sm" color="gray.400">
                    <ListItem>
                      <Icon as={MdCheckCircle} color="green.400" />
                      Syncs across iPhone, iPad, and Mac
                    </ListItem>
                    <ListItem>
                      <Icon as={MdCheckCircle} color="green.400" />
                      End-to-end encrypted
                    </ListItem>
                    <ListItem>
                      <Icon as={MdCheckCircle} color="green.400" />
                      Automatic backup to iCloud
                    </ListItem>
                    <ListItem>
                      <Icon as={MdWarning} color="yellow.400" />
                      Requires iCloud Keychain enabled
                    </ListItem>
                  </ListRoot>
                </Box>

                <Box
                  bg="gray.900"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                >
                  <Icon as={FiCloud} color={brandColors.primary} boxSize={8} mb={4} />
                  <Heading size="md" mb={3}>
                    Google Password Manager
                  </Heading>
                  <Text fontSize="sm" color="gray.400" mb={4}>
                    For Android devices and Chrome browser
                  </Text>
                  <ListRoot gap={2} fontSize="sm" color="gray.400">
                    <ListItem>
                      <Icon as={MdCheckCircle} color="green.400" />
                      Syncs across Android devices
                    </ListItem>
                    <ListItem>
                      <Icon as={MdCheckCircle} color="green.400" />
                      End-to-end encrypted
                    </ListItem>
                    <ListItem>
                      <Icon as={MdCheckCircle} color="green.400" />
                      Automatic backup to Google account
                    </ListItem>
                    <ListItem>
                      <Icon as={MdWarning} color="yellow.400" />
                      Requires Google account sync
                    </ListItem>
                  </ListRoot>
                </Box>

                <Box
                  bg="gray.900"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                >
                  <Icon as={FiCloud} color={brandColors.primary} boxSize={8} mb={4} />
                  <Heading size="md" mb={3}>
                    Windows Hello
                  </Heading>
                  <Text fontSize="sm" color="gray.400" mb={4}>
                    For Windows devices with Windows Hello
                  </Text>
                  <ListRoot gap={2} fontSize="sm" color="gray.400">
                    <ListItem>
                      <Icon as={MdCheckCircle} color="green.400" />
                      Hardware-protected (TPM)
                    </ListItem>
                    <ListItem>
                      <Icon as={MdWarning} color="yellow.400" />
                      Tied to specific device
                    </ListItem>
                    <ListItem>
                      <Icon as={MdWarning} color="yellow.400" />
                      Does NOT sync by default
                    </ListItem>
                    <ListItem>
                      <Icon as={MdInfo} color="blue.400" />
                      Use encrypted backup for new devices
                    </ListItem>
                  </ListRoot>
                </Box>

                <Box
                  bg="gray.900"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                >
                  <Icon as={FiKey} color={brandColors.primary} boxSize={8} mb={4} />
                  <Heading size="md" mb={3}>
                    Hardware Keys
                  </Heading>
                  <Text fontSize="sm" color="gray.400" mb={4}>
                    Physical security keys like YubiKey
                  </Text>
                  <ListRoot gap={2} fontSize="sm" color="gray.400">
                    <ListItem>
                      <Icon as={MdCheckCircle} color="green.400" />
                      Maximum security
                    </ListItem>
                    <ListItem>
                      <Icon as={MdCheckCircle} color="green.400" />
                      Physical device required
                    </ListItem>
                    <ListItem>
                      <Icon as={MdWarning} color="yellow.400" />
                      No automatic sync
                    </ListItem>
                    <ListItem>
                      <Icon as={MdInfo} color="blue.400" />
                      Keep encrypted backup separately
                    </ListItem>
                  </ListRoot>
                </Box>
              </SimpleGrid>

              <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
                <Heading size="sm" mb={4} color={brandColors.primary}>
                  Important Notes
                </Heading>
                <VStack align="stretch" gap={3} fontSize="sm" color="gray.400">
                  <Text>
                    <strong>Cross-platform limitation:</strong> Passkey sync does not work across
                    different ecosystems. For example, credentials created on an iPhone cannot
                    automatically sync to an Android device.
                  </Text>
                  <Text>
                    <strong>Recommendation:</strong> Always create an encrypted backup (Layer 2) to
                    ensure you can access your wallet on any device, regardless of platform.
                  </Text>
                  <Text>
                    <strong>Platform trust:</strong> Your passkey security depends on your platform
                    provider&apos;s security. All major providers (Apple, Google, Microsoft) use
                    industry-standard encryption and security practices.
                  </Text>
                </VStack>
              </Box>

              <Box
                p={6}
                borderColor={brandColors.accent}
                border="2px solid"
                borderRadius="xl"
                textAlign="center"
                boxShadow="0 10px 100px rgba(69, 162, 248, 0.2)"
              >
                <Heading size="md" mb={3} color="white">
                  Learn More About Security
                </Heading>
                <Text fontSize="sm" color="gray.400" mb={4}>
                  Read about w3pk&apos;s security architecture and sync mechanisms
                </Text>
                <ChakraLink
                  href="https://github.com/w3hc/w3pk/blob/main/docs/SECURITY.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    bg="white"
                    color={brandColors.accent}
                    _hover={{ bg: 'gray.100' }}
                    size="sm"
                  >
                    View Security Docs
                  </Button>
                </ChakraLink>
              </Box>
            </VStack>
          </TabsContent>
        </TabsRoot>
      </VStack>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={handleModalClose}
        onSubmit={handlePasswordSubmit}
        title={`Enter Password to Create Backup`}
        description={`Please enter your password to create the backup. This is required by the w3pk SDK to access your encrypted wallet data.`}
      />

      <PasswordModal
        isOpen={showRestorePasswordModal}
        onClose={handleRestoreModalClose}
        onSubmit={handleRestorePasswordSubmit}
        title={`Enter Password to Restore Backup`}
        description={`Please enter the password you used when creating this backup file.`}
      />

      <DialogRoot
        open={isOpen}
        onOpenChange={(e: { open: boolean }) => (e.open ? null : onClose())}
      >
        <DialogBackdrop bg="blackAlpha.600" />
        <DialogContent
          bg="gray.800"
          color="white"
          role="alertdialog"
          aria-labelledby="delete-modal-title"
          aria-describedby="delete-modal-desc"
        >
          <DialogHeader id="delete-modal-title">Remove Account</DialogHeader>
          <DialogCloseTrigger />
          <DialogBody id="delete-modal-desc">
            <VStack gap={4} align="stretch">
              <Text>
                Are you sure you want to remove the account{' '}
                <strong>{accountToDelete?.username}</strong>?
              </Text>
              <Box bg="red.900" p={3} borderRadius="md">
                <Text fontSize="sm" color="red.200">
                  <strong>Warning:</strong> This will delete all data for this account from this
                  device. Make sure you have a backup before proceeding. This action cannot be
                  undone.
                </Text>
              </Box>
              {user?.ethereumAddress === accountToDelete?.ethereumAddress && (
                <Box bg="orange.900" p={3} borderRadius="md">
                  <Text fontSize="sm" color="orange.200">
                    This is your currently logged-in account. You will be logged out after removal.
                  </Text>
                </Box>
              )}
            </VStack>
          </DialogBody>

          <DialogFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorPalette="red" onClick={confirmDeleteAccount}>
              Remove Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      <DialogRoot
        open={showLocalStorageModal}
        onOpenChange={(e: { open: boolean }) => (e.open ? null : setShowLocalStorageModal(false))}
        size="xl"
        scrollBehavior="inside"
      >
        <DialogBackdrop bg="blackAlpha.600" />
        <DialogContent bg="gray.800" color="white" maxH="80vh">
          <DialogHeader>
            <HStack>
              <Icon as={FiHardDrive} color={brandColors.primary} />
              <Text>LocalStorage Inspection</Text>
            </HStack>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody>
            <VStack align="stretch" gap={4}>
              <Text fontSize="sm" color="gray.400">
                Found {localStorageData.length} items in localStorage
              </Text>

              {localStorageData.length === 0 ? (
                <Box bg="gray.900" p={4} borderRadius="md" textAlign="center">
                  <Text color="gray.500">No data found</Text>
                </Box>
              ) : (
                localStorageData.map((item, index) => (
                  <Box
                    key={index}
                    bg="gray.900"
                    p={4}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={item.type.startsWith('w3pk') ? 'purple.600' : 'gray.700'}
                  >
                    <VStack align="stretch" gap={2}>
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="bold" color="white">
                          {item.key}
                        </Text>
                        <HStack gap={2}>
                          {item.encrypted && (
                            <Badge colorPalette="orange" fontSize="xs">
                              Encrypted
                            </Badge>
                          )}
                          <Badge
                            colorPalette={item.type.startsWith('w3pk') ? 'purple' : 'gray'}
                            fontSize="xs"
                          >
                            {item.type}
                          </Badge>
                        </HStack>
                      </HStack>

                      {item.parsedValue && (
                        <Box bg="gray.950" p={3} borderRadius="md" overflowX="auto">
                          <CodeBlock>
                            {formatValue(maskSensitiveData(item.key, item.parsedValue))}
                          </CodeBlock>
                        </Box>
                      )}

                      {!item.parsedValue && (
                        <Text fontSize="xs" color="gray.500" fontFamily="monospace">
                          {item.value}
                        </Text>
                      )}
                    </VStack>
                  </Box>
                ))
              )}
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setShowLocalStorageModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      <DialogRoot
        open={showIndexedDBModal}
        onOpenChange={(e: { open: boolean }) => (e.open ? null : setShowIndexedDBModal(false))}
        size="xl"
        scrollBehavior="inside"
      >
        <DialogBackdrop bg="blackAlpha.600" />
        <DialogContent bg="gray.800" color="white" maxH="80vh">
          <DialogHeader>
            <HStack>
              <Icon as={FiDatabase} color={brandColors.primary} />
              <Text>IndexedDB Inspection</Text>
            </HStack>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody>
            <VStack align="stretch" gap={4}>
              <Text fontSize="sm" color="gray.400">
                Found {indexedDBData.length} database(s)
              </Text>

              {indexedDBData.length === 0 ? (
                <Box bg="gray.900" p={4} borderRadius="md" textAlign="center">
                  <Text color="gray.500">No w3pk-related databases found</Text>
                </Box>
              ) : (
                indexedDBData.map((db, dbIndex) => (
                  <Box
                    key={dbIndex}
                    bg="gray.900"
                    p={4}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="purple.600"
                  >
                    <VStack align="stretch" gap={3}>
                      <HStack justify="space-between">
                        <Text fontSize="md" fontWeight="bold" color="white">
                          {db.name}
                        </Text>
                        <Badge colorPalette="purple" fontSize="xs">
                          v{db.version}
                        </Badge>
                      </HStack>

                      <Text fontSize="xs" color="gray.400">
                        Stores: {db.stores.join(', ')}
                      </Text>

                      <Text fontSize="xs" color="gray.400">
                        Records: {db.records.length}
                      </Text>

                      {db.records.length > 0 && (
                        <VStack align="stretch" gap={2} mt={2}>
                          {db.records.map((record, recordIndex) => (
                            <Box
                              key={recordIndex}
                              bg="gray.950"
                              p={3}
                              borderRadius="md"
                              border="1px solid"
                              borderColor="gray.800"
                            >
                              <Text fontSize="xs" color="gray.400" mb={2}>
                                Store: {record.store} | Key: {record.key}
                              </Text>
                              <Box overflowX="auto">
                                <CodeBlock>
                                  {formatValue(maskSensitiveData(record.key, record.value))}
                                </CodeBlock>
                              </Box>
                            </Box>
                          ))}
                        </VStack>
                      )}
                    </VStack>
                  </Box>
                ))
              )}
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setShowIndexedDBModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  )
}

export default SettingsPage
