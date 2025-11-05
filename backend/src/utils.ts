import { TransactionBuilder } from "@stellar/stellar-sdk";
import { Server, Api } from "@stellar/stellar-sdk/rpc";
import { Keypair } from "@stellar/stellar-sdk";

export const STELLAR_WAIT_MAX_RETRIES = 10;

export interface StellarConfig {
  networkPassphrase: string;
  rpcUrl: string;
  contractId: string;
  ownerKeypair: Keypair;
}

export interface TransactionResult {
  hash: string;
  response: Api.GetTransactionResponse;
}

/**
 * Utility function to submit, sign, and wait for a Stellar transaction
 * @param txXdr - The transaction XDR string
 * @param rpcServer - The Stellar RPC server instance
 * @param config - The Stellar configuration with network and keypair
 * @returns Promise<TransactionResult> - Transaction hash and response
 */
export async function submitAndWaitForTransaction(
  txXdr: string,
  rpcServer: Server,
  config: StellarConfig
): Promise<TransactionResult> {
  const transaction = TransactionBuilder.fromXDR(
    txXdr,
    config.networkPassphrase
  );

  // Prepare the Tx for signing
  const preparedTx = await rpcServer.prepareTransaction(transaction);

  // Sign the transaction
  preparedTx.sign(config.ownerKeypair);

  // Send the transaction
  const sentTx = await rpcServer.sendTransaction(preparedTx);

  console.log("📤 [SUBMIT RPC] Transaction sent Hash:", sentTx.hash);

  if (sentTx.status !== "PENDING") {
    console.log("❌ [SUBMIT RPC] Transaction not pending:", sentTx.status);
    throw new Error(
      `Transaction failed with status: ${sentTx.status} with details: ${JSON.stringify(sentTx)}`
    );
  }

  let txResponse;
  let attempts = 0;

  while (
    attempts++ < STELLAR_WAIT_MAX_RETRIES &&
    txResponse?.status !== "SUCCESS"
  ) {
    console.log(
      `⏳ [SUBMIT RPC] Polling attempt ${attempts}/${STELLAR_WAIT_MAX_RETRIES}...`
    );

    txResponse = await rpcServer.getTransaction(sentTx.hash);
    console.log(`📊 [SUBMIT RPC] Poll result:`, txResponse?.status);

    switch (txResponse.status) {
      case "FAILED":
        console.log("❌ [SUBMIT RPC] Transaction failed:", txResponse);
        throw new Error(
          `Transaction failed with status: ${txResponse.status} with details: ${JSON.stringify(txResponse)}`
        );
      case "NOT_FOUND":
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      case "SUCCESS":
        console.log(
          "✅ [SUBMIT RPC] Transaction succeeded:",
          txResponse.txHash
        );
        break;
      default:
        // Do nothing, continue polling
        break;
    }
  }

  if (
    attempts >= STELLAR_WAIT_MAX_RETRIES ||
    txResponse?.status !== "SUCCESS"
  ) {
    console.log("⏰ [SUBMIT RPC] Transaction timed out");
    throw new Error(
      `Transaction timed out after ${STELLAR_WAIT_MAX_RETRIES} attempts with details: ${JSON.stringify(txResponse)}`
    );
  }

  return {
    hash: sentTx.hash,
    response: txResponse,
  };
}
