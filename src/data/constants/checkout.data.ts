import { faker } from '@faker-js/faker';
import type { BillingAddress, CreditCard, ProductSelection, User } from '../models';

/**
 * Datos de prueba de la HU-02.
 *
 * Los valores fijos son los EXIGIDOS literalmente por el criterio de
 * aceptacion (tarjeta Visa de Barbara Gordon); el resto se genera para no
 * acoplar la prueba a un dataset estatico.
 */

/** Tarjeta de credito indicada textualmente en la HU-02. */
export const VISA_CARD: Readonly<CreditCard> = Object.freeze({
  brand: 'Visa',
  cardholderName: 'Barbara Gordon',
  cardNumber: '4485564059489345',
  expirationMonth: '4',
  expirationYear: '2039',
  cardCode: '123',
});

/**
 * Categoria y subcategoria a recorrer.
 * "Computers > Notebooks" garantiza producto fisico -> el checkout incluye
 * los pasos de envio, que es el flujo completo que pide la HU.
 */
export const PRODUCT_TO_BUY: Readonly<ProductSelection> = Object.freeze({
  category: 'Computers',
  subCategory: 'Notebooks',
});

/** Mensajes esperados por los criterios de aceptacion (ENTONCES). */
export const EXPECTED_MESSAGES = Object.freeze({
  registrationCompleted: 'Your registration completed',
  orderProcessed: 'Your order has been successfully processed!',
  productAddedToCart: 'The product has been added to your shopping cart',
});

/**
 * Construye la direccion de entrega a partir del usuario registrado en HU-01,
 * de modo que los datos del checkout sean coherentes con la cuenta.
 * Los campos no solicitados por la HU se omiten para que la tienda
 * conserve sus valores por defecto.
 */
export function buildBillingAddress(user: User): BillingAddress {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    country: 'United States',
    stateProvince: 'Florida',
    city: faker.location.city(),
    address1: faker.location.streetAddress(),
    zipPostalCode: faker.location.zipCode('#####'),
    phoneNumber: faker.string.numeric(10),
  };
}
