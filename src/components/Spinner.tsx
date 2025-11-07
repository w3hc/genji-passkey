import { Box } from '@chakra-ui/react'

interface SpinnerProps {
  size?: string | number
}

export default function Spinner({ size = '20px' }: SpinnerProps) {
  return (
    <Box
      as="img"
      src="/loader.svg"
      alt="Loading..."
      width={size}
      height={size}
      // display="inline-block"
    />
  )
}
