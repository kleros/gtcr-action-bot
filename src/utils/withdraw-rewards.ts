import { ethers } from "ethers"
import { BigNumber, bigNumberify } from "ethers/utils"
import Store from "./store"
import { PARTY } from "../types/enums"

export default async function withdrawRewardsRemoveWatchlist(
  itemID: string,
  requestID: BigNumber,
  tcr: ethers.Contract,
  batchWithdraw: ethers.Contract,
  blockIntervals: BlockInterval[],
  provider: ethers.providers.Provider,
  store: Store,
  signer: ethers.Wallet
) {
  const { disputed } = await tcr.getRequestInfo(itemID, requestID)
  if (!disputed) return // No rewards to withdraw if there was never a dispute.

  const contributionEvents = (await Promise.all(
    blockIntervals.map(async interval => provider.getLogs({
      ...tcr.filters.AppealContribution(itemID, null, requestID),
      ...interval
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
  let nonce = (await signer.getTransactionCount())
  let withdrewRewards
  for (let contributionEvent of contributionEvents) {
    const { values: { _contributor, _request, _round, _itemID } } = contributionEvent
    if (done.has(_contributor)) return

    const contributions = await tcr.getContributions(_itemID, _request, _round, _contributor)
    if (contributions[PARTY.REQUESTER].eq(bigNumberify(0)) && contributions[PARTY.CHALLENGER].eq(bigNumberify(0))) continue

    console.info(` Withdrawing ${_contributor} rewards for item ${itemID} of TCR at ${tcr.address}`.cyan)
    await batchWithdraw.batchRoundWithdraw(
      tcr.address,
      _contributor,
      itemID,
      _request,
      0,
      0,
      { nonce }
    )
    withdrewRewards = true

    nonce++
    done.add(_contributor)
  }

  await store.removeFromWatchlist(tcr.address, itemID)
  if (withdrewRewards)
    console.info(` Removed item ${itemID} of TCR at ${tcr.address} from watchlist.`.cyan)
}