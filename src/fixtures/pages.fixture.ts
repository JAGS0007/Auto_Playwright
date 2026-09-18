import { test as base, expect } from '@playwright/test';
import {
  CategoryPage,
  CheckoutCompletedPage,
  CheckoutPage,
  HomePage,
  LoginPage,
  ProductDetailPage,
  RegisterPage,
  RegisterResultPage,
  ShoppingCartPage,
} from '../pages';
import type { User } from '../data/models';
import { SessionStore } from '../utils/SessionStore';

/**
 * Inyeccion de dependencias del framework.
 *
 * Los specs reciben las page objects ya construidas; asi ningun test crea
 * objetos ni conoce `page`. Cambiar el constructor de una POM no obliga a
 * tocar una sola prueba.
 */
type PageObjects = {
  homePage: HomePage;
  registerPage: RegisterPage;
  registerResultPage: RegisterResultPage;
  loginPage: LoginPage;
  categoryPage: CategoryPage;
  productDetailPage: ProductDetailPage;
  shoppingCartPage: ShoppingCartPage;
  checkoutPage: CheckoutPage;
  checkoutCompletedPage: CheckoutCompletedPage;
};

type SharedData = {
  /** Usuario creado en la HU-01 y reutilizado por la HU-02. */
  registeredUser: User;
};

export const test = base.extend<PageObjects & SharedData>({
  homePage: async ({ page }, use) => use(new HomePage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  registerResultPage: async ({ page }, use) => use(new RegisterResultPage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  categoryPage: async ({ page }, use) => use(new CategoryPage(page)),
  productDetailPage: async ({ page }, use) => use(new ProductDetailPage(page)),
  shoppingCartPage: async ({ page }, use) => use(new ShoppingCartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  checkoutCompletedPage: async ({ page }, use) => use(new CheckoutCompletedPage(page)),

  registeredUser: async ({}, use, testInfo) => {
    const user = SessionStore.readRegisteredUser();
    testInfo.annotations.push({ type: 'Usuario HU-01', description: user.email });
    await use(user);
  },
});

export { expect };
