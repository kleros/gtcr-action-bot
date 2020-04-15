import withdrawRewards from "../utils/withdraw-rewards"
import { BigNumber } from "ethers/utils"
import { ethers } from "ethers"

/**
 * Builds a handler for request resolved events (or rather, ItemStatusChange events with resolved value set to true.)
 */
export default (
  tcr: ethers.Contract,
  batchWithdraw: ethers.Contract,
  intervals: BlockInterval[],
  provider: ethers.providers.Provider
) => async (
  _itemID: string,
  _requestIndex: BigNumber,
  _roundIndex: BigNumber,
  _disputed: boolean,
  _resolved: boolean
) => {
    if (!_resolved) return
    await withdrawRewards(
      _itemID,
      _requestIndex,
      tcr,
      batchWithdraw,
      intervals,
      provider
    )

    // TODO: Remove item from watch list.
  }