export type TransferParams = {
  assetName: string;
  senderAddress: string;
  receiverAddress: string;
  amount: number;
};

export type GenerateCoinMetadataParams = {
  prompt: string;
  about: string;
  symbol: string;
  name: string;
};

export type GenerateCoinMetadataResponse = {
  id: string;
  about: string;
  symbol: string;
  name: string;
};

export enum ToolFunctions {
  GENERATE_COIN_METADATA = 'generateCoinMetadata',
  NAVIGATE_TO_PAGE = 'navigateToPage',
}
