import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../core/BasePage';

/**
 * Pagina de confirmacion `/registerresult/1`.
 *
 * Se modela por separado de `RegisterPage` porque es otra pantalla con otra
 * URL y otra responsabilidad: aqui vive el ENTONCES de la HU-01.
 */
export class RegisterResultPage extends BasePage {
  protected readonly path = '/registerresult/1';
  protected readonly pageIdentifier: Locator;

  private readonly resultMessage: Locator;
  private readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageIdentifier = page.locator('.result');
    this.resultMessage = page.locator('.result');
    this.continueButton = page.locator('input.register-continue-button');
  }

  async confirmationMessage(): Promise<string> {
    return this.textOf(this.resultMessage);
  }

  /** ENTONCES: el sistema muestra "Your registration completed". */
  async expectRegistrationCompleted(expectedMessage: string): Promise<void> {
    await expect(
      this.resultMessage,
      'No se mostro el mensaje de registro exitoso',
    ).toHaveText(expectedMessage);
  }

  async continueToStore(): Promise<void> {
    await this.click(this.continueButton);
  }
}
