import { TABLA_NORMALIZACION } from './generated/normalizacion';
import { VIAS, type Cuadrante, type TipoVia } from './generated/vias';

export type { Cuadrante, TipoVia };

/** Una dirección separada en sus partes. Los campos opcionales solo aparecen si la dirección los trae. */
export interface Direccion {
  tipoVia: TipoVia;
  /** Número de la vía, o su nombre en vías como `Avenida El Dorado`. */
  numeroVia: string;
  letraVia?: string;
  bisVia?: boolean;
  /** Letra después de Bis, como la `A` de `Calle 39 Bis A`. */
  letraBisVia?: string;
  cuadranteVia?: Cuadrante;
  numeroCruce: string;
  letraCruce?: string;
  bisCruce?: boolean;
  letraBisCruce?: string;
  cuadranteCruce?: Cuadrante;
  /** Número de la placa. Conserva los ceros (`05`) y puede traer letra (`20A`) o rango (`48/50`). */
  placa: string;
  /** Lo que sigue a la placa, con las palabras conocidas normalizadas: `Apartamento 301 Torre 2`. */
  complemento?: string;
}

/** Opciones de {@link formatearDireccion}. */
export interface OpcionesFormato {
  /** `corto` usa abreviaturas (`Cra 7A # 32-16`) y `largo`, nombres completos (`Carrera 7 A # 32 - 16`). */
  estilo?: 'corto' | 'largo';
}

interface Token {
  texto: string;
  normal: string;
  inicio: number;
  fin: number;
}

interface Segmento {
  numero: string;
  letra?: string;
  bis?: boolean;
  letraBis?: string;
  cuadrante?: Cuadrante;
}

// Números, palabras o un signo suelto. Por eso `45A` y `Cra7` se separan solos.
const TOKEN = /[0-9]+|[\p{L}\p{M}]+|\S/gu;
const PALABRA_COMPLEMENTO = /([\p{L}\p{M}]+)(\.?)(?=([0-9\p{L}]?))/gu;
const SOLO_DIGITOS = /^[0-9]+$/;
const LETRA = /^[a-z]{1,2}$/;
const LETRA_Y_NORTE = /^[a-z]n$/;
const LETRA_DE_PLACA = /^[a-z]$/;
const PALABRA = /^[\p{L}\p{M}]+$/u;

const MAXIMO_DIGITOS_VIA = 3;
const MAXIMO_DIGITOS_PLACA = 4;
const MAXIMO_PALABRAS_TIPO_VIA = 2;

const SIGNOS_DE_ORDINAL = new Set(['°', 'º']);
const SIGNOS_ENTRE_VIA_Y_CRUCE = new Set(['.', ',', ':', '°', 'º']);
const CONECTORES_DE_NOMBRE = new Set(['de', 'del']);

const MARCADORES = new Set<string>(VIAS.marcadores);
const GUIONES = new Set<string>(VIAS.guiones);
const SIGNOS_DE_BORDE = new Set<string>([...VIAS.guiones, ',', ';', ':', '.', '/']);

function crearIndice<T extends { nombre: string; variantes: string[] }>(
  lista: T[],
): Map<string, T> {
  return new Map(lista.flatMap((item) => item.variantes.map((v): [string, T] => [v, item])));
}

const TIPOS_VIA = crearIndice(VIAS.tiposVia);
const CUADRANTES = crearIndice(VIAS.cuadrantes);
const COMPLEMENTOS = crearIndice(VIAS.complementos);
const CORTOS_DE_COMPLEMENTO = new Map(VIAS.complementos.map((c) => [c.nombre, c.corto]));

function normalizarPalabra(texto: string): string {
  let resultado = '';

  for (const caracter of texto) {
    resultado += TABLA_NORMALIZACION[caracter] ?? caracter;
  }

  return resultado;
}

function separarTokens(texto: string): Token[] {
  return [...texto.matchAll(TOKEN)].map((coincidencia) => {
    const [token] = coincidencia;
    const inicio = coincidencia.index;

    return { texto: token, normal: normalizarPalabra(token), inicio, fin: inicio + token.length };
  });
}

function esMarcador(token: Token | undefined): boolean {
  return token !== undefined && MARCADORES.has(token.normal);
}

