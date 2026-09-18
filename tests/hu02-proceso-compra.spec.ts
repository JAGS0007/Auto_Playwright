import { test } from '../src/fixtures/pages.fixture';
import {
  EXPECTED_MESSAGES,
  PRODUCT_TO_BUY,
  VISA_CARD,
  buildBillingAddress,
} from '../src/data/constants/checkout.data';

/**
 * HU-02: Proceso de compra de extremo a extremo.
 *
 * El usuario proviene de la HU-01 mediante el fixture `registeredUser`;
 * el orden lo garantiza `dependencies` en playwright.config.ts.
 */
test.describe('HU-02 | Proceso de compra', () => {
  test('Compra completa con tarjeta de credito Visa hasta la confirmacion de la orden', async ({
    registeredUser,
    homePage,
    loginPage,
    categoryPage,
    productDetailPage,
    shoppingCartPage,
    checkoutPage,
    checkoutCompletedPage,
  }, testInfo) => {
    const billingAddress = buildBillingAddress(registeredUser);
    let purchasedProduct = '';

    await test.step('DADO QUE ingreso a la aplicacion https://demowebshop.tricentis.com/', async () => {
      await homePage.open();
    });

    await test.step(`CUANDO me autentico con el usuario registrado en la HU-01 (${registeredUser.email})`, async () => {
      await homePage.header.goToLogin();
      await loginPage.waitUntilLoaded();
      await loginPage.login(registeredUser);
      await homePage.header.expectUserLoggedIn(registeredUser.email);
    });

    await test.step(`Y doy clic en la categoria "${PRODUCT_TO_BUY.category}" y en su subcategoria "${PRODUCT_TO_BUY.subCategory}"`, async () => {
      const { category, subCategory } = PRODUCT_TO_BUY;

      if (subCategory && (await homePage.topMenu.hasSubCategories(category))) {
        await homePage.topMenu.openSubCategory(category, subCategory);
      } else {
        await homePage.topMenu.openCategory(category);
      }

      await categoryPage.waitUntilLoaded();
      await categoryPage.expectProductsAvailable();
    });

    await test.step('Y selecciono un producto y lo agrego al carrito', async () => {
      await categoryPage.openFirstProduct();
      await productDetailPage.waitUntilLoaded();

      purchasedProduct = await productDetailPage.addToCart();
      testInfo.annotations.push({ type: 'Producto comprado', description: purchasedProduct });

      await productDetailPage.notification.expectSuccessMessage(EXPECTED_MESSAGES.productAddedToCart);
      await productDetailPage.notification.dismiss();
      await productDetailPage.header.expectCartItemsCount(1);
    });

    await test.step('Y/E ingreso al carrito y doy clic en "Checkout"', async () => {
      await productDetailPage.header.goToShoppingCart();
      await shoppingCartPage.waitUntilLoaded();
      await shoppingCartPage.expectNotEmpty();
      await shoppingCartPage.expectProductInCart(purchasedProduct);
      await shoppingCartPage.proceedToCheckout();
      await checkoutPage.waitUntilLoaded();
    });

    await test.step('Y/E ingreso los datos solicitados para la entrega y dejo los demas por defecto', async () => {
      await checkoutPage.fillBillingAddress(billingAddress);
      await checkoutPage.continueFromBilling();
      await checkoutPage.continueFromShippingAddress();
      await checkoutPage.selectShippingMethod();
    });

    await test.step('Y selecciono "Credit Card" como metodo de pago', async () => {
      await checkoutPage.selectPaymentMethod('Credit Card');
    });

    await test.step('Y completo la informacion de pago (Visa - Barbara Gordon - 04/2039)', async () => {
      await checkoutPage.fillCreditCardInformation(VISA_CARD);
      await checkoutPage.continueFromPaymentInformation();
    });

    await test.step('Y confirmo la orden', async () => {
      await checkoutPage.expectProductInOrder(purchasedProduct);
      await checkoutPage.expectPaymentMethod('Credit Card');
      testInfo.annotations.push({
        type: 'Total de la orden',
        description: await checkoutPage.orderTotal(),
      });
      await checkoutPage.confirmOrder();
    });

    await test.step('ENTONCES el sistema debe mostrar "Your order has been successfully processed!"', async () => {
      await checkoutCompletedPage.waitUntilLoaded();
      await checkoutCompletedPage.expectOrderProcessed(EXPECTED_MESSAGES.orderProcessed);

      const orderNumber = await checkoutCompletedPage.orderNumberValue();
      if (orderNumber) {
        testInfo.annotations.push({ type: 'Numero de orden', description: orderNumber });
      }
    });
  });
});
