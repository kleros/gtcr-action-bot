import { ethers } from 'ethers'

import _GTCRFactory from '@kleros/tcr/build/contracts/GTCRFactory.json'
import _GeneralizedTCR from '@kleros/tcr/build/contracts/GeneralizedTCR.json'
import _BatchWidthdraw from '@kleros/tcr/build/contracts/BatchWithdraw.json'

import addTCRListeners from './handlers'
import getSweepIntervals from './utils/get-intervals'
import dotenv from "dotenv"

dotenv.config({ path: ".env" })

// Run env variable checks.
import './utils/env-check'
import { bigNumberify } from 'ethers/utils'
import withdrawRewards from './utils/withdraw-rewards'

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL)
provider.pollingInterval = 60 * 1000 // Poll every minute.
const signer = new ethers.Wallet(process.env.WALLET_KEY, provider)

const gtcrFactory = new ethers.Contract(
  process.env.FACTORY_ADDRESS as string,
  _GTCRFactory.abi,
  signer
)
const batchWithdraw = new ethers.Contract(
  process.env.BATCH_WITHDRAW_ADDRESS as string,
  _BatchWidthdraw.abi,
  signer
)

const deploymentBlock = Number(process.env.FACTORY_BLOCK_NUM) || 0

  // Run bot.
  ; (async () => {
    // Initial setup.
    console.info('Booting...')
    console.info()
    const [latestBlock, network] = await Promise.all([
      provider.getBlock('latest'),
      provider.getNetwork()
    ])

    const { timestamp, number: currBlock } = latestBlock
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
      .map(({ values: { _address } }) => new ethers.Contract(_address, _GeneralizedTCR.abi, signer))

    // Add listeners for events emitted by the TCRs and
    // do the same for new TCRs created while the bot is running.
    await Promise.all(tcrs.map(tcr => addTCRListeners(
      tcr,
      batchWithdraw,
      intervals,
      provider
    )))

    gtcrFactory.on(gtcrFactory.filters.NewGTCR(), _address =>
      addTCRListeners(
        new ethers.Contract(_address, _GeneralizedTCR.abi, signer),
        batchWithdraw,
        intervals,
        provider
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
      const [
        requestSubmittedEvents,
        itemStatusChangeEvents,
        challengePeriodDuration
      ] = await Promise.all(
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
          .map(rawEvent => tcr.interface.parseLog(rawEvent)),

          tcr.challengePeriodDuration()
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

      pendingRequests.forEach(async ({ values: { _itemID, _requestID }}) => {
        const { submissionTime, disputed } = await tcr.getRequestInfo(_itemID, _requestID)
        if (disputed) return // There is an ongoing dispute. No-op.

        if (bigNumberify(timestamp).sub(submissionTime).gt(challengePeriodDuration)) {
          // Challenge period passed with no challenges, execute it.
          tcr.executeRequest(_itemID)
        } else {
          // TODO: The challenge period did not pass yet. Add it to the watchlist.
        }
      })

      // We use the pending requests calculated previously
      // to learn which requests are resolved and may have.
      // withdrawable rewards.
      const resolvedRequests = requestSubmittedEvents
        .filter(e => !pendingRequests.includes(e))

      resolvedRequests.forEach(({ values: {_itemID, _requestID }}) => withdrawRewards(
        _itemID,
        _requestID,
        tcr,
        batchWithdraw,
        intervals,
        provider
      ))
    })

    // TODO: Fetch requests in the watchlist every X minutes.
    // - Verify if they passed the challenge period.
    // - Execute the request. The request-resolved event listener will
    // remove it from the watchlist and withdraw the any pending
    // crowdfunding rewards.
  })()
