import { ethers } from 'ethers'

import _GTCRFactory from '@kleros/tcr/build/contracts/GTCRFactory.json'
import _GeneralizedTCR from '@kleros/tcr/build/contracts/GeneralizedTCR.json'

import dotenv from "dotenv"

dotenv.config({ path: ".env" })
// Run env variable checks.
import './utils/env-check'
import addTCRListeners from './handlers'

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL)
provider.pollingInterval = 60 * 1000 // Poll every minute.

const gtcrFactory = new ethers.Contract(
  process.env.FACTORY_ADDRESS as string,
  _GTCRFactory.abi,
  provider
)

// Run bot.
;(async () => {
  // Initial setup.
  console.info('Booting...')
  console.info()
  const [currBlock, network] = await Promise.all([
    provider.getBlockNumber(),
    provider.getNetwork()
  ])

  console.info(`Connected to ${network.name} of chain of ID ${network.chainId}`)
  console.info(`GTCR Factory deployed at ${process.env.FACTORY_ADDRESS}`)

  // Fetch all TCR addresses from factory logs, instantiate and add
  // event listeners.
  const deploymentBlock = Number(process.env.FACTORY_BLOCK_NUM) || 0

  // Fetch logs by scanning the blockchain in batches of 4 months
  // to avoid rate-limiting.
  const blocksPerMinute = Math.floor(
    60 / (Number(process.env.BLOCK_TIME_MILLISECONDS as string) / 1000)
  )
  const blocksPerRequest = blocksPerMinute * 60 * 24 * 30 * 4

  // Fetch the addresses of TCRs deployed with this factory.
  const logPromises = []
  for (let fromBlock = deploymentBlock; ; ) {
    logPromises.push(
      provider.getLogs({
        ...gtcrFactory.filters.NewGTCR(),
        fromBlock: fromBlock,
        toBlock: fromBlock + blocksPerRequest
      })
    )

    if (fromBlock + blocksPerRequest >= currBlock) break
    fromBlock += blocksPerRequest
  }

  // Concat results and instantiate TCRs.
  const tcrs = (await Promise.all(logPromises))
    .reduce((acc, curr) => acc.concat(curr), [])
    .map(log => gtcrFactory.interface.parseLog(log).values._address)
    .map(address => new ethers.Contract(address, _GeneralizedTCR.abi, provider))

  // Add listeners for events emitted by the TCRs.
  await Promise.all(
    tcrs.map(tcr =>
      addTCRListeners(
        tcr
      )
    )
  )

  // Watch for new TCRs and add listeners.
  gtcrFactory.on(gtcrFactory.filters.NewGTCR(), _address =>
    addTCRListeners(
      new ethers.Contract(_address, _GeneralizedTCR.abi, provider),
    )
  )

  console.info('')
  console.info('Done setting up listeners.')

  // TODO: Scan contracts requests.
  // - Withdraw crowdfunding rewards if request was executed already.
  // - Execute pending requests. The request-resolved event listener will
  // remove it from the watchlist and withdraw the any pending
  // crowdfunding rewards.
  // - Add requests in the challenge period to watchlist.

  // TODO: Fetch requests in the watchlist every X minutes.
  // - Verify if they passed the challenge period.
  // - Execute the request. The request-resolved event listener will
  // remove it from the watchlist and withdraw the any pending
  // crowdfunding rewards.
})()
