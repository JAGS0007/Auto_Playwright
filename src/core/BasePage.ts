import { expect, Locator, Page } from '@playwright/test';
import { HeaderComponent } from '../components/HeaderComponent';
import { NotificationBarComponent } from '../components/NotificationBarComponent';
import { TopMenuComponent } from '../components/TopMenuComponent';

/**
 * Clase base del patron Page Object Model.
 *
 * Centraliza el acceso a `Page` y las interacciones de bajo nivel para que las
 * paginas concretas expresen UNICAMENTE el lenguaje del negocio
 * (registrarse, agregarAlCarrito, confirmarOrden...) y nunca los detalles
 * de sincronizacion o del driver.
 *
 * Reglas del framework:
 *  - Ninguna page object expone `Locator` ni `Page` hacia los tests.
 *  - Ningun test importa `@playwright/test` para localizar elementos.
 *  - Las esperas son web-first (auto-waiting), nunca `waitForTimeout`.
 */
export abstract class BasePage {
  /** Cabecera (sesion y carrito), disponible en toda la tienda. */
  readonly header: HeaderComponent;
  /** Menu de categorias y subcategorias. */
  readonly topMenu: TopMenuComponent;
  /** Barra flotante de notificaciones. */
  readonly notification: NotificationBarComponent;

  protected constructor(protected readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.topMenu = new TopMenuComponent(page);
    this.notification = new NotificationBarComponent(page);
  }

  /** Ruta relativa de la pagina respecto del `baseURL`. */
  protected abstract path: string;

  /** Elemento unico que confirma que la pagina termino de cargar. */
  protected abstract readonly pageIdentifier: Locator;

  // ───────────────────────────── Navegacion ─────────────────────────────

  /** Navega directamente a la pagina y valida que se haya desplegado. */
  async open(): Promise<this> {
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
    return this.waitUntilLoaded();
  }

  /** Espera a que la pagina este realmente lista para ser operada. */
  async waitUntilLoaded(): Promise<this> {
    await expect(
      this.pageIdentifier,
      `No se desplego la pagina "${this.constructor.name}" (ruta esperada: ${this.path})`,
    ).toBeVisible();
    return this;
  }

  /** Indica si la pagina esta visible sin lanzar error (para flujos condicionales). */
  async isDisplayed(timeout = 5_000): Promise<boolean> {
    return this.pageIdentifier.isVisible({ timeout }).catch(() => false);
  }

  async title(): Promise<string> {
    return this.page.title();
  }

  currentUrl(): string {
    return this.page.url();
  }

  // ─────────────────────── Interacciones protegidas ──────────────────────

  protected async click(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    await locator.click();
  }

  /** Limpia y escribe. Se omite si el valor es `undefined` (campo opcional). */
  protected async fill(locator: Locator, value?: string): Promise<void> {
    if (value === undefined) return;
    await locator.scrollIntoViewIfNeeded();
    await locator.fill(value);
  }

  /** Selecciona una opcion de un `<select>` por su texto visible. */
  protected async selectByLabel(locator: Locator, label: string): Promise<void> {
    await expect(
      locator.locator('option', { hasText: label }),
      `La lista desplegable no ofrece la opcion "${label}"`,
    ).not.toHaveCount(0);
    await locator.selectOption({ label });
  }

  /** Marca un checkbox solo si existe y aun no esta marcado (idempotente). */
  protected async checkIfPresent(locator: Locator, timeout = 3_000): Promise<void> {
    const present = await locator.isVisible({ timeout }).catch(() => false);
    if (present && !(await locator.isChecked())) {
      await locator.check();
    }
  }

  /** Texto normalizado (sin espacios redundantes) de un elemento. */
  protected async textOf(locator: Locator): Promise<string> {
    return ((await locator.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  /** Adjunta una evidencia visual al reporte de Playwright. */
  async captureEvidence(name: string): Promise<Buffer> {
    return this.page.screenshot({ fullPage: true, path: `reports/evidence/${name}.png` });
  }
}
