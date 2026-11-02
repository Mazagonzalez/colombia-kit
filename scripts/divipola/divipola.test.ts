import { describe, expect, it } from 'vitest';
import {
  compararDatos,
  resumenEnMarkdown,
  textoChangeset,
  tipoDeVersion,
  type Diferencias,
} from './diferencias';
import {
  ErrorFuente,
  nombreLegible,
  serializarDatos,
  transformar,
  validarFuente,
  type DatosDivipola,
  type FilaFuente,
  type MunicipioDato,
} from './transformar';

function fila(codigo: string, cambios: Partial<FilaFuente> = {}): FilaFuente {
  return {
    cod_dpto: codigo.slice(0, 2),
    dpto: `DEPARTAMENTO ${codigo.slice(0, 2)}`,
    cod_mpio: codigo,
    nom_mpio: `MUNICIPIO ${codigo}`,
    tipo_municipio: 'Municipio',
    longitud: '-75,581775',
    latitud: '6,246631',
    ...cambios,
  };
}

/** 1000 municipios repartidos en 33 departamentos: lo mínimo que acepta la validación. */
function fuenteValida(): FilaFuente[] {
  return Array.from({ length: 1000 }, (_, indice) => {
    const departamento = String(10 + (indice % 33));

    return fila(`${departamento}${String(indice).padStart(3, '0')}`);
  });
}

function municipio(codigo: string, cambios: Partial<MunicipioDato> = {}): MunicipioDato {
  return {
    codigo,
    nombre: `M ${codigo}`,
    nombreOficial: `M ${codigo}`,
    tipo: 'Municipio',
    codigoDepartamento: codigo.slice(0, 2),
    departamento: 'D',
    latitud: 1,
    longitud: -75,
    ...cambios,
  };
}

function datos(...municipios: MunicipioDato[]): DatosDivipola {
  return { departamentos: [], municipios };
}

const SIN_CAMBIOS: Diferencias = {
  agregados: [],
  eliminados: [],
  renombrados: [],
  codigosCambiados: [],
  otrosCambios: [],
};

describe('nombreLegible', () => {
  it.each([
    ['MEDELLÍN', 'Medellín'],
    ['VALLE DEL CAUCA', 'Valle del Cauca'],
    ['BOGOTÁ, D.C.', 'Bogotá, D.C.'],
    ['EL CARMEN DE BOLÍVAR', 'El Carmen de Bolívar'],
    ['LA GUAJIRA', 'La Guajira'],
    ['MARÍA LA BAJA', 'María La Baja'],
    ['SAN JOSÉ DE LA MONTAÑA', 'San José de la Montaña'],
    ['PIENDAMÓ - TUNÍA', 'Piendamó - Tunía'],
    [
      'ARCHIPIÉLAGO DE SAN ANDRÉS, PROVIDENCIA Y SANTA CATALINA',
      'Archipiélago de San Andrés, Providencia y Santa Catalina',
    ],
    ['ÁREA NO MUNICIPALIZADA', 'Área No Municipalizada'],
  ])('%s', (oficial, legible) => {
    expect(nombreLegible(oficial)).toBe(legible);
  });
});

