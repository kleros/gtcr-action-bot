import { BigNumber, ethers } from "ethers"
import withdrawRewardsRemoveWatchlist from "../utils/withdraw-rewards"
import Store from "../utils/store"

/**
 * Builds a handler for request resolved events (or rather, ItemStatusChange events with resolved value set to true.)
 */
export default (
  tcr: ethers.Contract,
  batchWithdraw: ethers.Contract,
  intervals: BlockInterval[],
  provider: ethers.providers.Provider,
  store: Store,
  signer: ethers.Wallet
) => async (
  itemID: string,
  requestIndex: BigNumber,
  _roundIndex: BigNumber,
  disputed: boolean,
  _resolved: boolean
) => {
    if (!_resolved) return

    console.info('')
    console.info(`Request executed for item ${itemID} of TCR at ${tcr.address}`)
    if (disputed) {
      await withdrawRewardsRemoveWatchlist(
        itemID,
        requestIndex,
        tcr,
        batchWithdraw,
        intervals,
        provider,
        store,
        signer
      )
    }
  }