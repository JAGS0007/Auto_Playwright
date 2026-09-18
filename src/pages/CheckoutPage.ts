import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../core/BasePage';
import type { BillingAddress, CreditCard } from '../data/models';

/** Neutraliza los metacaracteres de una cadena para usarla dentro de un RegExp. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Identificadores de los pasos del One Page Checkout de DemoWebShop. */
type CheckoutStep =
  | 'billing'
  | 'shipping'
  | 'shipping-method'
  | 'payment-method'
  | 'payment-info'
  | 'confirm-order';

/**
 * One Page Checkout (`/onepagecheckout`).
 *
 * La tienda resuelve los seis pasos por AJAX dentro de la misma URL, por eso
 * se modela como UNA page object con un metodo por paso de negocio, mas un
 * orquestador `completePurchase()` que expresa el flujo completo de la HU-02.
 * Cada paso espera a que el indicador "Loading next step..." desaparezca y a
 * que la seccion siguiente quede visible: cero `waitForTimeout`.
 */
export class CheckoutPage extends BasePage {
  protected path = '/onepagecheckout';
  protected readonly pageIdentifier: Locator;

  // Paso 1 - Billing address
  private readonly billingAddressSelect: Locator;
  private readonly billingFirstName: Locator;
  private readonly billingLastName: Locator;
  private readonly billingEmail: Locator;
  private readonly billingCompany: Locator;
  private readonly billingCountry: Locator;
  private readonly billingState: Locator;
  private readonly billingCity: Locator;
  private readonly billingAddress1: Locator;
  private readonly billingAddress2: Locator;
  private readonly billingZip: Locator;
  private readonly billingPhone: Locator;
  private readonly billingFax: Locator;
  private readonly billingContinue: Locator;

  // Paso 2 - Shipping address
  private readonly shippingAddressSelect: Locator;
  private readonly shippingContinue: Locator;

  // Paso 3 - Shipping method
  private readonly shippingMethodOptions: Locator;
  private readonly shippingMethodContinue: Locator;

  // Paso 4 - Payment method
  private readonly paymentMethodOptions: Locator;
  private readonly paymentMethodContinue: Locator;

  // Paso 5 - Payment information
  private readonly creditCardType: Locator;
  private readonly cardholderName: Locator;
  private readonly cardNumber: Locator;
  private readonly expireMonth: Locator;
  private readonly expireYear: Locator;
  private readonly cardCode: Locator;
  private readonly paymentInfoContinue: Locator;

  // Paso 6 - Confirm order
  private readonly confirmOrderButton: Locator;
  private readonly orderReview: Locator;
  private readonly orderedProductLinks: Locator;
  private readonly orderTotalValue: Locator;

  constructor(page: Page) {
    super(page);
    this.pageIdentifier = page.locator('#checkout-steps').first();

    this.billingAddressSelect = page.locator('#billing-address-select');
    this.billingFirstName = page.locator('#BillingNewAddress_FirstName');
    this.billingLastName = page.locator('#BillingNewAddress_LastName');
    this.billingEmail = page.locator('#BillingNewAddress_Email');
    this.billingCompany = page.locator('#BillingNewAddress_Company');
    this.billingCountry = page.locator('#BillingNewAddress_CountryId');
    this.billingState = page.locator('#BillingNewAddress_StateProvinceId');
    this.billingCity = page.locator('#BillingNewAddress_City');
    this.billingAddress1 = page.locator('#BillingNewAddress_Address1');
    this.billingAddress2 = page.locator('#BillingNewAddress_Address2');
    this.billingZip = page.locator('#BillingNewAddress_ZipPostalCode');
    this.billingPhone = page.locator('#BillingNewAddress_PhoneNumber');
    this.billingFax = page.locator('#BillingNewAddress_FaxNumber');
    this.billingContinue = page.locator('input[onclick="Billing.save()"]');

    this.shippingAddressSelect = page.locator('#shipping-address-select');
    this.shippingContinue = page.locator('input[onclick="Shipping.save()"]');

    this.shippingMethodOptions = page.locator('#checkout-step-shipping-method input[type="radio"]');
    this.shippingMethodContinue = page.locator('input[onclick="ShippingMethod.save()"]');

    this.paymentMethodOptions = page.locator('#checkout-step-payment-method input[type="radio"]');
    this.paymentMethodContinue = page.locator('input[onclick="PaymentMethod.save()"]');

    this.creditCardType = page.locator('#CreditCardType');
    this.cardholderName = page.locator('#CardholderName');
    this.cardNumber = page.locator('#CardNumber');
    this.expireMonth = page.locator('#ExpireMonth');
    this.expireYear = page.locator('#ExpireYear');
    this.cardCode = page.locator('#CardCode');
    this.paymentInfoContinue = page.locator('input[onclick="PaymentInfo.save()"]');

    this.confirmOrderButton = page.locator('input[onclick="ConfirmOrder.save()"]');
    this.orderReview = page.locator('.order-review-data');
    // Unicos enlaces dentro de las tablas del paso 6: los productos de la orden.
    this.orderedProductLinks = page.locator('#checkout-step-confirm-order table tbody a');
    this.orderTotalValue = page.locator('#checkout-step-confirm-order .order-total strong').last();
  }

