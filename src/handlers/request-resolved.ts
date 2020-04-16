import { BigNumber } from "ethers/utils"
import { ethers } from "ethers"
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
  store: Store
) => async (
  _itemID: string,
  _requestIndex: BigNumber,
  _roundIndex: BigNumber,
  _disputed: boolean,
  _resolved: boolean
) => {
    if (!_resolved) return

    console.info('')
    console.info(`Request executed for item ${_itemID} of TCR at ${tcr.address}`)
    if (_disputed) {
      await withdrawRewardsRemoveWatchlist(
        _itemID,
        _requestIndex,
        tcr,
        batchWithdraw,
        intervals,
        provider,
        store
      )
    }
  }