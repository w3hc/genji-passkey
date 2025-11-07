import nextConfig from 'eslint-config-next'

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'server.js'],
  },
  ...nextConfig,
]

export default eslintConfig
