import { TransactionBuilder } from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";
import { NETWORK_PASSPHRASE } from "../hooks/usePredictionMarket";
import { useWallet } from "../hooks/useWallet";
import { wallet } from "./wallet";

/**
 * Shortens a contract ID string by keeping the first `prefixLength` characters,
 * an ellipsis, then the last `suffixLength` characters.
 * If the ID is shorter than or equal to `prefixLength + suffixLength`, returns it unchanged.
 */
export function shortenContractId(
  id: string,
  prefixLength = 5,
  suffixLength = 4
): string {
  if (id.length <= prefixLength + suffixLength) {
    return id;
  }
  const start = id.slice(0, prefixLength);
  const end = id.slice(-suffixLength);
  return `${start}…${end}`;
}

const STELLAR_WAIT_MAX_RETRIES = 20;

export interface TransactionResult {
  hash: string;
  result: any;
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
  address: string,
  signTransaction: typeof wallet.signTransaction
): Promise<TransactionResult> {
  const transaction = TransactionBuilder.fromXDR(txXdr, NETWORK_PASSPHRASE);

  // Prepare the Tx for signing
  const preparedTx = await rpcServer.prepareTransaction(transaction);

  // sign transaction

  const xdr = preparedTx.toXDR();

  if (!signTransaction) {
    throw new Error("signTransaction is not available");
  }

  const signedTxResult = await signTransaction(xdr, {
    address,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  if (!signedTxResult.signedTxXdr || signedTxResult.signedTxXdr.length === 0) {
    throw new Error("Failed to sign transaction");
  }

  const signedTransaction = TransactionBuilder.fromXDR(
    signedTxResult.signedTxXdr,
    NETWORK_PASSPHRASE
  );

  // Send the transaction
  const sentTx = await rpcServer.sendTransaction(signedTransaction);

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

  return { hash: sentTx.hash, result: txResponse };
}
