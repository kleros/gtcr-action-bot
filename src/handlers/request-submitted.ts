import { ethers } from "ethers"
import { BigNumber } from "ethers/utils"

export default (db: Level, tcr: ethers.Contract) => async (
  _itemID: string,
  _requestIndex: BigNumber,
  _requestType: number
) => {
  const challengePeriodDuration = await tcr.challengePeriodDuration()
  const { submissionTime } = await tcr.getRequestInfo(_itemID, _requestIndex)

  await db.put(tcr.address, {
    ...(await db.get(tcr.address)),
    [_itemID]: submissionTime.add(challengePeriodDuration).toString()
  })
}
