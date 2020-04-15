// Web3
if (!process.env.PROVIDER_URL) {
  console.error(
    'No web3 provider set. Please set the PROVIDER_URL environment variable'
  )
  process.exit(1)
}

if (!process.env.FACTORY_ADDRESS) {
  console.error(
    'No factory address set. Please set the FACTORY_ADDRESS environment variable'
  )
  process.exit(1)
}

if (!process.env.BLOCK_TIME_MILLISECONDS) {
  console.error(
    'Network block time not set. Please set the BLOCK_TIME_MILLISECONDS environment variable'
  )
  process.exit(1)
}

if (!process.env.FACTORY_BLOCK_NUM) {
  console.error(
    'Factory deployment block not set. Please set the FACTORY_BLOCK_NUM environment variable'
  )
  process.exit(1)
}
