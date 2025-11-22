import { Box } from '@chakra-ui/react'

interface SpinnerProps {
  size?: string | number
}

export default function Spinner({ size = '20px' }: SpinnerProps) {
  return (
    <Box role="status" aria-live="polite" display="inline-block">
      <Box
        as="img"
        src="/loader.svg"
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
      />
      <span className="sr-only">Loading, please wait...</span>
    </Box>
  )
}
