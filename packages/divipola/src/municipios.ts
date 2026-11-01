import { MUNICIPIOS } from './generated/municipios';
import { normalizar } from './normalizar';
import type { Municipio } from './tipos';

export type { CodigoDepartamento, CodigoMunicipio, Municipio, TipoMunicipio } from './tipos';

let nombresNormalizados: readonly string[] | undefined;

/**
 * Lista los municipios de Colombia, ordenados por código.
 *
 * @param codigoDepartamento Código de 2 dígitos para filtrar por departamento.
 * @returns Los municipios; una lista vacía si el departamento no existe.
 *
 * @example
 * municipios('88').map((m) => m.nombre); // ['San Andrés', 'Providencia']
 */
export function municipios(codigoDepartamento?: string): readonly Municipio[] {
  if (codigoDepartamento === undefined) return MUNICIPIOS;

  return MUNICIPIOS.filter((municipio) => municipio.codigoDepartamento === codigoDepartamento);
}

/**
 * Busca municipios por nombre, sin distinguir mayúsculas, tildes ni puntuación.
 *
 * Primero van las coincidencias exactas, después las de palabras completas y por último las
 * parciales. Dentro de cada grupo se ordenan por código. Varios municipios pueden compartir nombre.
 *
 * @param nombre Nombre o parte del nombre.
 * @returns Los municipios encontrados; una lista vacía si no hay ninguno o la búsqueda está vacía.
 *
 * @example
 * buscarMunicipio('cali')[0]?.nombre; // 'Santiago de Cali'
 * buscarMunicipio('MEDELLIN')[0]?.codigo; // '05001'
 */
export function buscarMunicipio(nombre: string): readonly Municipio[] {
  if (typeof nombre !== 'string') return [];

  const busqueda = normalizar(nombre);

  if (busqueda === '') return [];

  nombresNormalizados ??= MUNICIPIOS.map((municipio) => normalizar(municipio.nombreOficial));

  const exactos: Municipio[] = [];
  const palabrasCompletas: Municipio[] = [];
  const parciales: Municipio[] = [];

  MUNICIPIOS.forEach((municipio, indice) => {
    const candidato = nombresNormalizados?.[indice] ?? '';

    if (candidato === busqueda) {
      exactos.push(municipio);
    } else if (` ${candidato} `.includes(` ${busqueda} `)) {
      palabrasCompletas.push(municipio);
    } else if (candidato.includes(busqueda)) {
      parciales.push(municipio);
    }
  });

  return [...exactos, ...palabrasCompletas, ...parciales];
}
