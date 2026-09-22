import { expect, Locator, Page } from '@playwright/test';

/**
 * Componente reutilizable: cabecera presente en TODAS las paginas.
 *
 * Se modela aparte de las page objects porque no pertenece a una pantalla
 * concreta; asi se evita duplicar los enlaces de sesion y carrito en cada POM.
 */
export class HeaderComponent {
  private readonly registerLink: Locator;
  private readonly loginLink: Locator;
  private readonly logoutLink: Locator;
  private readonly accountLink: Locator;
  private readonly cartLink: Locator;
  private readonly cartQuantity: Locator;

  constructor(page: Page) {
    const headerLinks = page.locator('.header-links');
    this.registerLink = headerLinks.locator('a.ico-register');
    this.loginLink = headerLinks.locator('a.ico-login');
    this.logoutLink = headerLinks.locator('a.ico-logout');
    this.accountLink = headerLinks.locator('a.account');
    this.cartLink = page.locator('#topcartlink a.ico-cart');
    this.cartQuantity = page.locator('#topcartlink .cart-qty');
  }

  async goToRegister(): Promise<void> {
    await this.registerLink.click();
  }

  async goToLogin(): Promise<void> {
    await this.loginLink.click();
  }

  async goToShoppingCart(): Promise<void> {
    await this.cartLink.click();
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
  }

  /** Correo mostrado en la cabecera cuando hay sesion activa. */
  async loggedUserEmail(): Promise<string> {
    return (await this.accountLink.textContent())?.trim() ?? '';
  }

  async isUserLoggedIn(): Promise<boolean> {
    return this.logoutLink.isVisible({ timeout: 5_000 }).catch(() => false);
  }

  /** Cantidad de items del carrito leida del contador "(n)" de la cabecera. */
  async cartItemsCount(): Promise<number> {
    const raw = (await this.cartQuantity.textContent())?.trim() ?? '(0)';
    return Number(raw.replace(/\D/g, '')) || 0;
  }

  // ─────────────────────────── Aserciones ───────────────────────────

  async expectUserLoggedIn(email: string): Promise<void> {
    await expect(this.accountLink, 'La cabecera no muestra la cuenta autenticada').toHaveText(email);
    await expect(this.logoutLink, 'No se ofrece la opcion "Log out"').toBeVisible();
  }

  /** Verifica que NO haya sesion activa (escenario negativo de autenticacion). */
  async expectUserNotLoggedIn(): Promise<void> {
    await expect(this.logoutLink, 'La tienda dejo la sesion iniciada').toBeHidden();
    await expect(this.loginLink, 'La cabecera no ofrece "Log in"').toBeVisible();
  }

  async expectCartItemsCount(expected: number): Promise<void> {
    await expect(this.cartQuantity, 'El contador del carrito no coincide').toHaveText(
      `(${expected})`,
    );
  }
}
