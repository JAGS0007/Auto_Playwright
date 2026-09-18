import { Locator, Page } from '@playwright/test';
import { BasePage } from '../core/BasePage';

/** Pagina inicial de DemoWebShop: puerta de entrada de ambas historias. */
export class HomePage extends BasePage {
  protected readonly path = '/';
  protected readonly pageIdentifier: Locator;

  constructor(page: Page) {
    super(page);
    this.pageIdentifier = page.locator('ul.top-menu');
  }
}
