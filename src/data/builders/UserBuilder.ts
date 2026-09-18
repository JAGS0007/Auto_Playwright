import { faker } from '@faker-js/faker';
import type { Gender, User } from '../models';

/**
 * Builder de usuarios para la HU-01.
 *
 * El registro exige un correo inedito en cada ejecucion; por eso los datos se
 * generan dinamicamente y el email lleva un sufijo unico (timestamp + aleatorio)
 * que evita colisiones incluso con workers en paralelo o reintentos.
 */
export class UserBuilder {
  private user: User;

  private constructor() {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    this.user = {
      gender: faker.helpers.arrayElement<Gender>(['Male', 'Female']),
      firstName,
      lastName,
      email: UserBuilder.uniqueEmail(firstName, lastName),
      password: `Qa${faker.string.alphanumeric(8)}#2026`,
    };
  }

  /** Punto de entrada fluido: `UserBuilder.aUser().build()`. */
  static aUser(): UserBuilder {
    return new UserBuilder();
  }

  withGender(gender: Gender): this {
    this.user.gender = gender;
    return this;
  }

  withFirstName(firstName: string): this {
    this.user.firstName = firstName;
    return this;
  }

  withLastName(lastName: string): this {
    this.user.lastName = lastName;
    return this;
  }

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withPassword(password: string): this {
    this.user.password = password;
    return this;
  }

  build(): User {
    return { ...this.user };
  }

  private static uniqueEmail(firstName: string, lastName: string): string {
    const slug = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, '');
    const stamp = `${Date.now().toString(36)}${faker.string.alphanumeric(4).toLowerCase()}`;
    return `${slug}.${stamp}@choucairtest.com`;
  }
}
