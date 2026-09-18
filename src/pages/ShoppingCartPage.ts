import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../core/BasePage';

/** Carrito de compras (`/cart`). */
export class ShoppingCartPage extends BasePage {
  protected path = '/cart';
  protected readonly pageIdentifier: Locator;

  private readonly cartTable: Locator;
  private readonly cartRows: Locator;
  private readonly productLinks: Locator;
  private readonly totals: Locator;
  private readonly termsOfServiceCheckbox: Locator;
  private readonly checkoutButton: Locator;
  private readonly emptyCartMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.pageIdentifier = page.locator('.page.shopping-cart-page .page-title h1');
    this.cartTable = page.locator('table.cart');
    this.cartRows = this.cartTable.locator('tbody tr');
    this.productLinks = this.cartRows.locator('a.product-name');
    this.totals = page.locator('.cart-total .product-price').last();
    this.termsOfServiceCheckbox = page.locator('#termsofservice');
    this.checkoutButton = page.locator('#checkout');
    this.emptyCartMessage = page.locator('.order-summary-content .no-data');
  }

  async itemsCount(): Promise<number> {
    if (await this.isEmpty()) return 0;
    return this.cartRows.count();
  }

  async isEmpty(): Promise<boolean> {
    return this.emptyCartMessage.isVisible({ timeout: 3_000 }).catch(() => false);
  }

  async productNames(): Promise<string[]> {
    return (await this.productLinks.allTextContents()).map((n) => n.trim());
  }

  async orderTotal(): Promise<string> {
    return this.textOf(this.totals);
  }

  /**
   * Acepta los terminos y pulsa "Checkout".
   * Sin aceptar los terminos la tienda dispara un `alert` de JavaScript y el
   * flujo se detiene, por eso el check es parte de esta accion de negocio.
   */
  async proceedToCheckout(): Promise<void> {
    await this.checkIfPresent(this.termsOfServiceCheckbox);
    await this.click(this.checkoutButton);
  }

  // ─────────────────────────── Aserciones ───────────────────────────

  async expectProductInCart(productName: string): Promise<void> {
    await expect(
      this.productLinks.filter({ hasText: productName }),
      `El producto "${productName}" no aparece en el carrito`,
    ).toHaveCount(1);
  }

  async expectNotEmpty(): Promise<void> {
    await expect(this.cartRows, 'El carrito esta vacio').not.toHaveCount(0);
  }
}
