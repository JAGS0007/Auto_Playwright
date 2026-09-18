import { test, expect } from '../src/fixtures/pages.fixture';
import { UserBuilder } from '../src/data/builders/UserBuilder';
import { EXPECTED_MESSAGES } from '../src/data/constants/checkout.data';
import { SessionStore } from '../src/utils/SessionStore';

/**
 * HU-01: Registro de usuario.
 *
 * Los `test.step` reproducen literalmente el DADO/CUANDO/ENTONCES de la
 * historia, de modo que el reporte HTML sea legible por un analista funcional
 * y sirva como evidencia de la trazabilidad HU <-> automatizacion.
 */
test.describe('HU-01 | Registro de usuario', () => {
  test('Un usuario nuevo se registra y el sistema confirma "Your registration completed"', async ({
    homePage,
    registerPage,
    registerResultPage,
  }, testInfo) => {
    const user = UserBuilder.aUser().build();
    testInfo.annotations.push({ type: 'Usuario generado', description: user.email });

    await test.step('DADO QUE ingreso a la aplicacion https://demowebshop.tricentis.com/', async () => {
      await homePage.open();
      expect(await homePage.title()).toContain('Demo Web Shop');
    });

    await test.step('CUANDO doy clic en la opcion "Register"', async () => {
      await homePage.header.goToRegister();
      await registerPage.waitUntilLoaded();
    });

    await test.step('Y/E ingreso los datos de registro', async () => {
      await registerPage.register(user);
    });

    await test.step('ENTONCES el sistema debe mostrar el mensaje "Your registration completed"', async () => {
      await registerResultPage.waitUntilLoaded();
      await registerResultPage.expectRegistrationCompleted(EXPECTED_MESSAGES.registrationCompleted);
    });

    await test.step('Y la sesion queda iniciada con la cuenta recien creada', async () => {
      await registerResultPage.header.expectUserLoggedIn(user.email);
    });

    // El usuario queda disponible para la HU-02 (ver SessionStore).
    SessionStore.saveRegisteredUser(user);
    await testInfo.attach('usuario-registrado.json', {
      body: JSON.stringify(user, null, 2),
      contentType: 'application/json',
    });
  });
});
