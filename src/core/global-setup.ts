import { SessionStore } from '../utils/SessionStore';

/**
 * Limpia el estado compartido antes de cada ejecucion completa para que la
 * HU-02 jamas reutilice por accidente un usuario de una corrida anterior.
 */
export default function globalSetup(): void {
  SessionStore.clear();
}
