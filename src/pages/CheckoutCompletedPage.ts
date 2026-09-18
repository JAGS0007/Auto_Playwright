import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../core/BasePage';

/**
 * Confirmacion de la orden: aqui vive el ENTONCES de la HU-02.
 * DemoWebShop puede renderizar la seccion dentro del one page checkout o
 * redirigir a `/checkout/completed/`; ambos casos quedan cubiertos.
 */
export class CheckoutCompletedPage extends BasePage {
  protected path = '/checkout/completed/';
  protected readonly pageIdentifier: Locator;

  private readonly successTitle: Locator;
  private readonly orderNumber: Locator;
  private readonly orderDetailsLink: Locator;
  private readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.successTitle = page.locator('.section.order-completed .title strong');
    this.orderNumber = page.locator('.order-number strong');
    this.orderDetailsLink = page.locator('a.order-details-link');
    this.continueButton = page.locator('input.order-completed-continue-button');
    this.pageIdentifier = page.locator('.section.order-completed');
  }

  async successMessage(): Promise<string> {
    return this.textOf(this.successTitle);
  }

  /** Numero de orden generado (ej. "Order number: 1234" -> "1234"). */
  async orderNumberValue(): Promise<string> {
    if (!(await this.orderNumber.isVisible({ timeout: 5_000 }).catch(() => false))) return '';
    const raw = await this.textOf(this.orderNumber);
    return raw.replace(/\D/g, '');
  }

  async hasOrderDetailsLink(): Promise<boolean> {
    return this.orderDetailsLink.isVisible({ timeout: 5_000 }).catch(() => false);
  }

  /** ENTONCES: "Your order has been successfully processed!". */
  async expectOrderProcessed(expectedMessage: string): Promise<void> {
    await expect(
      this.successTitle,
      'La tienda no confirmo el procesamiento exitoso de la orden',
    ).toHaveText(expectedMessage);
  }

  async continueShopping(): Promise<void> {
    await this.click(this.continueButton);
  }
}
