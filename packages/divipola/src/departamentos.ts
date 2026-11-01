import { DEPARTAMENTOS } from './generated/departamentos';
import type { Departamento } from './tipos';

export type { CodigoDepartamento, Departamento } from './tipos';

/**
 * Lista los departamentos de Colombia, ordenados por código.
 *
 * Importar esta función desde `@colombia-kit/divipola/departamentos` no carga los municipios.
 *
 * @returns Los departamentos, incluido Bogotá, D.C.
 *
 * @example
 * departamentos()[0]; // { codigo: '05', nombre: 'Antioquia', nombreOficial: 'ANTIOQUIA' }
 */
export function departamentos(): readonly Departamento[] {
  return DEPARTAMENTOS;
}
