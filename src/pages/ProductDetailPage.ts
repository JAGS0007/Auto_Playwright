import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../core/BasePage';

/** Detalle de producto: aqui ocurre el "agrego al carrito" de la HU-02. */
export class ProductDetailPage extends BasePage {
  protected path = '/';
  protected readonly pageIdentifier: Locator;

  private readonly name: Locator;
  private readonly price: Locator;
  private readonly quantityInput: Locator;
  private readonly addToCartButton: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.locator('.product-name h1');
    this.price = page.locator('.product-price span').first();
    this.quantityInput = page.locator('.add-to-cart-panel input.qty-input');
    this.addToCartButton = page.locator('input.add-to-cart-button');
    this.pageIdentifier = this.name;
  }

  async productName(): Promise<string> {
    return this.textOf(this.name);
  }

  async productPrice(): Promise<string> {
    return this.textOf(this.price);
  }

  async setQuantity(quantity: number): Promise<void> {
    if (await this.quantityInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.quantityInput.fill(String(quantity));
    }
  }

  /**
   * Agrega el producto al carrito y espera la confirmacion de la tienda.
   * Devuelve el nombre del producto agregado para su posterior verificacion.
   */
  async addToCart(quantity = 1): Promise<string> {
    const product = await this.productName();
    await expect(
      this.addToCartButton,
      `El producto "${product}" no ofrece boton "Add to cart" (puede requerir atributos obligatorios)`,
    ).toBeVisible();

    await this.setQuantity(quantity);
    await this.click(this.addToCartButton);
    return product;
  }
}