  // ----------------------- Paso 1: facturacion -----------------------

  /**
   * Diligencia la direccion de entrega.
   * Solo se escriben los campos que exige la HU; los demas (Company,
   * Address2, Fax) se dejan con el valor por defecto de la tienda.
   */
  async fillBillingAddress(address: BillingAddress): Promise<this> {
    await this.waitForStep('billing');
    await this.useNewBillingAddressIfNeeded();

    await this.fill(this.billingFirstName, address.firstName);
    await this.fill(this.billingLastName, address.lastName);
    await this.fill(this.billingEmail, address.email);
    await this.fill(this.billingCompany, address.company);

    await this.selectByLabel(this.billingCountry, address.country);
    await this.selectStateProvince(address.stateProvince);

    await this.fill(this.billingCity, address.city);
    await this.fill(this.billingAddress1, address.address1);
    await this.fill(this.billingAddress2, address.address2);
    await this.fill(this.billingZip, address.zipPostalCode);
    await this.fill(this.billingPhone, address.phoneNumber);
    await this.fill(this.billingFax, address.faxNumber);
    return this;
  }

  async continueFromBilling(): Promise<this> {
    await this.click(this.billingContinue);
    await this.waitForLoaders();
    return this;
  }

  // -------------------------- Paso 2: envio --------------------------

  /** Conserva la direccion de facturacion como direccion de envio. */
  async continueFromShippingAddress(): Promise<this> {
    await this.waitForStep('shipping');
    if (await this.shippingAddressSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // La tienda preselecciona la direccion recien creada: se acepta tal cual.
      await expect(this.shippingAddressSelect).toBeEnabled();
    }
    await this.click(this.shippingContinue);
    await this.waitForLoaders();
    return this;
  }

  // ----------------------- Paso 3: metodo de envio --------------------

  /** Toma la opcion de envio indicada o la primera disponible por defecto. */
  async selectShippingMethod(methodName?: string): Promise<this> {
    await this.waitForStep('shipping-method');
    if (methodName) {
      await this.checkRadioByName(this.shippingMethodOptions, methodName, 'metodo de envio');
    } else {
      await expect(
        this.shippingMethodOptions.first(),
        'El checkout no ofrece metodos de envio',
      ).toBeVisible();
      await this.shippingMethodOptions.first().check();
    }
    await this.click(this.shippingMethodContinue);
    await this.waitForLoaders();
    return this;
  }

  // ----------------------- Paso 4: medio de pago ----------------------

  /** HU-02: seleccionar "Credit Card" como metodo de pago. */
  async selectPaymentMethod(methodName: string): Promise<this> {
    await this.waitForStep('payment-method');
    await this.checkRadioByName(this.paymentMethodOptions, methodName, 'metodo de pago');
    await this.click(this.paymentMethodContinue);
    await this.waitForLoaders();
    return this;
  }

  // ---------------------- Paso 5: datos de la tarjeta -----------------

  async fillCreditCardInformation(card: CreditCard): Promise<this> {
    await this.waitForStep('payment-info');
    await expect(
      this.creditCardType,
      'No se desplego el formulario de tarjeta de credito; revise el metodo de pago seleccionado',
    ).toBeVisible();

    await this.selectByLabel(this.creditCardType, card.brand);
    await this.fill(this.cardholderName, card.cardholderName);
    await this.fill(this.cardNumber, card.cardNumber);
    await this.selectNumericOption(this.expireMonth, card.expirationMonth, 'mes de expiracion');
    await this.selectNumericOption(this.expireYear, card.expirationYear, 'anio de expiracion');
    await this.fill(this.cardCode, card.cardCode);
    return this;
  }

  async continueFromPaymentInformation(): Promise<this> {
    await this.click(this.paymentInfoContinue);
    await this.waitForLoaders();
    return this;
  }

  // ------------------------ Paso 6: confirmacion ----------------------

  /** Resumen de direcciones, metodo de pago y metodo de envio del paso 6. */
  async orderSummary(): Promise<string> {
    return this.textOf(this.orderReview);
  }

  /** Productos listados en el detalle de la orden antes de confirmar. */
  async orderedProducts(): Promise<string[]> {
    await this.waitForStep('confirm-order');
    return (await this.orderedProductLinks.allTextContents()).map((p) => p.trim()).filter(Boolean);
  }

  /** Total a pagar mostrado en el paso de confirmacion. */
  async orderTotal(): Promise<string> {
    return this.textOf(this.orderTotalValue);
  }

