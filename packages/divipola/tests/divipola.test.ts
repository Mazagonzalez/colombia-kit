import { describe, expect, it } from 'vitest';
import casos from '../../../fixtures/divipola.json';
import datos from '../../../data/divipola.json';
import { departamentos } from '../src/departamentos';
import { buscarMunicipio, municipios, porCodigo } from '../src/index';
import { normalizar } from '../src/normalizar';

function codigos(lista: readonly { codigo: string }[]): string[] {
  return lista.map(({ codigo }) => codigo);
}

describe('departamentos', () => {
  it('devuelve los mismos datos de data/divipola.json', () => {
    expect(departamentos()).toEqual(datos.departamentos);
  });

  it.each(casos.departamentos)('$codigo: $nombre', (departamento) => {
    expect(departamentos()).toContainEqual(departamento);
  });
});

describe('municipios', () => {
  it('sin filtro devuelve los mismos datos de data/divipola.json', () => {
    expect(municipios()).toEqual(datos.municipios);
  });

  it.each(casos.municipios)('$descripcion', ({ entrada, contiene, total }) => {
    const resultado = municipios(entrada);

    expect(codigos(resultado)).toEqual(expect.arrayContaining(contiene));
    expect(resultado.every(({ codigoDepartamento }) => codigoDepartamento === entrada)).toBe(true);

    if (total !== undefined) expect(resultado).toHaveLength(total);
  });
});

describe('buscarMunicipio', () => {
  it.each(casos.buscarMunicipio)('$descripcion', ({ entrada, primero, contiene, total }) => {
    const resultado = buscarMunicipio(entrada as string);

    if (primero !== undefined) expect(resultado[0]?.codigo).toBe(primero);
    if (contiene !== undefined)
      expect(codigos(resultado)).toEqual(expect.arrayContaining(contiene));
    if (total !== undefined) expect(resultado).toHaveLength(total);
  });
});

describe('porCodigo', () => {
  it.each(casos.porCodigo)('$descripcion', ({ entrada, salida }) => {
    const resultado = porCodigo(entrada as string);

    if (salida === null) {
      expect(resultado).toBeNull();
    } else {
      expect(resultado).toMatchObject(salida);
    }
  });
});

describe('normalizar', () => {
  it.each(casos.normalizar)('$descripcion', ({ entrada, salida }) => {
    expect(normalizar(entrada)).toBe(salida);
  });
});