function esNumero(token: Token | undefined, maximo: number): token is Token {
  return token !== undefined && SOLO_DIGITOS.test(token.texto) && token.texto.length <= maximo;
}

function esGuion(token: Token | undefined): boolean {
  return token !== undefined && GUIONES.has(token.texto);
}

function leerTipoVia(tokens: Token[]): { tipo: TipoVia; indice: number } | null {
  let frase = '';
  let palabras = 0;
  let encontrado: { tipo: TipoVia; indice: number } | null = null;

  for (const [indice, token] of tokens.entries()) {
    if (token.texto === '.') continue;
    if (palabras === MAXIMO_PALABRAS_TIPO_VIA) break;

    frase = palabras === 0 ? token.normal : `${frase} ${token.normal}`;
    palabras += 1;

    const tipo = TIPOS_VIA.get(frase);

    if (tipo !== undefined) encontrado = { tipo: tipo.nombre as TipoVia, indice: indice + 1 };
  }

  if (encontrado === null) return null;

  return {
    tipo: encontrado.tipo,
    indice: tokens[encontrado.indice]?.texto === '.' ? encontrado.indice + 1 : encontrado.indice,
  };
}

/**
 * Lee un número con su letra, Bis y cuadrante. En la vía, una `N` suelta es Norte solo si después
 * viene un marcador (`Av 2N # 10-70`); si no, es el marcador de número (`Cra 9 N 5-56`).
 */
function leerSegmento(
  tokens: Token[],
  inicio: number,
  enVia: boolean,
): { segmento: Segmento; indice: number } | null {
  const numero = tokens[inicio];

  if (!esNumero(numero, MAXIMO_DIGITOS_VIA)) return null;

  const segmento: Segmento = { numero: numero.texto };
  let indice = inicio + 1;

  while (SIGNOS_DE_ORDINAL.has(tokens[indice]?.texto ?? '')) indice += 1;

  for (let token = tokens[indice]; token !== undefined; token = tokens[indice]) {
    const siguienteEsMarcador = esMarcador(tokens[indice + 1]);
    const cuadrante = CUADRANTES.get(token.normal);

    if (token.normal === 'bis' && segmento.bis === undefined) {
      segmento.bis = true;
    } else if (cuadrante !== undefined && segmento.cuadrante === undefined) {
      if (enVia && token.normal === 'n' && !siguienteEsMarcador) break;

      segmento.cuadrante = cuadrante.nombre as Cuadrante;
    } else if (MARCADORES.has(token.normal) || !LETRA.test(token.normal)) {
      break;
    } else if (segmento.bis === true && segmento.letraBis === undefined) {
      segmento.letraBis = token.normal.toUpperCase();
    } else if (segmento.bis === undefined && segmento.letra === undefined) {
      if (enVia && siguienteEsMarcador && LETRA_Y_NORTE.test(token.normal)) {
        segmento.letra = token.normal.charAt(0).toUpperCase();
        segmento.cuadrante = 'Norte';
      } else {
        segmento.letra = token.normal.toUpperCase();
      }
    } else {
      break;
    }

    indice += 1;
  }

  return { segmento, indice };
}

function saltarMarcadores(tokens: Token[], inicio: number): number {
  let indice = inicio;

  for (let token = tokens[indice]; token !== undefined; token = tokens[indice]) {
    if (!MARCADORES.has(token.normal) && !SIGNOS_ENTRE_VIA_Y_CRUCE.has(token.texto)) break;

    indice += 1;
  }

  return indice;
}

/** Lee una vía con nombre, como `Avenida El Dorado # 68-90`. El marcador es obligatorio. */
function leerViaConNombre(
  tokens: Token[],
  texto: string,
  inicio: number,
): { segmento: Segmento; indice: number } | null {
  let fin = inicio;

  while (fin < tokens.length && !esMarcador(tokens[fin])) fin += 1;

  const partes = tokens.slice(inicio, fin);
  const primera = partes[0];
  const ultima = partes[partes.length - 1];

  if (fin === tokens.length || primera === undefined || ultima === undefined) return null;

  // Un número solo vale al inicio de una fecha, como en `Avenida 30 de Agosto`.
  const inicioValido =
    PALABRA.test(primera.texto) ||
    (esNumero(primera, MAXIMO_DIGITOS_VIA) && CONECTORES_DE_NOMBRE.has(partes[1]?.normal ?? ''));
  const restoValido = partes.slice(1).every((p) => PALABRA.test(p.texto) || p.texto === '.');

  if (!inicioValido || !restoValido) return null;

  const nombre = texto.slice(primera.inicio, ultima.fin).replace(/\.$/, '').replace(/\s+/g, ' ');

  return { segmento: { numero: nombre }, indice: fin };
}

