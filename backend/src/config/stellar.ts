import { Keypair, Networks } from '@stellar/stellar-sdk';
import { Server } from '@stellar/stellar-sdk/rpc';
import dotenv from 'dotenv';

dotenv.config();

export interface StellarConfig {
  networkPassphrase: string;
  rpcUrl: string;
  contractId: string;
  ownerKeypair: Keypair;
}

export function getStellarConfig(): StellarConfig {
  const network = process.env.STELLAR_NETWORK || 'testnet';
  const ownerSecretKey = process.env.OWNER_SECRET_KEY;

  if (!ownerSecretKey) {
    throw new Error('OWNER_SECRET_KEY is not set in environment variables');
  }

  let networkPassphrase: string;
  let rpcUrl: string;

  switch (network) {
    case 'testnet':
      networkPassphrase = Networks.TESTNET;
      rpcUrl = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
      break;
    case 'mainnet':
      networkPassphrase = Networks.PUBLIC;
      rpcUrl = process.env.STELLAR_RPC_URL || 'https://mainnet.sorobanrpc.com';
      break;
    case 'standalone':
      networkPassphrase = 'Standalone Network ; February 2017';
      rpcUrl = process.env.STELLAR_RPC_URL || 'http://localhost:8000/rpc';
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }

  const contractId = process.env.PREDICTION_MARKET_CONTRACT_ID;
  if (!contractId) {
    throw new Error('PREDICTION_MARKET_CONTRACT_ID is not set in environment variables');
  }

  const ownerKeypair = Keypair.fromSecret(ownerSecretKey);

  return {
    networkPassphrase,
    rpcUrl,
    contractId,
    ownerKeypair,
  };
}

export function getRpcServer(): Server {
  const config = getStellarConfig();
  return new Server(config.rpcUrl);
}
