import { expect } from './fixtures';
import { BrowserContext, Page } from '@playwright/test';
import {
  EvmWalletID,
  SigningOptions,
  TxType,
  Wallet,
  WalletOpts,
} from './Wallet';
import { Contract, ethers } from 'ethers';
import { readFileSync } from 'fs';

export class MetaMask extends Wallet {
  // eslint-disable-next-line
  constructor(page: Page, opts: WalletOpts) {
    super(page, opts);
  }

  /**
   * prepareWallet prepares the MetaMask wallet for testing
   * it's responsible for loading the wallet key from the generated accounts
   * and registering a new account based on those wallet keys
   */
  static async prepareWallet(
    context: BrowserContext,
    extensionId: string,
    walletId: EvmWalletID,
    register: boolean = true,
  ) {
    console.info('preparing MetaMask wallet');
    const { address, mnemonic } = this.loadWalletKeys({
      walletKeysFilePath: 'accounts.json',
      accountType: 'kavaEvm',
      walletID: walletId,
    });

    await getERC20BalancesForContracts('./e2e/provider_config.json', address);

    let metaMaskPage;

    for (const page of context.pages()) {
      if ((await page.title()) === 'MetaMask') {
        metaMaskPage = page;
        break;
      }
    }

    if (!metaMaskPage) {
      metaMaskPage = await context.newPage();
    }

    const metaMask = new MetaMask(metaMaskPage, {
      extensionId: extensionId,
      address,
      mnemonic,
    });

    if (register) {
      await metaMask.register();
    }

    return metaMask;
  }

  public async register() {
    if ((await this.registerPage.title()) !== 'MetaMask') {
      await this.registerPage.goto(
        this.extensionLink + 'home.html#onboarding/welcome',
      );
    }

    await this.registerPage.getByTestId('onboarding-terms-checkbox').click();

    await this.registerPage
      .getByRole('button', { name: 'Import an existing wallet' })
      .click();

    await this.registerPage.getByRole('button', { name: 'I agree' }).click();

    const signUpInputGroup = this.registerPage.getByRole('textbox');

    for (let i = 0; i < 12; i++) {
      await signUpInputGroup.nth(i).fill(this.mnemonic[i]);
    }

    await this.registerPage
      .getByRole('button', {
        name: 'Confirm Secret Recovery Phrase',
      })
      .click();

    await this.registerPage.waitForLoadState();

    const passwordField = this.registerPage.getByRole('textbox').nth(0);
    const confirmPasswordField = this.registerPage.getByRole('textbox').nth(1);

    // password/registered account get lost when browser closes no need to include it in env
    // private key must be secured
    await passwordField.fill('e2e_test_account_password');
    await confirmPasswordField.fill('e2e_test_account_password');

    await this.registerPage.getByRole('checkbox').click();

    await this.registerPage
      .getByRole('button', { name: 'Import my wallet' })
      .click();

    await this.registerPage.getByRole('button', { name: 'Done' }).click();

    await this.registerPage.getByRole('button', { name: 'Next' }).click();

    await this.registerPage.getByRole('button', { name: 'Done' }).click();

    await this.registerPage.close();
  }

  public async sign(opts: SigningOptions) {
    const { txType, signingPopupPage, ctx } = opts;

    if (txType !== TxType.EIP712 && txType !== TxType.EVM) {
      throw new Error(
        `Metamask doesn't support signing ${txType} transactions`,
      );
    }

    if (txType === TxType.EVM) {
      return await this.signEvm(signingPopupPage);
    }

    return await this.signEIP712(ctx, signingPopupPage);
  }

  private async signEvm(page: Page) {
    const confirmBtn = page.getByRole('button', {
      name: 'Confirm',
    });

    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();
    await page.waitForEvent('close');
  }

  private async signEIP712(ctx: BrowserContext, page: Page) {
    const signaturePage = await this.signEIP712StageOne(ctx, page);
    await this.signEIP712StageTwo(signaturePage);
  }

  private async signEIP712StageOne(
    ctx: BrowserContext,
    page: Page,
  ): Promise<Page> {
    const signBtn = page.getByRole('button', {
      name: 'Confirm',
    });
    await expect(signBtn).toBeEnabled();
    const secondSigningPagePromise = ctx.waitForEvent('page');
    await signBtn.click();
    return await secondSigningPagePromise;
  }

  private async signEIP712StageTwo(page: Page) {
    const signBtn = page.getByRole('button', {
      name: 'Confirm',
    });

    await expect(signBtn).toBeEnabled();

    await signBtn.click();

    await page.waitForEvent('close');
  }
}

async function getERC20BalancesForContracts(
  configPath: string,
  address: string,
) {
  const providerConf = JSON.parse(readFileSync(configPath).toString());

  expect(providerConf.evm.evmUrl).toBeDefined();
  expect(providerConf).toBeDefined();
  expect(providerConf.evm).toBeDefined();
  expect(providerConf.evm.erc20CoinsToSend);
  expect(providerConf.evm.erc20CoinsToSend.length).not.toBe(0);

  const balanceOfABI = [
    {
      constant: true,
      inputs: [
        {
          name: '_owner',
          type: 'address',
        },
      ],
      name: 'balanceOf',
      outputs: [
        {
          name: 'balance',
          type: 'uint256',
        },
      ],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
  ];

  for (const { contractAddress, amount } of providerConf.evm.erc20CoinsToSend) {
    expect(contractAddress).toBeDefined();
    expect(amount).toBeDefined();

    let balance;

    let tryCount = 0;
    while (tryCount < 3) {
      try {
        balance = await new Contract(
          contractAddress,
          balanceOfABI,
          new ethers.JsonRpcProvider(providerConf.evm.evmUrl),
        ).balanceOf(address);

        balance = balance.toString();

        if (balance === 0) {
          throw new Error('Zero balance - tx will fail');
        }

        break;
      } catch (err) {
        tryCount++;
        console.log(err);
        console.log(
          `retrying fetching erc20 balance for asset with contract: ${contractAddress} `,
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    expect(Number(amount)).toBeGreaterThan(0);

    console.info(
      `metamask account with address ${address} has ${balance.toString()} in asset with contract ${contractAddress}`,
    );
  }
}
