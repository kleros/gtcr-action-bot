import { ethers } from 'ethers'

import requestSubmittedHandler from './request-submitted'
import requestResolvedHandler from './request-resolved'
import Store from '../utils/store'

async function addTCRListeners(
  tcr: ethers.Contract,
  batchWithdraw: ethers.Contract,
  intervals: BlockInterval[],
  provider: ethers.providers.Provider,
  store: Store,
  signer: ethers.Wallet
) {
  // Submissions and removal requests.
  tcr.on(
    tcr.filters.RequestSubmitted(),
    requestSubmittedHandler(store ,tcr)
  )

  // Request resolved.
  tcr.on(
    tcr.filters.ItemStatusChange(),
    requestResolvedHandler(
      tcr,
      batchWithdraw,
      intervals,
      provider,
      store,
      signer
    )
  )

  console.info(`Setup listeners for ${tcr.address}`)
}

export { addTCRListeners }