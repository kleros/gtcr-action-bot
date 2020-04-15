import { ethers } from 'ethers'

import requestSubmittedHandler from './request-submitted'
import requestResolvedHandler from './request-resolved'

export default async function addTCRListeners(
  tcr: ethers.Contract,
  batchWithdraw: ethers.Contract,
  intervals: BlockInterval[],
  provider: ethers.providers.Provider,
  db: Level
) {
  // Submissions and removal requests.
  tcr.on(
    tcr.filters.RequestSubmitted(),
    requestSubmittedHandler(db ,tcr)
  )

  // Request resolved.
  tcr.on(
    tcr.filters.ItemStatusChange(),
    requestResolvedHandler(
      tcr,
      batchWithdraw,
      intervals,
      provider,
      db
    )
  )

  console.info(`Done setting up listeners for ${tcr.address}`)
}