function limpiarBordes(texto: string): string {
  const caracteres = [...texto.trim()];
  const esBorde = (caracter: string | undefined): boolean =>
    caracter !== undefined && (SIGNOS_DE_BORDE.has(caracter) || caracter.trim() === '');

  while (esBorde(caracteres[0])) caracteres.shift();
  while (esBorde(caracteres[caracteres.length - 1])) caracteres.pop();

  return caracteres.join('');
}

function normalizarComplemento(texto: string): string {
  const conPalabrasConocidas = limpiarBordes(texto).replace(
    PALABRA_COMPLEMENTO,
    (coincidencia, palabra: string, _punto: string, siguiente: string) => {
      const complemento = COMPLEMENTOS.get(normalizarPalabra(palabra));

      if (complemento === undefined) return coincidencia;

      return siguiente === '' ? complemento.nombre : `${complemento.nombre} `;
    },
  );

  return conPalabrasConocidas.replace(/\s+/g, ' ').trim();
}

function campoOpcional<K extends string, V>(clave: K, valor: V | undefined): Partial<Record<K, V>> {
  return valor === undefined ? {} : ({ [clave]: valor } as Record<K, V>);
}

/**
 * Separa una dirección colombiana en sus partes y normaliza sus abreviaturas.
 *
 * Reconoce variantes como `Cra`, `Kra`, `Cr.` y `KR`, los marcadores `#`, `No.`, `N°` y `Nro`, Bis
 * y cuadrantes. Lo que sigue a la placa queda en `complemento`.
 *
 * Necesita tipo de vía, número o nombre, cruce y placa. Devuelve `null` con referencias como
 * `Cra 7 con Cl 16` o `Km 5 vía Tunja`, y si no puede interpretar el texto con seguridad.
 *
 * @param texto Dirección en cualquier formato.
 * @returns La dirección separada, o `null` si no se puede interpretar. Nunca lanza errores.
 *
 * @example
 * parsearDireccion('Cra. 7A No. 32-16 Apto 301');
 * // { tipoVia: 'Carrera', numeroVia: '7', letraVia: 'A', numeroCruce: '32', placa: '16',
 * //   complemento: 'Apartamento 301' }
 */
export function parsearDireccion(texto: string): Direccion | null {
  if (typeof texto !== 'string') return null;

  const tokens = separarTokens(texto);
  const tipoVia = leerTipoVia(tokens);

  if (tipoVia === null) return null;

  const viaNumerada = leerSegmento(tokens, tipoVia.indice, true);
  const cruceNumerado =
    viaNumerada === null
      ? null
      : leerSegmento(tokens, saltarMarcadores(tokens, viaNumerada.indice), false);

  const via =
    cruceNumerado === null ? leerViaConNombre(tokens, texto, tipoVia.indice) : viaNumerada;

  if (via === null) return null;

  const cruce = cruceNumerado ?? leerSegmento(tokens, saltarMarcadores(tokens, via.indice), false);

  if (cruce === null) return null;

  let indice = esGuion(tokens[cruce.indice]) ? cruce.indice + 1 : cruce.indice;
  const numeroPlaca = tokens[indice];

  if (!esNumero(numeroPlaca, MAXIMO_DIGITOS_PLACA)) return null;

  let placa = numeroPlaca.texto;

  indice += 1;

  const letraPlaca = tokens[indice];

  if (
    letraPlaca !== undefined &&
    letraPlaca.inicio === numeroPlaca.fin &&
    LETRA_DE_PLACA.test(letraPlaca.normal) &&
    !CUADRANTES.has(letraPlaca.normal)
  ) {
    placa += letraPlaca.normal.toUpperCase();
    indice += 1;
  }

  const rangoPlaca = tokens[indice + 1];

  if (tokens[indice]?.texto === '/' && esNumero(rangoPlaca, MAXIMO_DIGITOS_PLACA)) {
    placa += `/${rangoPlaca.texto}`;
    indice += 2;
  }

  const palabraFinal = tokens[indice]?.normal ?? '';
  let { cuadrante: cuadranteCruce } = cruce.segmento;

  if (cuadranteCruce === undefined && palabraFinal.length > 2) {
    const cuadrante = CUADRANTES.get(palabraFinal);

    if (cuadrante !== undefined) {
      cuadranteCruce = cuadrante.nombre as Cuadrante;
      indice += 1;
    }
  }

  // Un número más después de la placa no se puede interpretar: `21-03-17`.
  if (esGuion(tokens[indice]) && esNumero(tokens[indice + 1], Number.POSITIVE_INFINITY))
    return null;

  const inicioComplemento = tokens[indice]?.inicio;
  const complemento =
    inicioComplemento === undefined ? '' : normalizarComplemento(texto.slice(inicioComplemento));

  return {
    tipoVia: tipoVia.tipo,
    numeroVia: via.segmento.numero,
    ...campoOpcional('letraVia', via.segmento.letra),
    ...campoOpcional('bisVia', via.segmento.bis),
    ...campoOpcional('letraBisVia', via.segmento.letraBis),
    ...campoOpcional('cuadranteVia', via.segmento.cuadrante),
    numeroCruce: cruce.segmento.numero,
    ...campoOpcional('letraCruce', cruce.segmento.letra),
    ...campoOpcional('bisCruce', cruce.segmento.bis),
    ...campoOpcional('letraBisCruce', cruce.segmento.letraBis),
    ...campoOpcional('cuadranteCruce', cuadranteCruce),
    placa,
    ...campoOpcional('complemento', complemento === '' ? undefined : complemento),
  };
}

