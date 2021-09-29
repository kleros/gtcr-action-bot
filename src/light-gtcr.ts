import { ethers } from "ethers";
import fetch from "node-fetch";
import "colors";

import _LightGeneralizedTCR from "./assets/LightGeneralizedTCR.json";
import _LightBatchWidthdraw from "./assets/LightBatchWithdraw.json";

async function run(batchWithdraw: ethers.Contract) {
  console.info("Light Curate: Querying...");
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

  try {
    const res = await (
      await fetch(process.env.GTCR_SUBGRAPH_URL, {
        method: "POST",
        body: JSON.stringify(subgraphQuery),
      })
    ).json();

    const {
      data: { lcontributions },
    } = res;
    console.info(lcontributions);

    // TODO: Extract:
    // - contributor
    // - itemID
    // - requestID
    // - roundID
    //
    // batchWithdraw
  } catch (error) {
    console.warn(error);
  }
}

// Start bot.
export default async function lightGtcrBot() {
  console.info("Starting light curate bot...");
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.PROVIDER_URL
  );
  const signer = new ethers.Wallet(process.env.WALLET_KEY, provider);
  const batchWithdraw = new ethers.Contract(
    process.env.BATCH_WITHDRAW_ADDRESS as string,
    _LightBatchWidthdraw,
    signer
  );

  run(batchWithdraw);
  setInterval(
    () => run(batchWithdraw),
    Number(process.env.POLL_PERIOD_MINUTES) * 1000
  );
}
