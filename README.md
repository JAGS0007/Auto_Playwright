# Reto Técnico Playwright — Choucair

Automatización E2E de **DemoWebShop** (https://demowebshop.tricentis.com/) con
**Playwright + TypeScript** aplicando el patrón **Page Object Model**.

| HU | Escenario | Criterio de aceptación verificado |
|----|-----------|-----------------------------------|
| HU-01 | Registro de usuario | `Your registration completed` |
| HU-02 | Proceso de compra con tarjeta Visa | `Your order has been successfully processed!` |

---

## 1. Puesta en marcha

```bash
npm install
npx playwright install chromium
```

Ejecución:

```bash
npm test
```

| Comando | Qué hace |
|---------|----------|
| `npm test` | Ejecuta HU-01 y luego HU-02 |
| `npm run test:hu01` | Solo el registro |
| `npm run test:hu02` | La compra (Playwright ejecuta antes la HU-01) |
| `npm run test:headed` | Con navegador visible |
| `npm run test:ui` | Modo UI interactivo |
| `npm run report` | Abre el reporte HTML |
| `npm run typecheck` | Verificación estática sin ejecutar pruebas |

### Si `npx playwright install` no puede descargar el navegador

En redes corporativas que bloquean el CDN de Playwright, se reutiliza un navegador
ya instalado copiando `.env.example` a `.env`:

```env
BROWSER_CHANNEL=chrome   # o msedge
VIDEO=off                # la grabación de video requiere el binario ffmpeg
```

---

## 2. Arquitectura

```
src/
├── core/
│   ├── BasePage.ts            Clase base del POM: navegación, esperas, interacciones
│   └── global-setup.ts        Limpia el estado compartido antes de cada corrida
├── components/                Fragmentos de UI presentes en varias pantallas
│   ├── HeaderComponent.ts     Sesión y carrito
│   ├── TopMenuComponent.ts    Categorías y subcategorías
│   └── NotificationBarComponent.ts
├── pages/                     Una clase por pantalla
│   ├── HomePage.ts            RegisterPage.ts        RegisterResultPage.ts
│   ├── LoginPage.ts           CategoryPage.ts        ProductDetailPage.ts
│   └── ShoppingCartPage.ts    CheckoutPage.ts        CheckoutCompletedPage.ts
├── data/
│   ├── models/                Contratos de dominio (User, BillingAddress, CreditCard…)
│   ├── builders/UserBuilder.ts        Builder fluido con datos dinámicos
│   └── constants/checkout.data.ts     Datos fijos exigidos por la HU
├── fixtures/pages.fixture.ts  Inyección de dependencias de las page objects
└── utils/SessionStore.ts      Puente de estado HU-01 → HU-02

tests/
├── hu01-registro-usuario.spec.ts
└── hu02-proceso-compra.spec.ts
```

### Decisiones de diseño

**1. Los tests hablan el idioma del negocio, no del navegador.**
Ningún spec importa `@playwright/test` para localizar elementos ni conoce un
selector. Cada `test.step` reproduce literalmente el DADO / CUANDO / ENTONCES de
la historia, de modo que el reporte HTML sirve como evidencia trazable frente al
analista funcional.

**2. `BasePage` concentra la mecánica; las páginas concentran el negocio.**
Navegación, esperas web-first, `fill` que ignora campos opcionales, selección
por etiqueta visible y captura de evidencias viven una sola vez. Cada página
declara su `path` y un `pageIdentifier` que confirma que cargó — con mensajes de
error en español que explican qué se esperaba.

**3. Componentes separados de páginas.**
Cabecera, menú y barra de notificaciones se repiten en todas las pantallas; se
modelan como componentes y se exponen desde `BasePage`, evitando duplicarlos en
nueve page objects.

**4. Inyección de dependencias por fixtures.**
Los specs reciben las page objects ya construidas. Cambiar un constructor no
obliga a tocar una sola prueba.

**5. El encadenamiento HU-01 → HU-02 es explícito.**

```ts
{ name: 'HU-02-Compra', dependencies: ['HU-01-Registro'] }
```

Playwright garantiza el orden. El usuario creado se persiste con `SessionStore` y
la HU-02 lo recupera vía el fixture `registeredUser`. No hay orden implícito entre
archivos ni dependencia de cómo el runner ordene los specs.

**6. Datos de prueba: fijos solo donde la HU lo exige.**
La tarjeta Visa de Barbara Gordon está congelada porque es un criterio de
aceptación literal. El usuario, la dirección y el teléfono se generan con Faker:
el registro exige un correo inédito en cada ejecución, y los datos dinámicos
impiden que la prueba dependa de un dataset preexistente.

**7. Cero `waitForTimeout`.**
El One Page Checkout resuelve seis pasos por AJAX sobre la misma URL. Cada paso
espera a que el indicador `Loading next step...` desaparezca y a que la sección
siguiente sea visible. Toda espera es condicional, nunca temporal.

**8. Selectores resistentes.**
Los radio buttons se ubican por **nombre accesible**, no por índice ni por id
posicional: `Credit Card` encuentra igual a `Credit Card (5.00)` aunque la tienda
cambie el recargo o el orden de los medios de pago. La expiración de la tarjeta
se resuelve tolerando `4` o `04` y diferencias entre `value` y texto visible.

**9. Flujos condicionales, como pide la HU.**
`"en caso de existir, en su Subcategoría"` está implementado: el test consulta
`hasSubCategories()` y navega por subcategoría solo si existe. El menú se
despliega por `:hover` de CSS y, si no responde, se degrada a la grilla interna
de la categoría.

---

## 3. Cobertura de los criterios de aceptación

### HU-01 — Registro

| Paso de la HU | Verificación automatizada |
|---------------|---------------------------|
| Ingreso a la aplicación | Título contiene `Demo Web Shop` |
| Clic en `Register` | Se despliega el formulario de registro |
| Ingreso de datos | Género, nombre, apellido, correo único y contraseña |
| **Mensaje esperado** | `.result` = `Your registration completed` |
| Verificación adicional | La sesión queda iniciada con la cuenta creada |

### HU-02 — Compra

| Paso de la HU | Verificación automatizada |
|---------------|---------------------------|
| Autenticación | Usuario de la HU-01; la cabecera muestra su correo |
| Categoría y subcategoría | `Computers > Notebooks`, validando que existan productos |
| Producto al carrito | Notificación `The product has been added…` y contador del carrito en 1 |
| Carrito y `Checkout` | El producto figura en el carrito; se aceptan los términos |
| Datos de entrega | First/Last name, Email, Country, State, City, Address1, Zip, Phone. El resto se deja por defecto |
| Método de pago | `Credit Card` |
| Datos de la tarjeta | Visa · Barbara Gordon · 4485564059489345 · 04/2039 · 123 |
| Confirmación | Se valida que la orden lleve el producto y el medio de pago correctos |
| **Mensaje esperado** | `Your order has been successfully processed!` |
| Evidencia extra | Número de orden y total anexados al reporte |

> La subcategoría `Notebooks` se eligió deliberadamente: al ser producto físico,
> el checkout incluye los pasos de dirección y método de envío, ejercitando el
> flujo completo. Un producto digital los omitiría.

---

## 4. Reportes y evidencias

| Artefacto | Ubicación |
|-----------|-----------|
| Reporte HTML | `reports/html` (`npm run report`) |
| JUnit XML para CI | `reports/junit/results.xml` |
| Screenshot de fallo | `test-results/**` |
| Trace navegable | `npx playwright show-trace <ruta>` |

Screenshot, video y trace se retienen **solo ante fallo**: evidencia útil sin
inflar la ejecución exitosa.
