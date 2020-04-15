import { ethers } from "ethers"
import { BigNumber } from "ethers/utils"
import { DB_KEY } from "../utils/db"

/**
 * Builds a handler for request submitted events.
 */
export default (db: Level, tcr: ethers.Contract) => async (
  _itemID: string,
  _requestIndex: BigNumber,
  _requestType: number
) => {
  const challengePeriodDuration = await tcr.challengePeriodDuration()
  const { submissionTime } = await tcr.getRequestInfo(_itemID, _requestIndex)

  // Save the end the challenge period on local storage.
  const dbState = await db.get(DB_KEY)
  dbState[tcr.address] = {
    ...dbState[tcr.address],
    [_itemID]: submissionTime.add(challengePeriodDuration).toString()
  }

  await db.put(DB_KEY, dbState)
}
