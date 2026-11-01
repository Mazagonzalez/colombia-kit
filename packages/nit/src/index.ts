/** Pesos del algoritmo módulo 11 de la DIAN, aplicados de derecha a izquierda. */
const PESOS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71] as const;

// Las clases de caracteres son explícitas para que PHP use exactamente las mismas.
const RELLENO = /[ \t\r\n\u00A0.]/g;
const NIT_CON_DV_OPCIONAL = /^([0-9]{1,15})(?:[-\u2013\u2014]([0-9]))?$/;
const SOLO_CEROS = /^0+$/;
const MILES = /\B(?=(?:[0-9]{3})+$)/g;

/** Dígitos del número en un NIT sin guion; el siguiente dígito, si existe, es el DV. */
const DIGITOS_NUMERO_SIN_GUION = 9;

/** Un NIT separado en su número y su dígito de verificación. */
export interface NitLimpio {
  /** Dígitos del número, sin puntos ni espacios. Conserva los ceros a la izquierda. */
  numero: string;
  /** Dígito de verificación, o `null` si la entrada no lo trae. */
  dv: number | null;
}

interface PartesNit {
  digitos: string;
  dvConGuion: number | null;
}

function separarPartes(nit: unknown): PartesNit | null {
  let texto: string;

  if (typeof nit === 'string') {
    texto = nit;
  } else if (typeof nit === 'number' && Number.isSafeInteger(nit) && nit >= 0) {
    texto = String(nit);
  } else {
    return null;
  }

  const coincidencia = NIT_CON_DV_OPCIONAL.exec(texto.replace(RELLENO, ''));
  const digitos = coincidencia?.[1];

  if (coincidencia === null || digitos === undefined || SOLO_CEROS.test(digitos)) {
    return null;
  }

  const dv = coincidencia[2];

  return { digitos, dvConGuion: dv === undefined ? null : Number(dv) };
}

function calcularDigito(digitos: string): number {
  let suma = 0;

  for (const [indice, peso] of PESOS.entries()) {
    const digito = digitos[digitos.length - 1 - indice];

    if (digito === undefined) break;

    suma += Number(digito) * peso;
  }

  const resto = suma % 11;

  return resto > 1 ? 11 - resto : resto;
}

/**
 * Calcula el dígito de verificación (DV) de un NIT con el algoritmo módulo 11 de la DIAN.
 *
 * Todos los dígitos antes del guion se consideran parte del número, así que aquí una cédula de
 * 10 dígitos sin guion no es ambigua. Si la entrada trae un DV después del guion, se ignora.
 *
 * @param nit Número del NIT, con o sin puntos y espacios (máximo 15 dígitos).
 * @returns El DV, o `null` si la entrada no es válida.
 *
 * @example
 * calcularDV('800.197.268'); // 4
 */
export function calcularDV(nit: string | number): number | null {
  const partes = separarPartes(nit);

  return partes === null ? null : calcularDigito(partes.digitos);
}

/**
 * Separa un NIT en su número y su dígito de verificación, sin comprobar que el DV sea correcto.
 *
 * Con guion, lo que sigue al guion es el DV y el número puede tener hasta 15 dígitos. Sin guion,
 * 10 dígitos se leen como número de 9 más DV, menos de 10 son solo el número (`dv: null`) y más
 * de 10 no se aceptan. Por eso, una cédula de 10 dígitos debe escribirse con guion.
 *
 * @param nit NIT en cualquier formato, por ejemplo `"900.123.456-8"` o `"9001234568"`.
 * @returns El número y el DV, o `null` si la entrada no es válida.
 *
 * @example
 * limpiarNIT('800.197.268-4'); // { numero: '800197268', dv: 4 }
 * limpiarNIT('800197268'); // { numero: '800197268', dv: null }
 */
export function limpiarNIT(nit: string | number): NitLimpio | null {
  const partes = separarPartes(nit);

  if (partes === null) return null;

  const { digitos, dvConGuion } = partes;

  if (dvConGuion !== null) return { numero: digitos, dv: dvConGuion };
  if (digitos.length <= DIGITOS_NUMERO_SIN_GUION) return { numero: digitos, dv: null };
  if (digitos.length > DIGITOS_NUMERO_SIN_GUION + 1) return null;

  return {
    numero: digitos.slice(0, DIGITOS_NUMERO_SIN_GUION),
    dv: Number(digitos.slice(DIGITOS_NUMERO_SIN_GUION)),
  };
}

/**
 * Indica si un NIT trae un dígito de verificación correcto.
 *
 * Sin DV no hay nada que comprobar, así que devuelve `false`. Sigue las mismas reglas de lectura
 * que {@link limpiarNIT}.
 *
 * @param nit NIT en cualquier formato.
 * @returns `true` solo si el NIT trae DV y este coincide con el calculado.
 *
 * @example
 * validarNIT('800.197.268-4'); // true
 * validarNIT('800197268'); // false
 */
export function validarNIT(nit: string | number): boolean {
  const limpio = limpiarNIT(nit);

  return limpio !== null && limpio.dv === calcularDigito(limpio.numero);
}

/**
 * Da a un NIT el formato `900.123.456-8`.
 *
 * Si la entrada no trae DV, lo calcula. Si lo trae, lo conserva sin comprobarlo: para eso está
 * {@link validarNIT}.
 *
 * @param nit NIT en cualquier formato.
 * @returns El NIT con formato, o `null` si la entrada no es válida.
 *
 * @example
 * formatearNIT('8001972684'); // '800.197.268-4'
 * formatearNIT('800197268'); // '800.197.268-4'
 */
export function formatearNIT(nit: string | number): string | null {
  const limpio = limpiarNIT(nit);

  if (limpio === null) return null;

  const dv = limpio.dv ?? calcularDigito(limpio.numero);

  return `${limpio.numero.replace(MILES, '.')}-${dv}`;
}
