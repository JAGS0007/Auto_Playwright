import { expect, Locator, Page } from '@playwright/test';

/**
 * Componente reutilizable: menu horizontal de categorias.
 *
 * DemoWebShop despliega las subcategorias mediante `:hover` de CSS, por eso
 * se hace `hover` sobre la categoria antes de pulsar la subcategoria.
 * Si el submenu no se despliega (viewport reducido, render diferido) se
 * degrada elegantemente entrando a la categoria y usando su grilla interna.
 */
export class TopMenuComponent {
  private readonly menu: Locator;

  constructor(private readonly page: Page) {
    this.menu = page.locator('ul.top-menu');
  }

  private category(name: string): Locator {
    return this.menu.locator('> li').filter({ has: this.page.getByRole('link', { name, exact: true }) });
  }

  /** Nombres de las categorias de primer nivel. */
  async categories(): Promise<string[]> {
    const names = await this.menu.locator('> li > a').allTextContents();
    return names.map((n) => n.trim()).filter(Boolean);
  }

  /** Subcategorias publicadas por una categoria (vacio si no tiene). */
  async subCategoriesOf(category: string): Promise<string[]> {
    const sublist = this.category(category).locator('ul.sublist > li > a');
    if ((await sublist.count()) === 0) return [];
    const names = await sublist.allTextContents();
    return names.map((n) => n.trim()).filter(Boolean);
  }

  async hasSubCategories(category: string): Promise<boolean> {
    return (await this.subCategoriesOf(category)).length > 0;
  }

  /** Clic en una categoria de primer nivel. */
  async openCategory(category: string): Promise<void> {
    const link = this.category(category).locator('> a');
    await expect(link, `La categoria "${category}" no existe en el menu`).toBeVisible();
    await link.click();
  }

  /** Despliega la categoria y entra a la subcategoria indicada. */
  async openSubCategory(category: string, subCategory: string): Promise<void> {
    const parent = this.category(category);
    await parent.locator('> a').hover();

    const subLink = parent.locator('ul.sublist').getByRole('link', { name: subCategory, exact: true });
    const displayed = await subLink.isVisible({ timeout: 3_000 }).catch(() => false);

    if (displayed) {
      await subLink.click();
      return;
    }

    // Plan B: entrar a la categoria y usar la grilla de subcategorias.
    await this.openCategory(category);
    const gridLink = this.page
      .locator('.sub-category-grid, .sub-category-item')
      .getByRole('link', { name: subCategory, exact: true })
      .first();
    await expect(
      gridLink,
      `La subcategoria "${subCategory}" no esta disponible dentro de "${category}"`,
    ).toBeVisible();
    await gridLink.click();
  }
}
