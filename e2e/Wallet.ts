import { expect } from './fixtures';
import { BrowserContext, Page } from '@playwright/test';
import { readFileSync } from 'fs';

// tests in playwright run in separate processes and are completely isolated from each other for this reason we will determine
// the "index" that points to a funded wallet on each test suite manually to keep tests isolated and use unique accounts
// each module/page in the webapp should get a numerical ID to identify the index from the array of
// generated accounts, this is done through this enum, and as more test suites are added the WalletID
// should be added here into this enum, order doesn't matter because the accounts are random for each run
// there must be more accounts available with funds than the number of wallets in this enum such that each test suite gets a unique wallet
export enum EvmWalletID {
  'CHAT_TESTING_ACCOUNT_A',
}

export type WalletOpts = {
  extensionId: string;
  mnemonic?: string[];
  address: string;
};

export enum TxType {
  EIP712 = 'eip712',
  EVM = 'evm',
}

export type SigningOptions = {
  ctx: BrowserContext;
  signingPopupPage: Page;
  txType: TxType;
};

export type LoadWalletKeysOpts = {
  walletKeysFilePath: string;
  accountType: 'kava' | 'kavaEvm';
  walletID: number;
};

export abstract class Wallet {
  readonly extensionId: string;
  readonly extensionLink: string;
  readonly registerPage: Page;
  readonly address: string;
  protected mnemonic: string[];

  constructor(page: Page, opts: WalletOpts) {
    this.registerPage = page;
    this.extensionId = opts.extensionId;
    this.extensionLink = `chrome-extension://${opts.extensionId}/`;
    this.address = opts.address;

    if (!opts.mnemonic) {
      throw new Error('must provide mnemonic');
    }
    this.mnemonic = opts.mnemonic;
  }

  // all Wallets must implement their own unique register & sign methods

  abstract register(): Promise<void>;

  abstract sign(opts: SigningOptions): Promise<void>;

  static loadWalletKeys(opts: LoadWalletKeysOpts) {
    const { accountType, walletKeysFilePath, walletID } = opts;

    const accounts = JSON.parse(readFileSync(walletKeysFilePath).toString());

    expect(accounts[accountType]).toBeDefined();

    expect(accounts[accountType].length).toBeGreaterThan(walletID);

    const walletKeys = accounts[accountType][walletID];

    expect(walletKeys).toBeDefined();

    expect(walletKeys.mnemonic).toBeDefined();
    expect(walletKeys.address).toBeDefined();

    return {
      mnemonic: walletKeys.mnemonic.split(' '),
      address: walletKeys.address,
    };
  }
}
