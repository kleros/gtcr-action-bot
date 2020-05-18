import { ethers } from 'ethers'
import { bigNumberify, formatEther } from 'ethers/utils'
import dotenv from "dotenv"
import level from 'level'
import 'colors'

import _GTCRFactory from '@kleros/tcr/build/contracts/GTCRFactory.json'
import _GeneralizedTCR from '@kleros/tcr/build/contracts/GeneralizedTCR.json'
import _BatchWidthdraw from '@kleros/tcr/build/contracts/BatchWithdraw.json'

import addTCRListeners from './handlers'
import getSweepIntervals from './utils/get-intervals'
import withdrawRewardsRemoveWatchlist from './utils/withdraw-rewards'
import Store from './utils/store'
import { version } from '../package.json'

dotenv.config({ path: ".env" })

// Run env variable checks.
import './utils/env-check'
import { DB_KEY } from './utils/db'

const store = new Store(level('./db'), DB_KEY)
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
  ; (async function main() {
    // Initial setup.
    console.info('--- GTCR ACTION BOT ---'.green)
    console.info(`Version ${version}`.green)
    console.info('Booting...'.green)
    console.info()
    const [blockHeight, network, balance, txCount] = await Promise.all([
      provider.getBlockNumber(),
      provider.getNetwork(),
      signer.getBalance(),
      signer.getTransactionCount()
    ])

    const { timestamp, number: currBlock } = await provider.getBlock(blockHeight)
    console.info(`Connected to ${network.name} of chain of ID ${network.chainId}`.magenta)
    console.info(`GTCR Factory deployed at ${process.env.FACTORY_ADDRESS}`.magenta)
    console.info(`Bot wallet: ${signer.address}`.magenta)
    console.info(`Balance   : ${formatEther(balance)} Ξ`.magenta)
    console.info()

    // Fetch all TCR addresses from factory logs, instantiate and add
    // event listeners.

    // Fetch logs by scanning the blockchain in batches of 4 months
    // to avoid rate-limiting.
    const blocksPerMinute = Math.floor(
      60 / (Number(process.env.BLOCK_TIME_SECONDS as string))
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
      provider,
      store,
      signer
    )))

    gtcrFactory.on(gtcrFactory.filters.NewGTCR(), _address =>
      addTCRListeners(
        new ethers.Contract(_address, _GeneralizedTCR.abi, signer),
        batchWithdraw,
        intervals,
        provider,
        store,
        signer
      )
    )

    console.info('Done setting up listeners.')


    // Scan contracts requests all to execute pending requests
    // and withdraw funds.
    console.info()
    console.info(`Detected ${tcrs.length} TCRs`)
    console.info('Scanning them for pending requests and withdrawals...')
    let tcrCount = 1
    let nonce = txCount
    for (let tcr of tcrs) {
      console.info(`Scanning ${tcrCount} of ${tcrs.length} (${tcr.address})`)

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
              ...interval
            }))
          ))
          .reduce((acc, curr) => [...acc, ...curr])
          .map(rawEvent => tcr.interface.parseLog(rawEvent)),

          (await Promise.all(
            intervals.map(async interval => provider.getLogs({
              ...tcr.filters.ItemStatusChange(),
              ...interval
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
          ({ values: { _itemID, _requestIndex }}) =>
            !itemStatusChangeEvents.find(
              ({ values }) => values._itemID === _itemID
                && values._requestIndex.eq(_requestIndex)
                && values._resolved
            )
        )

      if (pendingRequests.length > 0) {
        console.info(` Found ${pendingRequests.length} pending requests.`)
        console.info(` Checking them for executable requests.`)
      }
      let pendingRequestCount = 1
      for (let pendingRequest of pendingRequests) {
        console.info(` Checking ${pendingRequestCount} of ${pendingRequests.length}`)
        const { values: { _itemID, _requestIndex }} = pendingRequest
        const { submissionTime, disputed } = await tcr.getRequestInfo(_itemID, _requestIndex)
        if (disputed) continue // There is an ongoing dispute. No-op.

        if (bigNumberify(timestamp).sub(submissionTime).gt(challengePeriodDuration)) {
          // Challenge period passed with no challenges, execute it.
          console.info(`  Found executable request for item of ID ${_itemID} of TCR at ${tcr.address}` )
          console.info('  Executing it.'.cyan)
          await tcr.executeRequest(_itemID, {
            nonce
          })
          nonce++
        } else {
          await store.addToWatchlist(
            tcr.address,
            _itemID,
            submissionTime.add(challengePeriodDuration).toNumber()
          )
          console.info(`  Found item ${_itemID} of TCR at ${tcr.address} in the challenge period.` )
          console.info('  Added it to the watchlist.'.cyan)
        }
        pendingRequestCount++
      }

      // We use the pending requests calculated previously
      // to learn which requests are resolved and may have.
      // withdrawable rewards.
      const resolvedRequests = requestSubmittedEvents
        .filter(e => !pendingRequests.includes(e))

      if (resolvedRequests.length > 0) {
        console.info(` Found ${resolvedRequests.length} resolved requests. Checking them for withdrawable rewards.`)
      }
      let resolvedRequestCount = 1
      for (let resolvedRequest of resolvedRequests) {
        console.info(` Checking ${resolvedRequestCount} of ${resolvedRequests.length}`)
        const { values: {_itemID, _requestIndex }} = resolvedRequest
        await withdrawRewardsRemoveWatchlist(
          _itemID,
          _requestIndex,
          tcr,
          batchWithdraw,
          intervals,
          provider,
          store,
          signer
        )
        resolvedRequestCount++
      }

      tcrCount++
    }

    console.info()
    console.info('Done scanning and executing pending requests and withdrawals.'.green)
    console.info('Listening for new requests...'.cyan)

    // Check watchlist every POLL_PERIOD_MINUTES to see
    // if any submissions entered the request exectution period
    // (aka finished the challenge period.)
    setInterval(async function watcher() {
      const [dbState, blockHeight] = await Promise.all([
        store.getDB(),
        provider.getBlockNumber()
      ])

      // Take previous block to avoid returning null due to outdated
      // blockchain data.
      let block
      while (!block) { // Sometimes getBlock returns null for some reason. Try again.
        block = await provider.getBlock(blockHeight-1)
      }
      const { timestamp } = block

      for (let tcrAddress of Object.keys(dbState)) {
        const tcrWatchList = dbState[tcrAddress]
        for (let itemID of Object.keys(tcrWatchList)) {
          const challengePeriodEnd = dbState[tcrAddress][itemID]
          if (timestamp < Number(challengePeriodEnd)) return

          console.info()
          console.info(`Found executable request for item of ID ${itemID} of TCR at ${tcrAddress}` )
          console.info('Executing it.'.cyan)
          try {
            await new ethers.Contract(tcrAddress, _GeneralizedTCR.abi, signer).executeRequest(itemID)
          } catch (err) {
            console.warn(`Failed to request for item of ID ${itemID} of TCR at ${tcrAddress}` )
            console.warn('Reason:', err)
          }
        }
      }
    }, Number(process.env.POLL_PERIOD_MINUTES) * 60 * 1000)
  })()
