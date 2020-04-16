import { ethers } from "ethers"
import { BigNumber } from "ethers/utils"
import { DB_KEY } from "./db"

export default async function withdrawRewardsRemoveWatchlist(
  itemID: string,
  requestID: BigNumber,
  tcr: ethers.Contract,
  batchWithdraw: ethers.Contract,
  blockIntervals: BlockInterval[],
  provider: ethers.providers.Provider,
  db: Level
) {
  const { disputed } = await tcr.getRequestInfo(itemID, requestID)
  if (!disputed) return // No rewards to withdraw if there was never a dispute.

  const contributionEvents = (await Promise.all(
    blockIntervals.map(async interval => provider.getLogs({
      ...tcr.filters.AppealContribution(itemID, null, requestID),
    }))
  ))
    .reduce((acc, curr) => [...acc, ...curr])
    .map(rawEvent => tcr.interface.parseLog(rawEvent))
    .filter(({ values: { _round } }) => _round.toNumber() !== 0) // Ignore first round

  // A new AppealContribution event is emmited every time
  // someone makes a contribution.
  // Since batchRoundWithdraw() withdraws all contributions from
  // every round by a contributor, we avoid withdrawing
  // for the same contributor more than once by using a set.
  const done = new Set()
  for (let contributionEvent of contributionEvents) {
    const { values: { _contributor, itemID, _request } } = contributionEvent
    if (done.has(_contributor)) return

    console.info(` Withdrawing ${_contributor} rewards for item ${itemID} of TCR at ${tcr.address}`.cyan)
    await batchWithdraw.batchRoundWithdraw(
      tcr.address,
      _contributor,
      itemID,
      _request,
      0,
      0
    )

    done.add(_contributor)
  }


  const dbState = await db.get(DB_KEY)
  delete dbState[tcr.address][itemID]
  await db.put(DB_KEY, dbState)

  console.info(` Removed item ${itemID} of TCR at ${tcr.address} from watchlist.`.cyan)
}