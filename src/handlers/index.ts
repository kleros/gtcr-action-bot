import { ethers } from 'ethers'

import requestSubmittedHandler from './request-submitted'
import requestResolvedHandler from './request-resolved'

export default async function addTCRListeners(tcr: ethers.Contract) {
  // Submissions and removal requests.
  tcr.on(
    tcr.filters.RequestSubmitted(),
    requestSubmittedHandler()
  )

  // Request resolved.
  tcr.on(
    tcr.filters.ItemStatusChange(null, null, null, null, true),
    requestResolvedHandler()
  )

  console.info(`Done setting up listeners for ${tcr.address}`)
}
