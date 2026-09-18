import { expect, Locator, Page } from '@playwright/test';

/** Barra flotante de notificaciones (`#bar-notification`) de DemoWebShop. */
export class NotificationBarComponent {
  private readonly bar: Locator;
  private readonly content: Locator;
  private readonly closeButton: Locator;

  constructor(page: Page) {
    this.bar = page.locator('#bar-notification');
    this.content = this.bar.locator('p.content');
    this.closeButton = this.bar.locator('span.close');
  }

  async message(): Promise<string> {
    await expect(this.content).toBeVisible();
    return ((await this.content.textContent()) ?? '').trim();
  }

  async expectSuccessMessage(expected: string): Promise<void> {
    await expect(this.bar, 'La notificacion no es de tipo exitoso').toHaveClass(/success/);
    await expect(this.content, 'El mensaje de la notificacion no coincide').toContainText(expected);
  }

  /** Cierra la barra para que no tape elementos de la pagina. */
  async dismiss(): Promise<void> {
    if (await this.closeButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.closeButton.click();
      await expect(this.bar).toBeHidden();
    }
  }
}
