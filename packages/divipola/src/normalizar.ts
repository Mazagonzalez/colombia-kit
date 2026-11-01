import { TABLA_NORMALIZACION } from './generated/normalizacion';

/** Deja un texto en minúsculas, sin tildes ni puntuación, para poder comparar nombres. */
export function normalizar(texto: string): string {
  let resultado = '';

  for (const caracter of texto) {
    resultado += TABLA_NORMALIZACION[caracter] ?? caracter;
  }

  return resultado
    .replace(/[.,]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
