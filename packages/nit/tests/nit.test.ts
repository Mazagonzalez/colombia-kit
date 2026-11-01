import { describe, expect, it } from 'vitest';
import casos from '../../../fixtures/nit.json';
import { calcularDV, formatearNIT, limpiarNIT, validarNIT } from '../src/index';

// Los fixtures incluyen entradas que el tipo de TypeScript no permite, como `null`.
type Entrada = string | number;

describe('calcularDV', () => {
  it.each(casos.calcularDV)('$descripcion', ({ entrada, salida }) => {
    expect(calcularDV(entrada as Entrada)).toBe(salida);
  });
});

describe('limpiarNIT', () => {
  it.each(casos.limpiarNIT)('$descripcion', ({ entrada, salida }) => {
    expect(limpiarNIT(entrada as Entrada)).toEqual(salida);
  });
});

describe('validarNIT', () => {
  it.each(casos.validarNIT)('$descripcion', ({ entrada, salida }) => {
    expect(validarNIT(entrada as Entrada)).toBe(salida);
  });
});

describe('formatearNIT', () => {
  it.each(casos.formatearNIT)('$descripcion', ({ entrada, salida }) => {
    expect(formatearNIT(entrada as Entrada)).toBe(salida);
  });
});

describe('entidades públicas', () => {
  it.each(casos.entidades)('$entidad', ({ numero, dv, formateado }) => {
    expect(calcularDV(numero)).toBe(dv);
    expect(validarNIT(`${numero}-${dv}`)).toBe(true);
    expect(validarNIT(`${numero}-${(dv + 1) % 10}`)).toBe(false);
    expect(formatearNIT(numero)).toBe(formateado);
  });
});
