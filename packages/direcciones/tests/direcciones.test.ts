import { describe, expect, it } from 'vitest';
import vias from '../../../data/vias.json';
import casos from '../../../fixtures/direcciones.json';
import { formatearDireccion, parsearDireccion, type Direccion } from '../src/index';

const parseables = [...casos.reales, ...casos.variantes].filter(({ salida }) => salida !== null);

describe('parsearDireccion', () => {
  it.each(casos.reales)('$ciudad: $entrada', ({ entrada, salida }) => {
    expect(parsearDireccion(entrada)).toEqual(salida);
  });

  it.each(casos.variantes)('$descripcion: $entrada', ({ entrada, salida }) => {
    expect(parsearDireccion(entrada as string)).toEqual(salida);
  });

  it.each(vias.tiposVia.flatMap((t) => t.variantes.map((v) => [v, t.nombre])))(
    'tipo de vía: %s es %s',
    (variante, nombre) => {
      expect(parsearDireccion(`${variante} 7 # 32-16`)).toEqual({
        tipoVia: nombre,
        numeroVia: '7',
        numeroCruce: '32',
        placa: '16',
      });
    },
  );

  it.each(vias.cuadrantes.flatMap((c) => c.variantes.map((v) => [v, c.nombre])))(
    'cuadrante: %s es %s',
    (variante, nombre) => {
      expect(parsearDireccion(`Cra 7 ${variante} # 32-16`)?.cuadranteVia).toBe(nombre);
    },
  );

  it.each(vias.marcadores)('marcador: %s', (marcador) => {
    expect(parsearDireccion(`Cra 7 ${marcador} 32-16`)).toEqual({
      tipoVia: 'Carrera',
      numeroVia: '7',
      numeroCruce: '32',
      placa: '16',
    });
  });

  it.each(vias.guiones)('guion: %j', (guion) => {
    expect(parsearDireccion(`Cra 7 # 32 ${guion} 16`)?.placa).toBe('16');
  });

  it.each(vias.complementos.flatMap((c) => c.variantes.map((v) => [v, c.nombre])))(
    'complemento: %s es %s',
    (variante, nombre) => {
      expect(parsearDireccion(`Cra 7 # 32-16 ${variante} 5`)?.complemento).toBe(`${nombre} 5`);
    },
  );
});

describe('formatearDireccion', () => {
  it.each(casos.formatear)('$entrada', ({ entrada, corto, largo }) => {
    const direccion = parsearDireccion(entrada);

    expect(formatearDireccion(direccion)).toBe(corto);
    expect(formatearDireccion(direccion, { estilo: 'corto' })).toBe(corto);
    expect(formatearDireccion(direccion, { estilo: 'largo' })).toBe(largo);
  });

  it.each(casos.formatearDatos)('datos: $descripcion', ({ entrada, corto, largo }) => {
    const direccion = entrada as unknown as Direccion;

    expect(formatearDireccion(direccion)).toBe(corto);
    expect(formatearDireccion(direccion, { estilo: 'largo' })).toBe(largo);
  });

  it.each(parseables)('conserva los datos al volver a parsear: $entrada', ({ salida }) => {
    const direccion = salida as Direccion;

    expect(parsearDireccion(formatearDireccion(direccion) as string)).toEqual(direccion);
    expect(parsearDireccion(formatearDireccion(direccion, { estilo: 'largo' }) as string)).toEqual(
      direccion,
    );
  });
});