function formatearSegmento(segmento: Segmento, corto: boolean): string {
  const numeroYLetra =
    segmento.letra === undefined
      ? segmento.numero
      : `${segmento.numero}${corto ? '' : ' '}${segmento.letra}`;

  return [
    numeroYLetra,
    segmento.bis === true ? 'Bis' : undefined,
    segmento.letraBis,
    segmento.cuadrante,
  ]
    .filter((parte) => parte !== undefined)
    .join(' ');
}

function acortarComplemento(complemento: string): string {
  return complemento.replace(
    /[\p{L}\p{M}]+/gu,
    (palabra) => CORTOS_DE_COMPLEMENTO.get(palabra) ?? palabra,
  );
}

/**
 * Escribe una dirección separada con un formato uniforme.
 *
 * @param direccion Resultado de {@link parsearDireccion}.
 * @param opciones `estilo: 'corto'` (por defecto) o `estilo: 'largo'`.
 * @returns La dirección como texto, o `null` si recibe `null`. Nunca lanza errores.
 *
 * @example
 * const direccion = parsearDireccion('KR 7 A # 32 - 16 APTO 301');
 *
 * formatearDireccion(direccion); // 'Cra 7A # 32-16 Apto 301'
 * formatearDireccion(direccion, { estilo: 'largo' }); // 'Carrera 7 A # 32 - 16 Apartamento 301'
 */
export function formatearDireccion(
  direccion: Direccion | null,
  opciones: OpcionesFormato = {},
): string | null {
  if (direccion === null || typeof direccion !== 'object') return null;

  const corto = opciones.estilo !== 'largo';
  const tipo = VIAS.tiposVia.find(({ nombre }) => nombre === direccion.tipoVia);
  const via = formatearSegmento(
    {
      numero: direccion.numeroVia,
      letra: direccion.letraVia,
      bis: direccion.bisVia,
      letraBis: direccion.letraBisVia,
      cuadrante: direccion.cuadranteVia,
    },
    corto,
  );
  const cruce = formatearSegmento(
    {
      numero: direccion.numeroCruce,
      letra: direccion.letraCruce,
      bis: direccion.bisCruce,
      letraBis: direccion.letraBisCruce,
      cuadrante: direccion.cuadranteCruce,
    },
    corto,
  );
  const nombreTipo = corto ? tipo?.corto : tipo?.nombre;
  const separador = corto ? '-' : ' - ';
  const base = `${nombreTipo} ${via} # ${cruce}${separador}${direccion.placa}`;

  if (direccion.complemento === undefined) return base;

  return `${base} ${corto ? acortarComplemento(direccion.complemento) : direccion.complemento}`;
}
