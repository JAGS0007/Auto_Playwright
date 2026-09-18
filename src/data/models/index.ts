/** Genero soportado por el formulario de registro de DemoWebShop. */
export type Gender = 'Male' | 'Female';

/** Usuario del e-commerce (HU-01). */
export interface User {
  gender: Gender;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/** Credenciales minimas para autenticarse (HU-02). */
export type Credentials = Pick<User, 'email' | 'password'>;

/** Direccion de facturacion/entrega solicitada en el checkout. */
export interface BillingAddress {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  stateProvince: string;
  city: string;
  address1: string;
  zipPostalCode: string;
  phoneNumber: string;
  /** Campos que la HU indica "dejar por defecto": se envian solo si se definen. */
  company?: string;
  address2?: string;
  faxNumber?: string;
}

/** Tarjetas habilitadas por la pasarela de la tienda demo. */
export type CreditCardBrand = 'Visa' | 'Master card' | 'Discover' | 'Amex';

/** Medio de pago con tarjeta de credito. */
export interface CreditCard {
  brand: CreditCardBrand;
  cardholderName: string;
  cardNumber: string;
  /** Mes de expiracion en formato numerico sin cero a la izquierda: "4". */
  expirationMonth: string;
  /** Anio de expiracion a cuatro digitos: "2039". */
  expirationYear: string;
  cardCode: string;
}

/** Producto seleccionado para la compra (HU-02). */
export interface ProductSelection {
  category: string;
  /** `undefined` cuando la categoria no tiene subcategorias. */
  subCategory?: string;
}
