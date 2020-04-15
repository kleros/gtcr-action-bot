// Web3
if (!process.env.PROVIDER_URL) {
  throw new Error(
    'No web3 provider set. Please set the PROVIDER_URL environment variable'
  )
}

if (!process.env.FACTORY_ADDRESS) {
  throw new Error(
    'No factory address set. Please set the FACTORY_ADDRESS environment variable'
  )
}

if (!process.env.BLOCK_TIME_SECONDS) {
  throw new Error(
    'Network block time not set. Please set the BLOCK_TIME_SECONDS environment variable'
  )
}

if (!process.env.FACTORY_BLOCK_NUM) {
  throw new Error(
    'Factory deployment block not set. Please set the FACTORY_BLOCK_NUM environment variable'
  )
}

if (!process.env.WALLET_KEY) {
  throw new Error(
    'Private key not set. Please set the WALLET_KEY environment variable so the bot can send transactions'
  )
}

if (!process.env.BATCH_WITHDRAW_ADDRESS) {
  throw new Error(
    'Batch withdraw contract address not set. Please set the BATCH_WITHDRAW_ADDRESS environment variable so the bot can withdraw rewards in batches.'
  )
}

if (!process.env.POLL_PERIOD_MINUTES) {
  throw new Error(
    'Poll period duration not set. Please set the POLL_PERIOD_MINUTES environment variable.'
  )
}

if (Number(process.env.POLL_PERIOD_MINUTES) < Number(process.env.BLOCK_TIME_SECONDS) * 2) {
  throw new Error(
    'The poll period must be longer than twice the block time to avoid sending transactions based on outdated data.'
  )
}