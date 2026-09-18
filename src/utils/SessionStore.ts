import fs from 'node:fs';
import path from 'node:path';
import type { User } from '../data/models';

/**
 * Puente de estado entre historias de usuario.
 *
 * La HU-02 exige autenticarse con "el usuario registrado en la HU-01". Como
 * cada spec corre en su propio worker (y puede ejecutarse en otra maquina del
 * shard), el usuario creado se persiste en disco y la HU-02 lo recupera.
 * Playwright garantiza el orden mediante `dependencies` en playwright.config.ts.
 */
export class SessionStore {
  private static readonly dir = path.resolve(process.cwd(), '.session');
  private static readonly file = path.join(SessionStore.dir, 'registered-user.json');

  static saveRegisteredUser(user: User): void {
    fs.mkdirSync(this.dir, { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(user, null, 2), 'utf-8');
  }

  static readRegisteredUser(): User {
    if (!fs.existsSync(this.file)) {
      throw new Error(
        'No se encontro el usuario de la HU-01. Ejecute primero el proyecto ' +
          '"HU-01-Registro" (npm test lo encadena automaticamente).',
      );
    }
    return JSON.parse(fs.readFileSync(this.file, 'utf-8')) as User;
  }

  static clear(): void {
    fs.rmSync(this.dir, { recursive: true, force: true });
  }
}
