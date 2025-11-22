// app/settings/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  Text,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  Code,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  HStack,
  SimpleGrid,
  Icon,
  List,
  ListItem,
  ListIcon,
  Badge,
  Link as ChakraLink,
} from '@chakra-ui/react'
import {
  DeleteIcon,
  CheckCircleIcon,
  WarningIcon,
  InfoIcon,
  DownloadIcon,
  LockIcon,
} from '@chakra-ui/icons'
import {
  FiShield,
  FiCheckCircle,
  FiCloud,
  FiUsers,
  FiKey,
  FiDownload,
  FiDatabase,
  FiHardDrive,
} from 'react-icons/fi'
import { useW3PK } from '../../../src/context/W3PK'
import Spinner from '../../../src/components/Spinner'
import PasswordModal from '../../components/PasswordModal'
import { detectBrowser, isWebAuthnAvailable } from '../../../src/utils/browserDetection'
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
  const [backupStatus, setBackupStatus] = useState<string | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [accountToDelete, setAccountToDelete] = useState<StoredAccount | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  // Storage inspection state
  const [localStorageData, setLocalStorageData] = useState<LocalStorageItem[]>([])
  const [indexedDBData, setIndexedDBData] = useState<IndexedDBInfo[]>([])
  const [isInspectingLocalStorage, setIsInspectingLocalStorage] = useState(false)
  const [isInspectingIndexedDB, setIsInspectingIndexedDB] = useState(false)
  const [showLocalStorageModal, setShowLocalStorageModal] = useState(false)
  const [showIndexedDBModal, setShowIndexedDBModal] = useState(false)

  const toast = useToast()
  const { isAuthenticated, user, getBackupStatus, createZipBackup, logout } = useW3PK()

  // Handler functions (defined before the early return)
  const handleInspectLocalStorage = async () => {
    setIsInspectingLocalStorage(true)
    try {
      const data = await inspectLocalStorage()
      setLocalStorageData(data)

      toast({
        title: 'LocalStorage Inspected',
        description: `Found ${data.length} items. Scroll down to see results.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error inspecting localStorage:', error)
      toast({
        title: 'Error',
        description: 'Failed to inspect localStorage',
        status: 'error',
        duration: 3000,
        isClosable: true,
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
      toast({
        title: 'IndexedDB Inspected',
        description: `Found ${data.length} database(s) with ${totalRecords} record(s). Scroll down to see results.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error inspecting IndexedDB:', error)
      toast({
        title: 'Error',
        description: 'Failed to inspect IndexedDB',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsInspectingIndexedDB(false)
    }
  }

  const handleClearLocalStorageItem = async (key: string) => {
    const success = clearLocalStorageItem(key)
    if (success) {
      // Refresh the localStorage data
      const updatedData = localStorageData.filter(item => item.key !== key)
      setLocalStorageData(updatedData)

      toast({
        title: 'Item Cleared',
        description: `Removed "${key}" from localStorage`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'Error',
        description: `Failed to clear "${key}"`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleClearIndexedDBRecord = async (dbName: string, storeName: string, key: string) => {
    const success = await clearIndexedDBRecord(dbName, storeName, key)
    if (success) {
      // Refresh the IndexedDB data
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

      toast({
        title: 'Record Cleared',
        description: `Removed record from ${dbName}/${storeName}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'Error',
        description: 'Failed to clear record',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // Load accounts from localStorage
  const loadAccounts = useCallback(() => {
    try {
      const storedAccounts: StoredAccount[] = []

      // Check localStorage for w3pk stored data
      if (typeof window !== 'undefined' && window.localStorage) {
        // Look for w3pk-related keys
        const keys = Object.keys(localStorage)
        const w3pkKeys = keys.filter(key => key.startsWith('w3pk_') || key.includes('passkey'))

        console.log('Found w3pk keys:', w3pkKeys)

        // Try to extract account information
        keys.forEach(key => {
          try {
            const value = localStorage.getItem(key)
            if (value) {
              // Try to parse as JSON
              try {
                const parsed = JSON.parse(value)
                // Check if it looks like user data
                if (parsed.username && parsed.ethereumAddress) {
                  storedAccounts.push({
                    username: parsed.username,
                    ethereumAddress: parsed.ethereumAddress,
                    id: parsed.id || parsed.username,
                    displayName: parsed.displayName,
                  })
                }
                // Check for nested user data
                else if (parsed.user && parsed.user.username && parsed.user.ethereumAddress) {
                  storedAccounts.push({
                    username: parsed.user.username,
                    ethereumAddress: parsed.user.ethereumAddress,
                    id: parsed.user.id || parsed.user.username,
                    displayName: parsed.user.displayName,
                  })
                }
              } catch (e) {
                // Not JSON or doesn't contain user data
              }
            }
          } catch (e) {
            console.error('Error checking key:', key, e)
          }
        })
      }

      // Add current user if authenticated and not already in the list
      if (user && !storedAccounts.find(acc => acc.ethereumAddress === user.ethereumAddress)) {
        storedAccounts.push({
          username: user.username,
          ethereumAddress: user.ethereumAddress,
          id: user.id,
          displayName: user.displayName,
        })
      }

      // Remove duplicates based on ethereum address
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
      // Clear all localStorage data related to w3pk for this account
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(localStorage)
        const keysToRemove: string[] = []

        // Find keys that contain the account information
        keys.forEach(key => {
          try {
            const value = localStorage.getItem(key)
            if (value) {
              // Check if this key contains the account we want to delete
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

        // Remove all identified keys
        keysToRemove.forEach(key => {
          localStorage.removeItem(key)
          console.log('Removed key:', key)
        })

        toast({
          title: 'Account Removed',
          description: `Account ${accountToDelete.username} has been removed from this device.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })

        // If we deleted the current user's account, log them out
        if (user && user.ethereumAddress === accountToDelete.ethereumAddress) {
          toast({
            title: 'Logging out',
            description: 'You removed your current account. Logging out...',
            status: 'info',
            duration: 2000,
            isClosable: true,
          })
          setTimeout(() => {
            logout()
          }, 2000)
        }

        // Reload accounts
        loadAccounts()
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove account. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setAccountToDelete(null)
      onClose()
    }
  }

  if (!isAuthenticated || !getBackupStatus || !createZipBackup) {
    // Detect browser information
    const browserInfo = detectBrowser()
    const webAuthnAvailable = isWebAuthnAvailable()

    // Determine alert status based on browser compatibility
    let alertStatus: 'info' | 'warning' | 'error' = 'warning'
    if (browserInfo.warningLevel === 'error') alertStatus = 'error'
    else if (browserInfo.warningLevel === 'warning') alertStatus = 'warning'
    else if (browserInfo.warningLevel === 'info') alertStatus = 'info'

    return (
      <Container maxW="container.md" py={20}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading as="h1" size="xl" mb={4}>
              Settings
            </Heading>
            <Text fontSize="lg" color="gray.400">
              Please login to access your settings
            </Text>
          </Box>

          {/* Browser Information Card */}
          <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
            <HStack mb={4}>
              <Icon as={InfoIcon} color="#8c1c84" boxSize={6} />
              <Heading size="md">Browser Info</Heading>
            </HStack>
            <VStack align="stretch" spacing={3}>
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
                <Badge colorScheme={webAuthnAvailable ? 'green' : 'red'}>
                  {webAuthnAvailable ? 'Available' : 'Not Available'}
                </Badge>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.400">
                  Compatibility:
                </Text>
                <Badge
                  colorScheme={
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

          {/* Compatibility Warning/Recommendation */}
          {browserInfo.recommendation && (
            <Alert
              status={alertStatus}
              bg={
                alertStatus === 'error'
                  ? 'red.900'
                  : alertStatus === 'warning'
                    ? 'yellow.900'
                    : 'blue.900'
              }
              borderRadius="lg"
              opacity={0.9}
            >
              <AlertIcon />
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
            </Alert>
          )}

          {/* WebAuthn Not Available Warning */}
          {!webAuthnAvailable && (
            <Alert status="error" bg="red.900" borderRadius="lg" opacity={0.9}>
              <AlertIcon />
              <Box fontSize="sm">
                <Text fontWeight="bold" mb={1}>
                  WebAuthn Not Available
                </Text>
                <Text fontSize="sm">
                  Your browser does not support WebAuthn, which is required for w3pk authentication.
                  Please update your browser or use a supported browser:
                </Text>
                <List spacing={1} mt={2} ml={4} fontSize="xs">
                  <ListItem>Chrome 67+ (May 2018)</ListItem>
                  <ListItem>Firefox 60+ (May 2018)</ListItem>
                  <ListItem>Safari 14+ (September 2020)</ListItem>
                  <ListItem>Edge 18+ (November 2018)</ListItem>
                  <ListItem>Samsung Internet 11+ (February 2020)</ListItem>
                </List>
              </Box>
            </Alert>
          )}

          {/* Additional Android Browser Recommendations */}
          {browserInfo.os === 'Android' && (
            <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
              <Heading size="sm" mb={3} color="#8c1c84">
                Recommended Browsers for Android
              </Heading>
              <List spacing={2} fontSize="sm">
                <ListItem>
                  <HStack>
                    <ListIcon
                      as={browserInfo.name === 'Samsung Internet' ? CheckCircleIcon : InfoIcon}
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
                    <ListIcon
                      as={browserInfo.name === 'Chrome' ? CheckCircleIcon : InfoIcon}
                      color={browserInfo.name === 'Chrome' ? 'green.400' : 'gray.400'}
                    />
                    <Text color="gray.300">
                      <strong>Chrome</strong> - ✅ Reliable
                    </Text>
                  </HStack>
                </ListItem>
                <ListItem>
                  <HStack>
                    <ListIcon
                      as={browserInfo.name === 'Edge' ? CheckCircleIcon : InfoIcon}
                      color={browserInfo.name === 'Edge' ? 'green.400' : 'gray.400'}
                    />
                    <Text color="gray.300">
                      <strong>Edge</strong> - ✅ Reliable
                    </Text>
                  </HStack>
                </ListItem>
                <ListItem>
                  <HStack>
                    <ListIcon as={WarningIcon} color="yellow.400" />
                    <Text color="gray.300">
                      <strong>Firefox Mobile</strong> - ⚠️ Avoid (known passkey persistence issues)
                    </Text>
                  </HStack>
                </ListItem>
              </List>
            </Box>
          )}

          {/* Storage Inspection Tools */}
          <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
            <Heading size="sm" mb={3} color="#8c1c84">
              Debug & Inspect Storage
            </Heading>
            <Text fontSize="sm" color="gray.400" mb={4}>
              Inspect browser storage and activity logs
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Button
                leftIcon={<Icon as={FiHardDrive} />}
                onClick={handleInspectLocalStorage}
                isLoading={isInspectingLocalStorage}
                loadingText="Inspecting..."
                variant="outline"
                colorScheme="purple"
                size="sm"
              >
                Inspect LocalStorage
              </Button>
              <Button
                leftIcon={<Icon as={FiDatabase} />}
                onClick={handleInspectIndexedDB}
                isLoading={isInspectingIndexedDB}
                loadingText="Inspecting..."
                variant="outline"
                colorScheme="purple"
                size="sm"
              >
                Inspect IndexedDB
              </Button>
            </SimpleGrid>
          </Box>

          {/* LocalStorage Results */}
          {localStorageData.length > 0 && (
            <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="purple.600">
              <HStack mb={4} justify="space-between">
                <HStack>
                  <Icon as={FiHardDrive} color="#8c1c84" boxSize={6} />
                  <Heading size="md">LocalStorage Results</Heading>
                </HStack>
                <Badge colorScheme="purple">{localStorageData.length} items</Badge>
              </HStack>
              <VStack align="stretch" spacing={3}>
                {localStorageData.map((item, index) => (
                  <Box
                    key={index}
                    bg="gray.950"
                    p={4}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={item.type.startsWith('w3pk') ? 'purple.700' : 'gray.800'}
                  >
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="bold" color="white" flex={1}>
                          {item.key}
                        </Text>
                        <HStack spacing={2}>
                          {item.encrypted && (
                            <Badge colorScheme="orange" fontSize="xs">
                              Encrypted
                            </Badge>
                          )}
                          <Badge
                            colorScheme={item.type.startsWith('w3pk') ? 'purple' : 'gray'}
                            fontSize="xs"
                          >
                            {item.type}
                          </Badge>
                          <IconButton
                            aria-label="Clear item"
                            icon={<DeleteIcon />}
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleClearLocalStorageItem(item.key)}
                          />
                        </HStack>
                      </HStack>

                      {item.parsedValue && (
                        <Box
                          bg="black"
                          p={3}
                          borderRadius="md"
                          fontSize="xs"
                          fontFamily="monospace"
                          overflowX="auto"
                        >
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                            {formatValue(maskSensitiveData(item.key, item.parsedValue))}
                          </pre>
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

          {/* IndexedDB Results */}
          {indexedDBData.length > 0 && (
            <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="purple.600">
              <HStack mb={4} justify="space-between">
                <HStack>
                  <Icon as={FiDatabase} color="#8c1c84" boxSize={6} />
                  <Heading size="md">IndexedDB Results</Heading>
                </HStack>
                <Badge colorScheme="purple">{indexedDBData.length} database(s)</Badge>
              </HStack>
              <VStack align="stretch" spacing={4}>
                {indexedDBData.map((db, dbIndex) => (
                  <Box
                    key={dbIndex}
                    bg="gray.950"
                    p={4}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="purple.700"
                  >
                    <VStack align="stretch" spacing={3}>
                      <HStack justify="space-between">
                        <Text fontSize="md" fontWeight="bold" color="white">
                          {db.name}
                        </Text>
                        <Badge colorScheme="purple" fontSize="xs">
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
                        <VStack align="stretch" spacing={2} mt={2}>
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
                                  icon={<DeleteIcon />}
                                  size="xs"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() =>
                                    handleClearIndexedDBRecord(db.name, record.store, record.key)
                                  }
                                />
                              </HStack>
                              <Box fontSize="xs" fontFamily="monospace" overflowX="auto">
                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                  {formatValue(maskSensitiveData(record.key, record.value))}
                                </pre>
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

          {/* Login Prompt */}
          <Box bg="whiteAlpha.50" p={6} borderRadius="md" textAlign="center">
            <Alert status="info" bg="transparent" color="blue.200">
              <AlertIcon />
              <AlertDescription>
                Please log in or register to access your settings and manage your wallet.
              </AlertDescription>
            </Alert>
          </Box>
        </VStack>
      </Container>
    )
  }

  const handleGetBackupStatus = async () => {
    setIsCheckingStatus(true)
    setBackupStatus(null)
    try {
      const statusObject = await getBackupStatus()
      console.log('Retrieved status object:', statusObject)

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
        console.error('Unexpected status object structure:', statusObject)
        setBackupStatus('Error: Unexpected status data format.')
      }

      toast({
        title: 'Backup Status Retrieved.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error getting backup status:', error)
      toast({
        title: 'Error retrieving status.',
        description: (error as Error).message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
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
      toast({
        title: 'Error creating backup.',
        description: (error as Error).message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handlePasswordSubmit = async (password: string) => {
    setShowPasswordModal(false)

    try {
      const backupBlob = await createZipBackup(password)
      const link = document.createElement('a')
      link.href = URL.createObjectURL(backupBlob)
      link.download = `w3pk_backup_${user?.username || 'user'}_${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Backup Created Successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error creating backup:', error)
      toast({
        title: 'Error creating backup.',
        description: (error as Error).message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleModalClose = () => {
    setShowPasswordModal(false)
  }

  return (
    <>
      <Container maxW="container.md" py={20}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading as="h1" size="xl" mb={4}>
              Settings
            </Heading>
            <Text fontSize="lg" color="gray.400">
              Manage your accounts, backups, and recovery options
            </Text>
          </Box>

          <Tabs colorScheme="purple" variant="enclosed" size="lg">
            <TabList>
              <Tab>Accounts</Tab>
              <Tab>Backup</Tab>
              <Tab>Recovery</Tab>
              <Tab>Sync</Tab>
            </TabList>

            <TabPanels>
              {/* Accounts Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading as="h2" size="lg" mb={4}>
                      Accounts on this Device
                    </Heading>
                    <Text fontSize="md" color="gray.400" mb={6}>
                      These are all the accounts stored on this device. You can remove any account
                      to free up space.
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
                            ? '2px solid #8c1c84'
                            : '1px solid'
                        }
                        borderColor={
                          user?.ethereumAddress === account.ethereumAddress ? '#8c1c84' : 'gray.700'
                        }
                      >
                        <HStack justify="space-between" align="start">
                          <Box flex={1}>
                            <HStack mb={3}>
                              <Text fontSize="lg" fontWeight="bold" color="white">
                                {account.displayName || account.username}
                              </Text>
                              {user?.ethereumAddress === account.ethereumAddress && (
                                <Badge colorScheme="purple">Current</Badge>
                              )}
                            </HStack>
                            <Text fontSize="sm" color="gray.400" mb={2}>
                              Username: {account.username}
                            </Text>
                            <Code
                              fontSize="xs"
                              bg="gray.800"
                              color="gray.300"
                              p={2}
                              borderRadius="md"
                            >
                              {account.ethereumAddress}
                            </Code>
                          </Box>
                          <IconButton
                            aria-label="Delete account"
                            icon={<DeleteIcon />}
                            colorScheme="red"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAccount(account)}
                          />
                        </HStack>
                      </Box>
                    ))
                  )}

                  <Alert status="warning" bg="yellow.900" opacity={0.9} borderRadius="lg">
                    <AlertIcon />
                    <Box fontSize="sm">
                      <Text fontWeight="bold" mb={1}>
                        Warning
                      </Text>
                      <Text fontSize="xs" color="gray.300">
                        Removing an account will delete all its data from this device. Make sure you
                        have a backup before removing an account. This action cannot be undone.
                      </Text>
                    </Box>
                  </Alert>
                </VStack>
              </TabPanel>

              {/* Backup Tab */}
              <TabPanel>
                <VStack spacing={8} align="stretch">
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
                  <Box
                    bg="gray.900"
                    p={6}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="gray.700"
                  >
                    <HStack mb={4}>
                      <Icon as={FiShield} color="#8c1c84" boxSize={6} />
                      <Heading size="md">Current Account</Heading>
                    </HStack>
                    <VStack align="stretch" spacing={3}>
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
                        <Icon as={LockIcon} color="blue.300" boxSize={3} />
                        <Text fontSize="xs" color="blue.300">
                          Your private key is encrypted client-side and never sent to the server
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Security Score */}
                  <Box
                    bg="gray.900"
                    p={6}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="gray.700"
                  >
                    <HStack mb={4}>
                      <Icon as={FiCheckCircle} color="#8c1c84" boxSize={6} />
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

                  {/* Actions */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Box
                      bg="gray.900"
                      p={6}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.700"
                      _hover={{ borderColor: '#8c1c84', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                    >
                      <Icon as={InfoIcon} color="#8c1c84" boxSize={6} mb={3} />
                      <Heading size="sm" mb={3}>
                        Check Backup Status
                      </Heading>
                      <Text fontSize="sm" color="gray.400" mb={4}>
                        Get your current security score and backup recommendations
                      </Text>
                      <Button
                        bg="#8c1c84"
                        color="white"
                        _hover={{ bg: '#6d1566' }}
                        onClick={handleGetBackupStatus}
                        isLoading={isCheckingStatus}
                        spinner={<Spinner size="16px" />}
                        loadingText="Checking..."
                        isDisabled={isCheckingStatus || isCreatingBackup}
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
                      _hover={{ borderColor: '#8c1c84', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                    >
                      <Icon as={DownloadIcon} color="#8c1c84" boxSize={6} mb={3} />
                      <Heading size="sm" mb={3}>
                        Create ZIP Backup
                      </Heading>
                      <Text fontSize="sm" color="gray.400" mb={4}>
                        Download an encrypted ZIP file protected by your password
                      </Text>
                      <Button
                        bg="#8c1c84"
                        color="white"
                        _hover={{ bg: '#6d1566' }}
                        onClick={handleCreateBackup}
                        isLoading={isCreatingBackup}
                        spinner={<Spinner size="16px" />}
                        loadingText="Creating..."
                        isDisabled={isCheckingStatus || isCreatingBackup}
                        width="full"
                      >
                        Create Backup
                      </Button>
                    </Box>
                  </SimpleGrid>

                  {/* Info Box */}
                  <Box
                    bg="gray.900"
                    p={6}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="gray.700"
                  >
                    <Heading size="sm" mb={4} color="#8c1c84">
                      About Client-Side Backup
                    </Heading>
                    <VStack align="stretch" spacing={3} fontSize="sm" color="gray.400">
                      <Text>
                        Your wallet&apos;s core secret (the mnemonic phrase) is generated and
                        encrypted entirely on your device. The backup process retrieves this
                        encrypted data from your browser&apos;s local storage using your password,
                        then packages it into a secure ZIP file for you to download.
                      </Text>
                      <Text>
                        The encryption key for your wallet is derived using a WebAuthn signature,
                        which requires your biometric authentication (fingerprint, face scan) or
                        device PIN. This means even if someone gains access to the encrypted data
                        stored in your browser, they cannot decrypt it without your physical device
                        and authentication.
                      </Text>
                      <Text>
                        Your backup ZIP file is encrypted using AES-256-GCM with a key derived from
                        the password you provide. Store this file securely and remember your
                        password.
                      </Text>
                      <Alert status="warning" bg="yellow.900" opacity={0.9} mt={2}>
                        <AlertIcon />
                        <Text fontSize="xs">
                          If you lose access to your device, passkey, AND the backup file/password,
                          your wallet cannot be recovered.
                        </Text>
                      </Alert>
                    </VStack>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Recovery Tab */}
              <TabPanel>
                <VStack spacing={8} align="stretch">
                  <Box>
                    <Heading size="lg" mb={4}>
                      Recovery Options
                    </Heading>
                    <Text color="gray.400" mb={6}>
                      Multiple ways to recover your wallet in case of device loss or failure
                    </Text>
                  </Box>

                  <Alert status="info" bg="rgba(139, 92, 246, 0.1)" borderRadius="lg">
                    <AlertIcon />
                    <Box fontSize="sm">
                      <Text fontWeight="bold" mb={1}>
                        Coming Soon
                      </Text>
                      <Text>
                        These recovery features are already available in the w3pk SDK and will be
                        implemented in this app soon. w3pk provides a three-layer recovery system
                        for maximum security and flexibility.
                      </Text>
                    </Box>
                  </Alert>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    {/* Layer 1: Passkey Sync */}
                    <Box
                      bg="gray.900"
                      p={6}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.700"
                      _hover={{ borderColor: '#8c1c84', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                    >
                      <Icon as={FiKey} color="#8c1c84" boxSize={8} mb={4} />
                      <Badge colorScheme="purple" mb={2}>
                        LAYER 1
                      </Badge>
                      <Heading size="md" mb={3}>
                        Passkey Auto-Sync
                      </Heading>
                      <Text fontSize="sm" color="gray.400" mb={4}>
                        WebAuthn credentials automatically sync via platform services (iCloud
                        Keychain, Google Password Manager)
                      </Text>
                      <List spacing={2} fontSize="sm">
                        <ListItem>
                          <ListIcon as={FiCheckCircle} color="green.400" />
                          Automatic (no user action needed)
                        </ListItem>
                        <ListItem>
                          <ListIcon as={FiCheckCircle} color="green.400" />
                          Instant recovery on new device
                        </ListItem>
                        <ListItem>
                          <ListIcon as={FiCheckCircle} color="green.400" />
                          Hardware-protected security
                        </ListItem>
                        <ListItem>
                          <ListIcon as={WarningIcon} color="yellow.400" />
                          Platform-specific (Apple/Google)
                        </ListItem>
                      </List>
                    </Box>

                    {/* Layer 2: Encrypted Backup */}
                    <Box
                      bg="gray.900"
                      p={6}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.700"
                      _hover={{ borderColor: '#8c1c84', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                    >
                      <Icon as={FiDownload} color="#8c1c84" boxSize={8} mb={4} />
                      <Badge colorScheme="purple" mb={2}>
                        LAYER 2
                      </Badge>
                      <Heading size="md" mb={3}>
                        Encrypted Backups
                      </Heading>
                      <Text fontSize="sm" color="gray.400" mb={4}>
                        Password-protected ZIP files or QR codes that you can store offline or in
                        the cloud
                      </Text>
                      <List spacing={2} fontSize="sm">
                        <ListItem>
                          <ListIcon as={FiCheckCircle} color="green.400" />
                          Works across any platform
                        </ListItem>
                        <ListItem>
                          <ListIcon as={FiCheckCircle} color="green.400" />
                          Military-grade encryption (AES-256-GCM)
                        </ListItem>
                        <ListItem>
                          <ListIcon as={FiCheckCircle} color="green.400" />
                          Multiple backup formats
                        </ListItem>
                        <ListItem>
                          <ListIcon as={WarningIcon} color="yellow.400" />
                          Must remember password
                        </ListItem>
                      </List>
                    </Box>

                    {/* Layer 3: Social Recovery */}
                    <Box
                      bg="gray.900"
                      p={6}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.700"
                      _hover={{ borderColor: '#8c1c84', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                    >
                      <Icon as={FiUsers} color="#8c1c84" boxSize={8} mb={4} />
                      <Badge colorScheme="purple" mb={2}>
                        LAYER 3
                      </Badge>
                      <Heading size="md" mb={3}>
                        Social Recovery
                      </Heading>
                      <Text fontSize="sm" color="gray.400" mb={4}>
                        Split your recovery phrase among trusted friends/family using Shamir Secret
                        Sharing (e.g., 3-of-5)
                      </Text>
                      <List spacing={2} fontSize="sm">
                        <ListItem>
                          <ListIcon as={FiCheckCircle} color="green.400" />
                          No single point of failure
                        </ListItem>
                        <ListItem>
                          <ListIcon as={FiCheckCircle} color="green.400" />
                          Information-theoretic security
                        </ListItem>
                        <ListItem>
                          <ListIcon as={FiCheckCircle} color="green.400" />
                          Survives forgotten passwords
                        </ListItem>
                        <ListItem>
                          <ListIcon as={WarningIcon} color="yellow.400" />
                          Requires trusted guardians
                        </ListItem>
                      </List>
                    </Box>

                    {/* Manual Mnemonic */}
                    <Box
                      bg="gray.900"
                      p={6}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.700"
                      _hover={{ borderColor: '#8c1c84', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                    >
                      <Icon as={FiShield} color="#8c1c84" boxSize={8} mb={4} />
                      <Badge colorScheme="green" mb={2}>
                        UNIVERSAL
                      </Badge>
                      <Heading size="md" mb={3}>
                        Manual Mnemonic
                      </Heading>
                      <Text fontSize="sm" color="gray.400" mb={4}>
                        Your 12-word recovery phrase - the ultimate backup that works with any
                        BIP39-compatible wallet
                      </Text>
                      <List spacing={2} fontSize="sm">
                        <ListItem>
                          <ListIcon as={FiCheckCircle} color="green.400" />
                          Compatible with MetaMask, Ledger, etc.
                        </ListItem>
                        <ListItem>
                          <ListIcon as={FiCheckCircle} color="green.400" />
                          Never changes
                        </ListItem>
                        <ListItem>
                          <ListIcon as={FiCheckCircle} color="green.400" />
                          Simple and universal
                        </ListItem>
                        <ListItem>
                          <ListIcon as={WarningIcon} color="yellow.400" />
                          Keep it absolutely secret
                        </ListItem>
                      </List>
                    </Box>
                  </SimpleGrid>

                  <Box
                    p={6}
                    borderColor="#45a2f8"
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
                      isExternal
                    >
                      <Button bg="white" color="#45a2f8" _hover={{ bg: 'gray.100' }} size="sm">
                        View Documentation
                      </Button>
                    </ChakraLink>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Sync Tab */}
              <TabPanel>
                <VStack spacing={8} align="stretch">
                  <Box>
                    <Heading size="lg" mb={4}>
                      Device Sync
                    </Heading>
                    <Text color="gray.400" mb={6}>
                      Your passkey automatically syncs across devices using platform services
                    </Text>
                  </Box>

                  <Alert status="info" bg="rgba(139, 92, 246, 0.1)" borderRadius="lg">
                    <AlertIcon />
                    <Box fontSize="sm">
                      <Text fontWeight="bold" mb={1}>
                        Coming Soon
                      </Text>
                      <Text>
                        Sync status and management features are already available in the w3pk SDK
                        and will be implemented in this app soon. Your passkey is already syncing
                        automatically via your platform provider (Apple iCloud, Google, or
                        Microsoft).
                      </Text>
                    </Box>
                  </Alert>

                  {/* Platform Sync Info */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Box
                      bg="gray.900"
                      p={6}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.700"
                    >
                      <Icon as={FiCloud} color="#8c1c84" boxSize={8} mb={4} />
                      <Heading size="md" mb={3}>
                        Apple iCloud
                      </Heading>
                      <Text fontSize="sm" color="gray.400" mb={4}>
                        For iOS and macOS devices with iCloud Keychain enabled
                      </Text>
                      <List spacing={2} fontSize="sm" color="gray.400">
                        <ListItem>
                          <ListIcon as={CheckCircleIcon} color="green.400" />
                          Syncs across iPhone, iPad, and Mac
                        </ListItem>
                        <ListItem>
                          <ListIcon as={CheckCircleIcon} color="green.400" />
                          End-to-end encrypted
                        </ListItem>
                        <ListItem>
                          <ListIcon as={CheckCircleIcon} color="green.400" />
                          Automatic backup to iCloud
                        </ListItem>
                        <ListItem>
                          <ListIcon as={WarningIcon} color="yellow.400" />
                          Requires iCloud Keychain enabled
                        </ListItem>
                      </List>
                    </Box>

                    <Box
                      bg="gray.900"
                      p={6}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.700"
                    >
                      <Icon as={FiCloud} color="#8c1c84" boxSize={8} mb={4} />
                      <Heading size="md" mb={3}>
                        Google Password Manager
                      </Heading>
                      <Text fontSize="sm" color="gray.400" mb={4}>
                        For Android devices and Chrome browser
                      </Text>
                      <List spacing={2} fontSize="sm" color="gray.400">
                        <ListItem>
                          <ListIcon as={CheckCircleIcon} color="green.400" />
                          Syncs across Android devices
                        </ListItem>
                        <ListItem>
                          <ListIcon as={CheckCircleIcon} color="green.400" />
                          End-to-end encrypted
                        </ListItem>
                        <ListItem>
                          <ListIcon as={CheckCircleIcon} color="green.400" />
                          Automatic backup to Google account
                        </ListItem>
                        <ListItem>
                          <ListIcon as={WarningIcon} color="yellow.400" />
                          Requires Google account sync
                        </ListItem>
                      </List>
                    </Box>

                    <Box
                      bg="gray.900"
                      p={6}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.700"
                    >
                      <Icon as={FiCloud} color="#8c1c84" boxSize={8} mb={4} />
                      <Heading size="md" mb={3}>
                        Windows Hello
                      </Heading>
                      <Text fontSize="sm" color="gray.400" mb={4}>
                        For Windows devices with Windows Hello
                      </Text>
                      <List spacing={2} fontSize="sm" color="gray.400">
                        <ListItem>
                          <ListIcon as={CheckCircleIcon} color="green.400" />
                          Hardware-protected (TPM)
                        </ListItem>
                        <ListItem>
                          <ListIcon as={WarningIcon} color="yellow.400" />
                          Tied to specific device
                        </ListItem>
                        <ListItem>
                          <ListIcon as={WarningIcon} color="yellow.400" />
                          Does NOT sync by default
                        </ListItem>
                        <ListItem>
                          <ListIcon as={InfoIcon} color="blue.400" />
                          Use encrypted backup for new devices
                        </ListItem>
                      </List>
                    </Box>

                    <Box
                      bg="gray.900"
                      p={6}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.700"
                    >
                      <Icon as={FiKey} color="#8c1c84" boxSize={8} mb={4} />
                      <Heading size="md" mb={3}>
                        Hardware Keys
                      </Heading>
                      <Text fontSize="sm" color="gray.400" mb={4}>
                        Physical security keys like YubiKey
                      </Text>
                      <List spacing={2} fontSize="sm" color="gray.400">
                        <ListItem>
                          <ListIcon as={CheckCircleIcon} color="green.400" />
                          Maximum security
                        </ListItem>
                        <ListItem>
                          <ListIcon as={CheckCircleIcon} color="green.400" />
                          Physical device required
                        </ListItem>
                        <ListItem>
                          <ListIcon as={WarningIcon} color="yellow.400" />
                          No automatic sync
                        </ListItem>
                        <ListItem>
                          <ListIcon as={InfoIcon} color="blue.400" />
                          Keep encrypted backup separately
                        </ListItem>
                      </List>
                    </Box>
                  </SimpleGrid>

                  {/* Important Notes */}
                  <Box
                    bg="gray.900"
                    p={6}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="gray.700"
                  >
                    <Heading size="sm" mb={4} color="#8c1c84">
                      Important Notes
                    </Heading>
                    <VStack align="stretch" spacing={3} fontSize="sm" color="gray.400">
                      <Text>
                        <strong>Cross-platform limitation:</strong> Passkey sync does not work
                        across different ecosystems. For example, credentials created on an iPhone
                        cannot automatically sync to an Android device.
                      </Text>
                      <Text>
                        <strong>Recommendation:</strong> Always create an encrypted backup (Layer 2)
                        to ensure you can access your wallet on any device, regardless of platform.
                      </Text>
                      <Text>
                        <strong>Platform trust:</strong> Your passkey security depends on your
                        platform provider&apos;s security. All major providers (Apple, Google,
                        Microsoft) use industry-standard encryption and security practices.
                      </Text>
                    </VStack>
                  </Box>

                  <Box
                    p={6}
                    borderColor="#45a2f8"
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
                      isExternal
                    >
                      <Button bg="white" color="#45a2f8" _hover={{ bg: 'gray.100' }} size="sm">
                        View Security Docs
                      </Button>
                    </ChakraLink>
                  </Box>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>

        <PasswordModal
          isOpen={showPasswordModal}
          onClose={handleModalClose}
          onSubmit={handlePasswordSubmit}
          title={`Enter Password to Create Backup`}
          description={`Please enter your password to create the backup. This is required by the w3pk SDK to access your encrypted wallet data.`}
        />

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay bg="blackAlpha.600" />
          <ModalContent bg="gray.800" color="white">
            <ModalHeader>Remove Account</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
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
                      This is your currently logged-in account. You will be logged out after
                      removal.
                    </Text>
                  </Box>
                )}
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDeleteAccount}>
                Remove Account
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* LocalStorage Inspection Modal */}
        <Modal
          isOpen={showLocalStorageModal}
          onClose={() => setShowLocalStorageModal(false)}
          size="xl"
          scrollBehavior="inside"
        >
          <ModalOverlay bg="blackAlpha.600" />
          <ModalContent bg="gray.800" color="white" maxH="80vh">
            <ModalHeader>
              <HStack>
                <Icon as={FiHardDrive} color="#8c1c84" />
                <Text>LocalStorage Inspection</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={4}>
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
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                          <Text fontSize="sm" fontWeight="bold" color="white">
                            {item.key}
                          </Text>
                          <HStack spacing={2}>
                            {item.encrypted && (
                              <Badge colorScheme="orange" fontSize="xs">
                                Encrypted
                              </Badge>
                            )}
                            <Badge
                              colorScheme={item.type.startsWith('w3pk') ? 'purple' : 'gray'}
                              fontSize="xs"
                            >
                              {item.type}
                            </Badge>
                          </HStack>
                        </HStack>

                        {item.parsedValue && (
                          <Box
                            bg="gray.950"
                            p={3}
                            borderRadius="md"
                            fontSize="xs"
                            fontFamily="monospace"
                            overflowX="auto"
                          >
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                              {formatValue(maskSensitiveData(item.key, item.parsedValue))}
                            </pre>
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
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setShowLocalStorageModal(false)}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* IndexedDB Inspection Modal */}
        <Modal
          isOpen={showIndexedDBModal}
          onClose={() => setShowIndexedDBModal(false)}
          size="xl"
          scrollBehavior="inside"
        >
          <ModalOverlay bg="blackAlpha.600" />
          <ModalContent bg="gray.800" color="white" maxH="80vh">
            <ModalHeader>
              <HStack>
                <Icon as={FiDatabase} color="#8c1c84" />
                <Text>IndexedDB Inspection</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={4}>
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
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <Text fontSize="md" fontWeight="bold" color="white">
                            {db.name}
                          </Text>
                          <Badge colorScheme="purple" fontSize="xs">
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
                          <VStack align="stretch" spacing={2} mt={2}>
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
                                <Box fontSize="xs" fontFamily="monospace" overflowX="auto">
                                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {formatValue(maskSensitiveData(record.key, record.value))}
                                  </pre>
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
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setShowIndexedDBModal(false)}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </>
  )
}

export default SettingsPage