describe('validarFuente', () => {
  it('acepta una fuente válida', () => {
    expect(validarFuente(fuenteValida())).toHaveLength(1000);
  });

  it.each([
    ['no es una lista', { error: true }, 'no es una lista'],
    ['fila que no es objeto', ['x'], 'no es un objeto'],
    ['columna renombrada', [{ ...fila('05001'), nom_mpio: undefined }], 'faltan campos: nom_mpio'],
    ['código de municipio corto', [fila('05001', { cod_mpio: '5001' })], 'código de municipio'],
    [
      'código de departamento inválido',
      [fila('05001', { cod_dpto: 'AB' })],
      'código de departamento',
    ],
    ['código que no corresponde', [fila('05001', { cod_dpto: '08' })], 'no empieza por'],
    ['departamento vacío', [fila('05001', { dpto: ' ' })], 'departamento vacío'],
    ['municipio vacío', [fila('05001', { nom_mpio: '' })], 'municipio vacío'],
    ['tipo desconocido', [fila('05001', { tipo_municipio: 'Vereda' })], 'tipo "Vereda"'],
    ['latitud fuera de Colombia', [fila('05001', { latitud: '40,1' })], 'latitud'],
    ['longitud sin formato', [fila('05001', { longitud: 'n/a' })], 'longitud'],
    ['muy pocos municipios', [fila('05001')], 'solo trae 1 municipios'],
  ])('rechaza: %s', (_, respuesta, mensaje) => {
    expect(() => validarFuente(respuesta)).toThrow(ErrorFuente);
    expect(() => validarFuente(respuesta)).toThrow(mensaje);
  });

  it('rechaza muy pocos departamentos', () => {
    const filas = Array.from({ length: 1000 }, (_, i) => fila(`05${String(i).padStart(3, '0')}`));

    expect(() => validarFuente(filas)).toThrow('solo trae 1 departamentos');
  });

  it('rechaza códigos repetidos', () => {
    const filas = fuenteValida();

    filas[1] = { ...(filas[0] as FilaFuente) };

    expect(() => validarFuente(filas)).toThrow('repetidos');
  });

  it('rechaza un departamento con dos nombres', () => {
    const filas = fuenteValida();

    filas[33] = { ...(filas[33] as FilaFuente), dpto: 'OTRO NOMBRE' };

    expect(() => validarFuente(filas)).toThrow('varios nombres');
  });
});

describe('transformar y serializarDatos', () => {
  const resultado = transformar([
    fila('08001', {
      dpto: 'ATLÁNTICO',
      nom_mpio: 'BARRANQUILLA',
      latitud: '10,96',
      longitud: '-74.78',
    }),
    fila('05001', { dpto: 'ANTIOQUIA', nom_mpio: 'MEDELLÍN' }),
  ]);

  it('ordena por código y deriva los nombres', () => {
    expect(resultado.departamentos).toEqual([
      { codigo: '05', nombre: 'Antioquia', nombreOficial: 'ANTIOQUIA' },
      { codigo: '08', nombre: 'Atlántico', nombreOficial: 'ATLÁNTICO' },
    ]);
    expect(resultado.municipios[0]).toEqual({
      codigo: '05001',
      nombre: 'Medellín',
      nombreOficial: 'MEDELLÍN',
      tipo: 'Municipio',
      codigoDepartamento: '05',
      departamento: 'Antioquia',
      latitud: 6.246631,
      longitud: -75.581775,
    });
  });

  it('acepta coma o punto decimal', () => {
    expect(resultado.municipios[1]).toMatchObject({ latitud: 10.96, longitud: -74.78 });
  });

  it('serializa JSON válido con un registro por línea', () => {
    const texto = serializarDatos(resultado);

    expect(JSON.parse(texto)).toEqual(resultado);
    expect(texto.split('\n')).toHaveLength(11);
    expect(texto.endsWith('}\n')).toBe(true);
  });
});