  /** Verifica que el producto agregado viaje efectivamente en la orden. */
  async expectProductInOrder(productName: string): Promise<void> {
    expect(
      await this.orderedProducts(),
      'El detalle de la orden no incluye el producto agregado al carrito',
    ).toContain(productName);
  }

  /** Verifica el medio de pago con el que se va a confirmar la orden. */
  async expectPaymentMethod(methodName: string): Promise<void> {
    await expect(
      this.orderReview,
      `La orden no se esta confirmando con el metodo de pago "${methodName}"`,
    ).toContainText(methodName);
  }

  async confirmOrder(): Promise<void> {
    await this.waitForStep('confirm-order');
    await this.click(this.confirmOrderButton);
    await this.waitForLoaders();
  }

  // ---------------------------- Orquestador ---------------------------

  /** Ejecuta de principio a fin los seis pasos del checkout de la HU-02. */
  async completePurchase(
    address: BillingAddress,
    card: CreditCard,
    paymentMethod = 'Credit Card',
  ): Promise<void> {
    await this.fillBillingAddress(address);
    await this.continueFromBilling();
    await this.continueFromShippingAddress();
    await this.selectShippingMethod();
    await this.selectPaymentMethod(paymentMethod);
    await this.fillCreditCardInformation(card);
    await this.continueFromPaymentInformation();
    await this.confirmOrder();
  }

  // ------------------------------ Internos ----------------------------

  /** Espera a que la seccion del paso quede visible y operable. */
  private async waitForStep(step: CheckoutStep): Promise<void> {
    const section = this.page.locator(`#checkout-step-${step}`);
    await expect(section, `El checkout no avanzo al paso "${step}"`).toBeVisible();
  }

  /** Espera a que todos los indicadores "Loading next step..." desaparezcan. */
  private async waitForLoaders(): Promise<void> {
    const loaders = this.page.locator('.please-wait');
    const total = await loaders.count();
    for (let i = 0; i < total; i++) {
      await expect(loaders.nth(i)).toBeHidden();
    }
  }

  /** Si la cuenta ya tiene direcciones guardadas, fuerza el alta de una nueva. */
  private async useNewBillingAddressIfNeeded(): Promise<void> {
    const hasSavedAddresses = await this.billingAddressSelect
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (hasSavedAddresses) {
      await this.billingAddressSelect.selectOption({ label: 'New Address' });
    }

    await expect(
      this.billingFirstName,
      'No se desplego el formulario de nueva direccion de facturacion',
    ).toBeVisible();
  }

  /**
   * Selecciona el departamento/estado. La lista se recarga por AJAX al elegir
   * el pais; si el pais no maneja estados se conserva la opcion por defecto.
   */
  private async selectStateProvince(state: string): Promise<void> {
    const available = await this.billingState
      .locator('option', { hasText: state })
      .first()
      .waitFor({ state: 'attached', timeout: 10_000 })
      .then(() => true)
      .catch(() => false);

    if (available) {
      await this.billingState.selectOption({ label: state });
      return;
    }
    await this.billingState.selectOption({ index: 0 });
  }

  /**
   * Marca el radio button cuyo nombre accesible contiene el texto indicado.
   * Se usa el nombre accesible (no el indice) para que la prueba no dependa
   * del orden en que la tienda publique las opciones ni de sus recargos:
   * "Credit Card" encuentra igual a "Credit Card (5.00)".
   */
  private async checkRadioByName(scope: Locator, name: string, fieldName: string): Promise<void> {
    const pattern = new RegExp(escapeRegExp(name), 'i');
    const radio = scope.and(this.page.getByRole('radio', { name: pattern })).first();

    await expect(
      radio,
      `No se encontro la opcion de ${fieldName} "${name}" en el checkout`,
    ).toBeVisible();

    await radio.check();
    await expect(radio, `No se pudo seleccionar el ${fieldName} "${name}"`).toBeChecked();
  }

  /**
   * Selecciona un valor numerico en un `<select>` tolerando formatos
   * ("4" vs "04") y diferencias entre `value` y texto visible.
   */
  private async selectNumericOption(
    select: Locator,
    value: string,
    fieldName: string,
  ): Promise<void> {
    const normalized = String(Number(value));
    const options = await select
      .locator('option')
      .evaluateAll((nodes) =>
        (nodes as HTMLOptionElement[]).map((o) => ({
          value: o.value,
          text: (o.textContent ?? '').trim(),
        })),
      );

    const match = options.find(
      (o) => String(Number(o.value)) === normalized || String(Number(o.text)) === normalized,
    );

    expect(
      match,
      `El ${fieldName} "${value}" no esta disponible. Opciones: ${options.map((o) => o.text).join(', ')}`,
    ).toBeDefined();

    await select.selectOption({ value: match!.value });
  }
}
