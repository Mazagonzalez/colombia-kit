import type { CodigoDepartamento, CodigoMunicipio } from './generated/codigos';

export type { CodigoDepartamento, CodigoMunicipio };

/** Clasificación del municipio según el DANE. */
export type TipoMunicipio = 'Municipio' | 'Isla' | 'Área no municipalizada';

/** Un departamento de Colombia. Bogotá, D.C. tiene su propio código, igual que en DIVIPOLA. */
export interface Departamento {
  /** Código DIVIPOLA de 2 dígitos. */
  readonly codigo: CodigoDepartamento;
  /** Nombre legible, por ejemplo `"Valle del Cauca"`. */
  readonly nombre: string;
  /** Nombre tal como lo publica el DANE, por ejemplo `"VALLE DEL CAUCA"`. */
  readonly nombreOficial: string;
}

/** Un municipio de Colombia. */
export interface Municipio {
  /** Código DIVIPOLA de 5 dígitos. */
  readonly codigo: CodigoMunicipio;
  /** Nombre legible, por ejemplo `"Medellín"`. */
  readonly nombre: string;
  /** Nombre tal como lo publica el DANE, por ejemplo `"MEDELLÍN"`. */
  readonly nombreOficial: string;
  readonly tipo: TipoMunicipio;
  readonly codigoDepartamento: CodigoDepartamento;
  /** Nombre legible del departamento. */
  readonly departamento: string;
  readonly latitud: number;
  readonly longitud: number;
}
