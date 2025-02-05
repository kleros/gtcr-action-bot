import "colors";
import delay from "delay";
import { ethers } from "ethers";
import fetch from "node-fetch";

import _LightGeneralizedTCR from "./assets/LightGeneralizedTCR.json";

async function run(signer: ethers.Wallet) {
  console.info(`Checking for pending requests.`.green);
  const subgraphQuery = {
    query: `
      {
        lrequests(where: { resolved: false, disputed: false }, first: 1000) {
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
  let response;
  try {
    response = await fetch(process.env.GTCR_SUBGRAPH_URL, {
      method: "POST",
      body: JSON.stringify(subgraphQuery),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const parsed = await response.json();

    lrequests = parsed.data.lrequests;
  } catch (error) {
    console.error(`Failed to fetch lrequests`.green, error);
    console.error(`Response`.green, response);
    return;
  }
  console.info(`Pending requests: ${lrequests.length}`.green);

  for (let request of lrequests) {
    console.info(
      `Executing request for item ID ${request.item.itemID} @ ${request.registry.id}`
        .green
    );

    let challengePeriodDuration;
    const tcr = new ethers.Contract(
      request.registry.id,
      _LightGeneralizedTCR,
      signer
    );

    // double check against the contract if the item is still in pending state.
    const itemInfo = await tcr.callStatic.getItemInfo(request.item.itemID);
    if (itemInfo.status === 1 || itemInfo.status === 0) {
      console.warn(
        `The item ${request.item.itemID} is not in pending state. Current status: ${itemInfo.status}. Skipping entry`
          .yellow
      );
      continue;
    }

    let nonce;
    try {
      nonce = await signer.getTransactionCount();
    } catch (error) {
      console.error(`Error fetching nonce`.green, error);
      return;
    }
    try {
      challengePeriodDuration = Number(await tcr.challengePeriodDuration());
    } catch (error) {
      console.error(
        `Error fetching challenge period for light curate @ ${tcr.address}`
          .green
      );
      return;
    }

    const challengePeriodEnd =
      Number(request.submissionTime) + challengePeriodDuration;
    if (Date.now() / 1000 < challengePeriodEnd) {
      console.debug("Challenge period not yet over. Skipping entry".green);
      continue;
    }

    try {
      // pass gas requirement manually for arbitrum rinkeby compatibility
      const tx = await tcr.executeRequest(request.item.itemID, {
        nonce,
        gasLimit: 2_100_000,
      });
      await delay(120 * 1000); // Wait 2 minutes to give time for the chain to sync/nonce handling.
      console.info(`ExecuteRequest sent. Transaction hash: ${tx.hash}`.green);
    } catch (error) {
      console.error(
        `Failed to execute request for light curate item ${request.item.itemID} @ ${request.registry.id}`
          .green
      );
      console.error(error);
    }
  }
  console.log(`All the items unregistered have been controlled`.green);
}

// Start bot.
export default async function lightGTCRExecuteBot() {
  if (!process.env.GTCR_SUBGRAPH_URL) {
    console.warn("No subgraph URL detected. Aborting lightGTCRExecution bot");
    return;
  }
  console.info(`Starting light curate execution bot...`.green);
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.PROVIDER_URL
  );
  const signer = new ethers.Wallet(process.env.WALLET_KEY, provider);

  run(signer);
  setInterval(
    () => run(signer),
    Number(process.env.POLL_PERIOD_MINUTES) * 60 * 1000
  );
}
