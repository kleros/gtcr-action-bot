import { ethers } from 'ethers'

import _GTCRFactory from '@kleros/tcr/build/contracts/GTCRFactory.json'
import _GeneralizedTCR from '@kleros/tcr/build/contracts/GeneralizedTCR.json'

import addTCRListeners from './handlers'
import getSweepIntervals from './utils/get-intervals'
import dotenv from "dotenv"

dotenv.config({ path: ".env" })

// Run env variable checks.
import './utils/env-check'

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL)
provider.pollingInterval = 60 * 1000 // Poll every minute.

const gtcrFactory = new ethers.Contract(
  process.env.FACTORY_ADDRESS as string,
  _GTCRFactory.abi,
  provider
)

const deploymentBlock = Number(process.env.FACTORY_BLOCK_NUM) || 0

  // Run bot.
  ; (async () => {
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

    // Fetch logs by scanning the blockchain in batches of 4 months
    // to avoid rate-limiting.
    const blocksPerMinute = Math.floor(
      60 / (Number(process.env.BLOCK_TIME_MILLISECONDS as string) / 1000)
    )
    const blocksPerRequest = blocksPerMinute * 60 * 24 * 30 * 4

    // Fetch the addresses of TCRs deployed with this factory and
    // instantiate tcrs.
    // We fetch events in batches to avoid timeouts by the provider.
    const intervals = await getSweepIntervals(
      deploymentBlock,
      currBlock,
      blocksPerRequest
    )
    const tcrs = (await Promise.all(
      intervals.map(async interval => provider.getLogs({
        ...gtcrFactory.filters.NewGTCR(),
        fromBlock: interval.fromBlock,
        toBlock: interval.toBlock,
      }))
    ))
      .reduce((acc, curr) => [...acc, ...curr])
      .map(rawEvent => gtcrFactory.interface.parseLog(rawEvent))
      .map(({ values: { _address } }) => new ethers.Contract(_address, _GeneralizedTCR.abi, provider))

    // Add listeners for events emitted by the TCRs and
    // do the same for new TCRs created while the bot is running.
    await Promise.all(tcrs.map(tcr => addTCRListeners(tcr)))
    gtcrFactory.on(gtcrFactory.filters.NewGTCR(), _address =>
      addTCRListeners(
        new ethers.Contract(_address, _GeneralizedTCR.abi, provider),
      )
    )

    console.info('')
    console.info('Done setting up listeners.')
    console.info('Scanning contracts contacts for pending requests and withdrawals...')

    // Scan contracts requests all to execute pending requests
    // and withdraw funds.
    tcrs.forEach(async tcr => {

      // To get all pending and resolved requests efficiently, we use
      // the GeneralizedTCR.RequestSubmitted and
      // GeneralizedTCR.ItemStatusChange events.
      // The ItemStatusChange event is emitted when a request is resolved
      // and contain the status of the request, so we can use it
      // to separate requests into resolved and not resolved.
      const [requestSubmittedEvents, itemStatusChangeEvents] = await Promise.all(
        [
          (await Promise.all(
            intervals.map(async interval => provider.getLogs({
              ...tcr.filters.RequestSubmitted(),
              fromBlock: interval.fromBlock,
              toBlock: interval.toBlock,
            }))
          ))
          .reduce((acc, curr) => [...acc, ...curr])
          .map(rawEvent => tcr.interface.parseLog(rawEvent)),

          (await Promise.all(
            intervals.map(async interval => provider.getLogs({
              ...tcr.filters.ItemStatusChange(),
              fromBlock: interval.fromBlock,
              toBlock: interval.toBlock,
            }))
          ))
          .reduce((acc, curr) => [...acc, ...curr])
          .map(rawEvent => tcr.interface.parseLog(rawEvent))
        ]
      )

      // Pending requests never had a ItemStatusChange event
      // emitted with the _resolved field set to true.
      const pendingRequests = requestSubmittedEvents
        .filter(
          ({ values: { _itemID, _requestID}}) =>
            !itemStatusChangeEvents.find(
              ({ values }) => values._itemID === _itemID
                && values._requestID === _requestID
                && values._resolved
            )
        )

      // We use the pending requests calculated previously
      // to learn which requests are resolved.
      const resolvedRequests = requestSubmittedEvents
        .filter(e => !pendingRequests.includes(e))



    })

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
