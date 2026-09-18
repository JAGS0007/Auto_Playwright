import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../core/BasePage';

/**
 * Listado de productos de una categoria o subcategoria.
 *
 * La ruta es dinamica porque se alcanza navegando por el menu; `open()` solo
 * se usa cuando se quiere entrar directo mediante `openBySlug()`.
 */
export class CategoryPage extends BasePage {
  protected path = '/';
  protected readonly pageIdentifier: Locator;

  private readonly categoryTitle: Locator;
  private readonly productGrid: Locator;
  private readonly productItems: Locator;
  private readonly productTitles: Locator;
  private readonly sortBySelect: Locator;

  constructor(page: Page) {
    super(page);
    this.categoryTitle = page.locator('.page.category-page .page-title h1');
    this.productGrid = page.locator('.product-grid');
    this.productItems = this.productGrid.locator('.item-box');
    this.productTitles = this.productItems.locator('h2.product-title a');
    this.sortBySelect = page.locator('#products-orderby');
    this.pageIdentifier = this.categoryTitle;
  }

  /** Entra directamente a la categoria por su slug (p. ej. `notebooks`). */
  async openBySlug(slug: string): Promise<this> {
    this.path = `/${slug.replace(/^\//, '')}`;
    return this.open();
  }

  async categoryName(): Promise<string> {
    return this.textOf(this.categoryTitle);
  }

  async productsCount(): Promise<number> {
    await expect(this.productGrid, 'La categoria no muestra grilla de productos').toBeVisible();
    return this.productItems.count();
  }

  async productNames(): Promise<string[]> {
    return (await this.productTitles.allTextContents()).map((n) => n.trim());
  }

  async sortBy(criteria: string): Promise<void> {
    await this.selectByLabel(this.sortBySelect, criteria);
  }

  /** Abre el detalle del producto ubicado en la posicion indicada (base 0). */
  async openProductAt(index: number): Promise<string> {
    const total = await this.productsCount();
    expect(total, `La categoria no tiene productos para comprar`).toBeGreaterThan(0);
    expect(index, `Indice ${index} fuera de rango (productos disponibles: ${total})`).toBeLessThan(total);

    const link = this.productTitles.nth(index);
    const name = (await link.textContent())?.trim() ?? '';
    await this.click(link);
    return name;
  }

  /** Abre el detalle del producto por su nombre exacto. */
  async openProductByName(name: string): Promise<void> {
    const link = this.productTitles.filter({ hasText: name }).first();
    await expect(link, `No se encontro el producto "${name}" en la categoria`).toBeVisible();
    await this.click(link);
  }

  /** Abre el primer producto del listado (estrategia por defecto de la HU-02). */
  async openFirstProduct(): Promise<string> {
    return this.openProductAt(0);
  }

  async expectProductsAvailable(): Promise<void> {
    await expect(this.productItems, 'La categoria no tiene productos publicados').not.toHaveCount(0);
  }
}
