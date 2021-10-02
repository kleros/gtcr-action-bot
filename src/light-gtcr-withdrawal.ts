import { ethers } from "ethers";
import fetch from "node-fetch";
import "colors";

import _LightBatchWidthdraw from "./assets/LightBatchWithdraw.json";

async function run(batchWithdraw: ethers.Contract) {
  const subgraphQuery = {
    query: `
      {
        lcontributions(where: { withdrawable: true }) {
          id
          contributor
        }
      }
    `,
  };

  let lcontributions;
  try {
    const res = await (
      await fetch(process.env.GTCR_SUBGRAPH_URL, {
        method: "POST",
        body: JSON.stringify(subgraphQuery),
      })
    ).json();

    lcontributions = res.data.lcontributions;
  } catch (error) {
    console.error(`Failed to fetch lcontributions`, error);
    return;
  }

  let withdrawnContribs = new Set<string>();
  for (let contribution of lcontributions) {
    const { contributor, id: fullID } = contribution;
    let address = fullID.slice(fullID.indexOf("@") + 1, fullID.indexOf("-"));
    let itemID = fullID.slice(0, fullID.indexOf("@"));

    if (withdrawnContribs.has(`${itemID}@${address}`)) continue;
    withdrawnContribs.add(`${itemID}@${address}`);

    try {
      batchWithdraw.batchRequestWithdraw(
        address,
        contributor,
        itemID,
        0,
        0,
        0,
        0
      );
    } catch (error) {
      console.error(
        `Failed to withdraw rewards for light curate TCR request. Parameters: address: ${address}, contributor: ${contributor}, itemID: ${itemID}`
      );
      console.warn(error);
    }
  }
}

// Start bot.
export default async function lightGtcrBot() {
  if (!process.env.GTCR_SUBGRAPH_URL || !process.env.LBATCH_WITHDRAW_ADDRESS) {
    console.warn("No subgraph URL detected. Aborting lightGTCRExecution bot");
    return;
  }
  console.info("Starting light curate withdrawal bot...");
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.PROVIDER_URL
  );
  const signer = new ethers.Wallet(process.env.WALLET_KEY, provider);
  const batchWithdraw = new ethers.Contract(
    process.env.LBATCH_WITHDRAW_ADDRESS as string,
    _LightBatchWidthdraw,
    signer
  );

  run(batchWithdraw);
  setInterval(
    () => run(batchWithdraw),
    Number(process.env.POLL_PERIOD_MINUTES) * 1000
  );
}
