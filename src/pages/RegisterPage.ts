import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../core/BasePage';
import type { User } from '../data/models';

/** Formulario de registro (HU-01). */
export class RegisterPage extends BasePage {
  protected readonly path = '/register';
  protected readonly pageIdentifier: Locator;

  private readonly genderMale: Locator;
  private readonly genderFemale: Locator;
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly confirmPasswordInput: Locator;
  private readonly registerButton: Locator;
  private readonly validationErrors: Locator;

  constructor(page: Page) {
    super(page);
    this.pageIdentifier = page.locator('.page.registration-page .page-title h1');
    this.genderMale = page.locator('#gender-male');
    this.genderFemale = page.locator('#gender-female');
    this.firstNameInput = page.locator('#FirstName');
    this.lastNameInput = page.locator('#LastName');
    this.emailInput = page.locator('#Email');
    this.passwordInput = page.locator('#Password');
    this.confirmPasswordInput = page.locator('#ConfirmPassword');
    this.registerButton = page.locator('#register-button');
    this.validationErrors = page.locator('.validation-summary-errors, .field-validation-error');
  }

  /** Diligencia el formulario sin enviarlo (util para pruebas negativas). */
  async fillRegistrationForm(user: User): Promise<this> {
    await this.click(user.gender === 'Male' ? this.genderMale : this.genderFemale);
    await this.fill(this.firstNameInput, user.firstName);
    await this.fill(this.lastNameInput, user.lastName);
    await this.fill(this.emailInput, user.email);
    await this.fill(this.passwordInput, user.password);
    await this.fill(this.confirmPasswordInput, user.password);
    return this;
  }

  async submit(): Promise<void> {
    await this.click(this.registerButton);
  }

  /** Diligencia y envia el registro en un solo paso de negocio. */
  async register(user: User): Promise<void> {
    await this.fillRegistrationForm(user);
    await this.submit();
  }

  async validationErrorMessages(): Promise<string[]> {
    return (await this.validationErrors.allTextContents()).map((t) => t.trim()).filter(Boolean);
  }

  /** Verifica que la tienda rechace el registro con el motivo esperado. */
  async expectValidationError(expected: string): Promise<void> {
    await expect(
      this.validationErrors.first(),
      `La aplicacion no rechazo el registro con el mensaje "${expected}"`,
    ).toContainText(expected);
  }

  async expectNoValidationErrors(): Promise<void> {
    await expect(
      this.validationErrors,
      `El registro reporto errores de validacion: ${(await this.validationErrorMessages()).join(' | ')}`,
    ).toHaveCount(0);
  }
}
