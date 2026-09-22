import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'https://demowebshop.tricentis.com/';
const IS_CI = !!process.env.CI;

/**
 * Navegador a utilizar. Sin valor se usa el Chromium empaquetado por
 * Playwright; con `BROWSER_CHANNEL=chrome|msedge` se reutiliza el navegador ya
 * instalado en la maquina (util en redes donde el CDN de Playwright esta
 * bloqueado y `npx playwright install` no puede descargar binarios).
 */
const BROWSER_CHANNEL = process.env.BROWSER_CHANNEL as 'chrome' | 'msedge' | undefined;

/** El video requiere el binario ffmpeg de Playwright: `VIDEO=off` lo desactiva. */
const VIDEO_ENABLED = process.env.VIDEO !== 'off';

/**
 * Configuracion del reto tecnico Playwright - Choucair.
 *
 * El encadenamiento HU-01 -> HU-02 se resuelve con `dependencies`: ejecutar
 * `HU-02-Compra` obliga a Playwright a correr antes `HU-01-Registro`, que es
 * quien crea el usuario. No hay orden implicito ni `describe.serial` entre
 * archivos: la dependencia es explicita y verificable.
 */
export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  /* Las HU son un flujo encadenado: se ejecutan en orden y sin paralelismo. */
  fullyParallel: false,
  workers: 1,

  /* La tienda demo es publica y ocasionalmente lenta: se permiten reintentos. */
  retries: IS_CI ? 2 : 1,
  forbidOnly: IS_CI,

  timeout: 120_000,
  expect: { timeout: 15_000 },

  globalSetup: require.resolve('./src/core/global-setup'),

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
  ],

  use: {
    baseURL: BASE_URL,
    headless: process.env.HEADLESS !== 'false',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
    locale: 'en-US',
    testIdAttribute: 'data-testid',

    /*
     * Evidencia solo ante un fallo REAL (bug): `only-on-failure` dispara la
     * captura cuando una asercion no se cumple. Los escenarios negativos que
     * verifican un rechazo esperado terminan en verde y, por diseno, no
     * generan captura: el rechazo es el comportamiento correcto, no un bug.
     */
    screenshot: 'only-on-failure',
    video: VIDEO_ENABLED ? 'retain-on-failure' : 'off',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'HU-01-Registro',
      testMatch: /hu01-.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel: BROWSER_CHANNEL },
    },
    {
      name: 'HU-02-Compra',
      testMatch: /hu02-.*\.spec\.ts/,
      dependencies: ['HU-01-Registro'],
      use: { ...devices['Desktop Chrome'], channel: BROWSER_CHANNEL },
    },
  ],
});
