import { DEPARTAMENTOS } from './generated/departamentos';
import { MUNICIPIOS } from './generated/municipios';
import type { CodigoDepartamento, CodigoMunicipio, Departamento, Municipio } from './tipos';

export { departamentos } from './departamentos';
export { buscarMunicipio, municipios } from './municipios';
export type {
  CodigoDepartamento,
  CodigoMunicipio,
  Departamento,
  Municipio,
  TipoMunicipio,
} from './tipos';

/**
 * Busca un departamento (código de 2 dígitos) o un municipio (código de 5 dígitos).
 *
 * El código debe ser texto: como número se perdería el cero inicial de códigos como `05001`.
 *
 * @param codigo Código DIVIPOLA.
 * @returns El departamento o municipio, o `null` si el código no existe.
 *
 * @example
 * porCodigo('05')?.nombre; // 'Antioquia'
 * porCodigo('05001')?.nombre; // 'Medellín'
 * porCodigo('99999'); // null
 */
export function porCodigo(codigo: CodigoDepartamento): Departamento;
export function porCodigo(codigo: CodigoMunicipio): Municipio;
export function porCodigo(codigo: string): Departamento | Municipio | null;
export function porCodigo(codigo: string): Departamento | Municipio | null {
  const registros: readonly (Departamento | Municipio)[] =
    codigo?.length === 2 ? DEPARTAMENTOS : MUNICIPIOS;

  return registros.find((registro) => registro.codigo === codigo) ?? null;
}
