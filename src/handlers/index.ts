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
  // TODO: Filter out unresolved item status change events.
  tcr.on(
    tcr.filters.ItemStatusChange(),
    requestResolvedHandler()
  )

  console.info(`Done setting up listeners for ${tcr.address}`)
}