describe('compararDatos', () => {
  it('sin cambios', () => {
    expect(compararDatos(datos(municipio('05001')), datos(municipio('05001')))).toEqual(
      SIN_CAMBIOS,
    );
  });

  it('detecta agregados y eliminados', () => {
    const diferencias = compararDatos(datos(municipio('05001')), datos(municipio('05002')));

    expect(diferencias.agregados.map((m) => m.codigo)).toEqual(['05002']);
    expect(diferencias.eliminados.map((m) => m.codigo)).toEqual(['05001']);
  });

  it('detecta renombrados', () => {
    const despues = municipio('05001', { nombreOficial: 'NUEVO' });

    expect(compararDatos(datos(municipio('05001')), datos(despues)).renombrados).toEqual([
      { codigo: '05001', antes: 'M 05001', despues: 'NUEVO' },
    ]);
  });

  it('detecta un código cambiado cuando coinciden nombre y departamento', () => {
    const antes = municipio('05001', { nombreOficial: 'IGUAL', nombre: 'Igual' });
    const despues = municipio('05999', { nombreOficial: 'IGUAL', nombre: 'Igual' });
    const diferencias = compararDatos(datos(antes), datos(despues));

    expect(diferencias.codigosCambiados).toEqual([
      { nombre: 'Igual', antes: '05001', despues: '05999' },
    ]);
    expect(diferencias.agregados).toEqual([]);
    expect(diferencias.eliminados).toEqual([]);
  });

  it('no confunde el mismo nombre en otro departamento con un código cambiado', () => {
    const antes = municipio('05001', { nombreOficial: 'IGUAL' });
    const despues = municipio('08001', { nombreOficial: 'IGUAL' });

    expect(compararDatos(datos(antes), datos(despues)).codigosCambiados).toEqual([]);
  });

  it('detecta otros cambios de municipios y departamentos', () => {
    const antes: DatosDivipola = {
      departamentos: [{ codigo: '05', nombre: 'A', nombreOficial: 'A' }],
      municipios: [municipio('05001')],
    };
    const despues: DatosDivipola = {
      departamentos: [{ codigo: '05', nombre: 'B', nombreOficial: 'B' }],
      municipios: [municipio('05001', { latitud: 2 })],
    };

    expect(compararDatos(antes, despues).otrosCambios).toEqual([
      '05001 M 05001',
      'Departamento 05',
    ]);
  });
});

describe('versión, resumen y changeset', () => {
  const agregado = municipio('05999', { nombre: 'Nuevo', departamento: 'Antioquia' });

  it.each<[string, Partial<Diferencias>, string]>([
    ['agregar es minor', { agregados: [agregado] }, 'minor'],
    ['eliminar es major', { eliminados: [agregado] }, 'major'],
    [
      'cambiar un código es major',
      { codigosCambiados: [{ nombre: 'N', antes: '1', despues: '2' }] },
      'major',
    ],
    ['renombrar es patch', { renombrados: [{ codigo: '1', antes: 'A', despues: 'B' }] }, 'patch'],
    ['otros cambios son patch', { otrosCambios: ['x'] }, 'patch'],
    ['major gana sobre minor', { agregados: [agregado], eliminados: [agregado] }, 'major'],
  ])('%s', (_, cambios, version) => {
    expect(tipoDeVersion({ ...SIN_CAMBIOS, ...cambios })).toBe(version);
  });

  it('el resumen lista cada categoría con cambios y omite las vacías', () => {
    const resumen = resumenEnMarkdown({
      ...SIN_CAMBIOS,
      agregados: [agregado],
      renombrados: [{ codigo: '05001', antes: 'A', despues: 'B' }],
    });

    expect(resumen).toContain('### Municipios agregados (1)');
    expect(resumen).toContain('- `05999` Nuevo (Antioquia)');
    expect(resumen).toContain('- `05001` A → B');
    expect(resumen).toContain('**minor**');
    expect(resumen).not.toContain('eliminados');
    expect(resumen).not.toContain('Revisa antes');
  });

  it('el resumen advierte cuando el cambio es major', () => {
    const resumen = resumenEnMarkdown({
      ...SIN_CAMBIOS,
      eliminados: [agregado],
      codigosCambiados: [{ nombre: 'N', antes: '05001', despues: '05002' }],
      otrosCambios: ['05003 X'],
    });

    expect(resumen).toContain('### Municipios eliminados (1)');
    expect(resumen).toContain('- N: `05001` → `05002`');
    expect(resumen).toContain('- 05003 X');
    expect(resumen).toContain('Revisa antes');
  });

  it('el changeset declara los paquetes de JS y PHP, la versión y el conteo', () => {
    expect(
      textoChangeset({
        ...SIN_CAMBIOS,
        agregados: [agregado],
        renombrados: [{ codigo: '1', antes: 'A', despues: 'B' }],
      }),
    ).toBe(
      "---\n'@colombia-kit/divipola': minor\n'colombia-kit-php': minor\n---\n\nActualiza los datos de DIVIPOLA: 1 agregados, 1 renombrados.\n",
    );
  });
});
