import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../core/BasePage';
import type { Credentials } from '../data/models';

/** Formulario de autenticacion (HU-02). */
export class LoginPage extends BasePage {
  protected readonly path = '/login';
  protected readonly pageIdentifier: Locator;

  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly rememberMeCheckbox: Locator;
  private readonly loginButton: Locator;
  private readonly validationErrors: Locator;

  constructor(page: Page) {
    super(page);
    this.pageIdentifier = page.locator('.page.login-page .page-title h1');
    this.emailInput = page.locator('#Email');
    this.passwordInput = page.locator('#Password');
    this.rememberMeCheckbox = page.locator('#RememberMe');
    this.loginButton = page.locator('input.login-button');
    this.validationErrors = page.locator('.validation-summary-errors');
  }

  async login({ email, password }: Credentials, rememberMe = false): Promise<void> {
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);
    if (rememberMe) await this.rememberMeCheckbox.check();
    await this.click(this.loginButton);
  }

  async expectLoginError(expected: string): Promise<void> {
    await expect(this.validationErrors).toContainText(expected);
  }
}
