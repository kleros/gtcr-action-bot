import { ethers } from "ethers"
import { BigNumber } from "ethers/utils"
import Store from "./store"

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
      0,
      { nonce }
    )

    nonce++
    done.add(_contributor)
  }

  await store.removeFromWatchlist(tcr.address, itemID)
  console.info(` Removed item ${itemID} of TCR at ${tcr.address} from watchlist.`.cyan)
}