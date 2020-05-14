import { ethers } from "ethers"
import { BigNumber } from "ethers/utils"
import { DB_KEY } from "../utils/db"
import Store from "../utils/store"

/**
 * Builds a handler for request submitted events.
 */
export default (store: Store, tcr: ethers.Contract) => async (
  itemID: string,
  requestIndex: BigNumber
) => {
  const challengePeriodDuration = await tcr.challengePeriodDuration()
  const { submissionTime } = await tcr.getRequestInfo(itemID, requestIndex)

  // Save the end the challenge period on local storage.
  await store.addToWatchlist(
    tcr.address,
    itemID,
    submissionTime.add(challengePeriodDuration).toNumber()
  )

  console.info('')
  console.info(`New request! Added item ${itemID} of TCR at ${tcr.address} to watchlist`.cyan)
}
