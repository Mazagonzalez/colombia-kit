/** Mínimos que debe cumplir la fuente; por debajo se asume que cambió de formato o está incompleta. */
const MINIMO_MUNICIPIOS = 1000;
const MINIMO_DEPARTAMENTOS = 32;

// Caja que contiene a Colombia, con San Andrés y Leticia.
const LATITUD = { minima: -5, maxima: 17 };
const LONGITUD = { minima: -83, maxima: -66 };

const CAMPOS = [
  'cod_dpto',
  'dpto',
  'cod_mpio',
  'nom_mpio',
  'tipo_municipio',
  'longitud',
  'latitud',
] as const;

const TIPOS_MUNICIPIO = ['Municipio', 'Isla', 'Área no municipalizada'] as const;

const PALABRAS_EN_MINUSCULA = new Set(['de', 'del', 'y', 'e']);
// Solo van en minúscula después de "de" o "del": San José de la Montaña, pero María La Baja.
const ARTICULOS = new Set(['la', 'las', 'los', 'el']);

export type FilaFuente = Record<(typeof CAMPOS)[number], string>;

export interface DepartamentoDato {
  codigo: string;
  nombre: string;
  nombreOficial: string;
}

export interface MunicipioDato {
  codigo: string;
  nombre: string;
  nombreOficial: string;
  tipo: string;
  codigoDepartamento: string;
  departamento: string;
  latitud: number;
  longitud: number;
}

export interface DatosDivipola {
  departamentos: DepartamentoDato[];
  municipios: MunicipioDato[];
}

/** La fuente falló o no tiene la forma esperada: no se debe tocar ningún dato. */
export class ErrorFuente extends Error {}

/** Convierte un nombre oficial en mayúsculas a su forma legible: `VALLE DEL CAUCA` → `Valle del Cauca`. */
export function nombreLegible(oficial: string): string {
  return oficial
    .toLowerCase()
    .split(' ')
    .map((palabra, indice, palabras) => {
      const anterior = palabras[indice - 1];

      if (palabra === 'd.c.') return 'D.C.';
      if (indice > 0 && PALABRAS_EN_MINUSCULA.has(palabra)) return palabra;
      if (ARTICULOS.has(palabra) && (anterior === 'de' || anterior === 'del')) return palabra;

      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(' ');
}

function leerCoordenada(valor: string): number {
  return /^-?[0-9]+([.,][0-9]+)?$/.test(valor) ? Number(valor.replace(',', '.')) : Number.NaN;
}

function dentroDe(valor: number, { minima, maxima }: { minima: number; maxima: number }): boolean {
  return valor >= minima && valor <= maxima;
}

function problemasDeFila(fila: unknown, posicion: number): string[] {
  if (typeof fila !== 'object' || fila === null) return [`Fila ${posicion}: no es un objeto`];

  const registro = fila as Record<string, unknown>;
  const faltantes = CAMPOS.filter((campo) => typeof registro[campo] !== 'string');

  if (faltantes.length > 0) return [`Fila ${posicion}: faltan campos: ${faltantes.join(', ')}`];

  const { cod_dpto, dpto, cod_mpio, nom_mpio, tipo_municipio, latitud, longitud } =
    registro as FilaFuente;
  const problemas: string[] = [];

  if (!/^[0-9]{2}$/.test(cod_dpto)) problemas.push(`código de departamento "${cod_dpto}"`);
  if (!/^[0-9]{5}$/.test(cod_mpio)) problemas.push(`código de municipio "${cod_mpio}"`);
  if (!cod_mpio.startsWith(cod_dpto)) problemas.push(`"${cod_mpio}" no empieza por "${cod_dpto}"`);
  if (dpto.trim() === '') problemas.push('departamento vacío');
  if (nom_mpio.trim() === '') problemas.push('municipio vacío');
  if (!(TIPOS_MUNICIPIO as readonly string[]).includes(tipo_municipio)) {
    problemas.push(`tipo "${tipo_municipio}"`);
  }
  if (!dentroDe(leerCoordenada(latitud), LATITUD)) problemas.push(`latitud "${latitud}"`);
  if (!dentroDe(leerCoordenada(longitud), LONGITUD)) problemas.push(`longitud "${longitud}"`);

  return problemas.map((problema) => `Fila ${posicion} (${cod_mpio}): ${problema}`);
}

/** Comprueba que la respuesta tenga la forma esperada. Lanza {@link ErrorFuente} si no la tiene. */
export function validarFuente(respuesta: unknown): FilaFuente[] {
  if (!Array.isArray(respuesta)) throw new ErrorFuente('La respuesta no es una lista de filas.');

  const problemas = respuesta.flatMap((fila, indice) => problemasDeFila(fila, indice + 1));

  if (problemas.length > 0) {
    const muestra = problemas.slice(0, 10).join('\n- ');

    throw new ErrorFuente(`La fuente tiene ${problemas.length} problemas:\n- ${muestra}`);
  }

  const filas = respuesta as FilaFuente[];
  const nombresPorDepartamento = new Map<string, Set<string>>();

  for (const { cod_dpto, dpto } of filas) {
    nombresPorDepartamento.set(
      cod_dpto,
      (nombresPorDepartamento.get(cod_dpto) ?? new Set()).add(dpto),
    );
  }

  if (filas.length < MINIMO_MUNICIPIOS) {
    throw new ErrorFuente(`La fuente solo trae ${filas.length} municipios.`);
  }
  if (nombresPorDepartamento.size < MINIMO_DEPARTAMENTOS) {
    throw new ErrorFuente(`La fuente solo trae ${nombresPorDepartamento.size} departamentos.`);
  }
  if (new Set(filas.map((fila) => fila.cod_mpio)).size !== filas.length) {
    throw new ErrorFuente('La fuente trae códigos de municipio repetidos.');
  }

  for (const [codigo, nombres] of nombresPorDepartamento) {
    if (nombres.size > 1) {
      throw new ErrorFuente(`El departamento ${codigo} tiene varios nombres: ${[...nombres]}`);
    }
  }

  return filas;
}

function porCodigo(a: { codigo: string }, b: { codigo: string }): number {
  return a.codigo < b.codigo ? -1 : 1;
}

/** Convierte las filas validadas al formato de `data/divipola.json`. */
export function transformar(filas: FilaFuente[]): DatosDivipola {
  const departamentos = new Map<string, DepartamentoDato>();

  for (const { cod_dpto, dpto } of filas) {
    departamentos.set(cod_dpto, {
      codigo: cod_dpto,
      nombre: nombreLegible(dpto),
      nombreOficial: dpto,
    });
  }

  const municipios = filas.map((fila) => ({
    codigo: fila.cod_mpio,
    nombre: nombreLegible(fila.nom_mpio),
    nombreOficial: fila.nom_mpio,
    tipo: fila.tipo_municipio,
    codigoDepartamento: fila.cod_dpto,
    departamento: nombreLegible(fila.dpto),
    latitud: leerCoordenada(fila.latitud),
    longitud: leerCoordenada(fila.longitud),
  }));

  return {
    departamentos: [...departamentos.values()].sort(porCodigo),
    municipios: municipios.sort(porCodigo),
  };
}

/** Serializa con un registro por línea, para que los PR del robot muestren diferencias legibles. */
export function serializarDatos({ departamentos, municipios }: DatosDivipola): string {
  const lista = (registros: unknown[]): string =>
    registros.map((registro) => `    ${JSON.stringify(registro)}`).join(',\n');

  return `{\n  "departamentos": [\n${lista(departamentos)}\n  ],\n  "municipios": [\n${lista(municipios)}\n  ]\n}\n`;
}
