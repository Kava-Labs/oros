import { expect, retryButtonClick } from './fixtures';
import { BrowserContext, Page } from '@playwright/test';
import { SigningOptions, TxType, Wallet, WalletOpts } from './Wallet';

const E2E_WALLET_KEY = process.env.VITE_E2E_WALLET_KEY;

export class MetaMask extends Wallet {
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
    register: boolean = true,
  ) {
    console.info('preparing MetaMask wallet');

    const address = process.env.VITE_E2E_WALLET_ADDRESS;
    const mnemonic = process.env.VITE_E2E_WALLET_MNEMONIC.split(' ');

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
      await metaMask.register(mnemonic);
    }

    return metaMask;
  }

  public async register(mnemonic: string[]) {
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
      await signUpInputGroup.nth(i).fill(mnemonic[i]);
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

  public async switchNetwork() {
    const metaMaskPage = await this.registerPage.context().newPage();
    await metaMaskPage.goto(this.extensionLink + 'home.html');
    await metaMaskPage.waitForSelector('[data-testid="network-display"]', {
      timeout: 10000,
    });

    await retryButtonClick(metaMaskPage, { 'data-testid': 'network-display' });
    await retryButtonClick(metaMaskPage, {
      name: 'Add a custom network',
    });

    await metaMaskPage
      .getByTestId('network-form-network-name')
      .fill('Kava Internal Testnet');

    await retryButtonClick(metaMaskPage, {
      'data-testid': 'test-add-rpc-drop-down',
    });
    await retryButtonClick(metaMaskPage, { name: 'Add RPC URL' });

    await metaMaskPage
      .getByTestId('rpc-url-input-test')
      .fill('https://evm.data.internal.testnet.us-east.production.kava.io');

    await retryButtonClick(metaMaskPage, { name: 'Add URL' });
    await metaMaskPage.getByTestId('network-form-chain-id').fill('2221');
    await metaMaskPage.getByTestId('network-form-ticker-input').fill('TKAVA');
    await retryButtonClick(metaMaskPage, { name: 'Save' });
    await metaMaskPage.waitForTimeout(2000);

    await retryButtonClick(metaMaskPage, { 'data-testid': 'network-display' });
    await retryButtonClick(metaMaskPage, {
      'data-testid': 'Kava Internal Testnet',
    });

    await retryButtonClick(metaMaskPage, {
      'data-testid': 'account-menu-icon',
    });

    await retryButtonClick(metaMaskPage, {
      name: 'Add account or hardware wallet',
    });

    await retryButtonClick(metaMaskPage, { name: 'Import account' });

    await metaMaskPage.locator('#private-key-box').fill(E2E_WALLET_KEY);

    await retryButtonClick(metaMaskPage, { name: 'Import' });

    await metaMaskPage.close();
  }
}
