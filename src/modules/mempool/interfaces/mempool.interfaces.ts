export interface MempoolLookupContent {
  cmd: string;
  hash: string;
}

export interface PactCommand {
  networkId: string;
  meta: ChainwebMetadata;
  nonce: string;
}

export interface ChainwebMetadata {
  chainId: string;
  sender: string;
  gasLimit: number;
  gasPrice: number;
  ttl: number;
  creationTime: number;
}

export interface MempoolLookupCommand {
  requestKey: string;
  command: PactCommand;
}
