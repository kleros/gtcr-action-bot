import { ethers } from "ethers";
import fetch from "node-fetch";
import "colors";

import _LightGeneralizedTCR from "./assets/LightGeneralizedTCR.json";

async function run(signer: ethers.Wallet) {
  const subgraphQuery = {
    query: `
      {
        lrequests(where: { resolved: false, disputed: false }) {
          submissionTime
          item {
            itemID
          }
          registry {
            id
          }
        }
      }
    `,
  };

  let lrequests;
  try {
    const res = await (
      await fetch(process.env.GTCR_SUBGRAPH_URL, {
        method: "POST",
        body: JSON.stringify(subgraphQuery),
      })
    ).json();

    lrequests = res.data.lrequests;
  } catch (error) {
    console.error(`Failed to fetch lcontributions`, error);
    return;
  }

  for (let request of lrequests) {
    let challengePeriodDuration;
    const tcr = new ethers.Contract(
      request.registry.id,
      _LightGeneralizedTCR,
      signer
    );
    try {
      challengePeriodDuration = Number(await tcr.challengePeriodDuration());
    } catch (error) {
      console.error(
        `Error fetching challenge period for light curate @ ${tcr.address}`
      );
      return;
    }

    const challengePeriodEnd =
      Number(request.submissionTime) + challengePeriodDuration;
    if (Date.now() / 1000 < challengePeriodEnd) {
      continue;
    }

    try {
      tcr.executeRequest(request.item.itemID);
    } catch (error) {
      console.error(
        `Failed to execute request for light curate item ${request.item.itemID}`
      );
    }
  }
}

// Start bot.
export default async function lightGTCRExecuteBot() {
  console.info("Starting light curate bot...");
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.PROVIDER_URL
  );
  const signer = new ethers.Wallet(process.env.WALLET_KEY, provider);

  run(signer);
  setInterval(
    () => run(signer),
    Number(process.env.POLL_PERIOD_MINUTES) * 1000
  );
}
