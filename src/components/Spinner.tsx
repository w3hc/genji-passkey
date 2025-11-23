import { Box } from '@chakra-ui/react'
import Image from 'next/image'

interface SpinnerProps {
  size?: string | number
}

export default function Spinner({ size = '20px' }: SpinnerProps) {
  const sizeNum = typeof size === 'string' ? parseInt(size) : size

  return (
    <Box role="status" aria-live="polite" display="inline-block">
      <Image
        src="/loader.svg"
        alt=""
        aria-hidden="true"
        width={sizeNum}
        height={sizeNum}
        style={{ display: 'block' }}
      />
      <span className="sr-only">Loading, please wait...</span>
    </Box>
  )
}
