import type { DatosDivipola, MunicipioDato } from './transformar';

export type TipoDeVersion = 'major' | 'minor' | 'patch';

export interface Diferencias {
  agregados: MunicipioDato[];
  eliminados: MunicipioDato[];
  renombrados: { codigo: string; antes: string; despues: string }[];
  codigosCambiados: { nombre: string; antes: string; despues: string }[];
  /** Cambió otro dato del municipio (tipo, coordenadas…) o algún dato de un departamento. */
  otrosCambios: string[];
}

function claveDeNombre({ codigoDepartamento, nombreOficial }: MunicipioDato): string {
  return `${codigoDepartamento}|${nombreOficial}`;
}

/** Compara dos versiones de los datos. Un mismo nombre con otro código es un código cambiado. */
export function compararDatos(antes: DatosDivipola, despues: DatosDivipola): Diferencias {
  const anteriores = new Map(antes.municipios.map((municipio) => [municipio.codigo, municipio]));
  const nuevos = new Map(despues.municipios.map((municipio) => [municipio.codigo, municipio]));

  const sinPareja = new Map(
    antes.municipios
      .filter(({ codigo }) => !nuevos.has(codigo))
      .map((municipio) => [claveDeNombre(municipio), municipio]),
  );

  const agregados: MunicipioDato[] = [];
  const renombrados: Diferencias['renombrados'] = [];
  const codigosCambiados: Diferencias['codigosCambiados'] = [];
  const otrosCambios: string[] = [];

  for (const municipio of despues.municipios) {
    const anterior = anteriores.get(municipio.codigo);

    if (anterior === undefined) {
      const clave = claveDeNombre(municipio);
      const pareja = sinPareja.get(clave);

      if (pareja === undefined) {
        agregados.push(municipio);
      } else {
        sinPareja.delete(clave);
        codigosCambiados.push({
          nombre: municipio.nombre,
          antes: pareja.codigo,
          despues: municipio.codigo,
        });
      }
    } else if (anterior.nombreOficial !== municipio.nombreOficial) {
      renombrados.push({
        codigo: municipio.codigo,
        antes: anterior.nombreOficial,
        despues: municipio.nombreOficial,
      });
    } else if (JSON.stringify(anterior) !== JSON.stringify(municipio)) {
      otrosCambios.push(`${municipio.codigo} ${municipio.nombre}`);
    }
  }

  const departamentosAntes = new Map(antes.departamentos.map((d) => [d.codigo, JSON.stringify(d)]));
  const departamentosDespues = new Map(
    despues.departamentos.map((d) => [d.codigo, JSON.stringify(d)]),
  );

  for (const codigo of new Set([...departamentosAntes.keys(), ...departamentosDespues.keys()])) {
    if (departamentosAntes.get(codigo) !== departamentosDespues.get(codigo)) {
      otrosCambios.push(`Departamento ${codigo}`);
    }
  }

  return {
    agregados,
    eliminados: [...sinPareja.values()],
    renombrados,
    codigosCambiados,
    otrosCambios,
  };
}

/**
 * Eliminar o cambiar un código rompe el union type de quien lo use, así que es `major`.
 * Agregar municipios es `minor`, y las correcciones son `patch`.
 */
export function tipoDeVersion(diferencias: Diferencias): TipoDeVersion {
  if (diferencias.eliminados.length > 0 || diferencias.codigosCambiados.length > 0) return 'major';
  if (diferencias.agregados.length > 0) return 'minor';

  return 'patch';
}

function seccion(titulo: string, lineas: string[]): string[] {
  return lineas.length === 0 ? [] : [`### ${titulo} (${lineas.length})`, '', ...lineas, ''];
}

function nombreConDepartamento({ codigo, nombre, departamento }: MunicipioDato): string {
  return `- \`${codigo}\` ${nombre} (${departamento})`;
}

/** Resumen en Markdown para la descripción del PR. */
export function resumenEnMarkdown(diferencias: Diferencias): string {
  const version = tipoDeVersion(diferencias);
  const lineas = [
    'Actualización automática de DIVIPOLA desde [datos.gov.co](https://www.datos.gov.co/d/gdxc-w37w).',
    '',
    `El changeset incluido es **${version}**.`,
    '',
    ...seccion('Municipios agregados', diferencias.agregados.map(nombreConDepartamento)),
    ...seccion('Municipios eliminados', diferencias.eliminados.map(nombreConDepartamento)),
    ...seccion(
      'Municipios renombrados',
      diferencias.renombrados.map((r) => `- \`${r.codigo}\` ${r.antes} → ${r.despues}`),
    ),
    ...seccion(
      'Códigos cambiados',
      diferencias.codigosCambiados.map((c) => `- ${c.nombre}: \`${c.antes}\` → \`${c.despues}\``),
    ),
    ...seccion(
      'Otros cambios',
      diferencias.otrosCambios.map((cambio) => `- ${cambio}`),
    ),
  ];

  if (version === 'major') {
    lineas.push(
      '> **Revisa antes de integrar:** se eliminaron o cambiaron códigos, y eso puede romper el código de quien los use.',
      '',
    );
  }

  return lineas.join('\n');
}

/** Contenido del changeset que acompaña al PR. */
export function textoChangeset(diferencias: Diferencias): string {
  const { agregados, eliminados, renombrados, codigosCambiados, otrosCambios } = diferencias;
  const partes = [
    agregados.length > 0 && `${agregados.length} agregados`,
    eliminados.length > 0 && `${eliminados.length} eliminados`,
    renombrados.length > 0 && `${renombrados.length} renombrados`,
    codigosCambiados.length > 0 && `${codigosCambiados.length} códigos cambiados`,
    otrosCambios.length > 0 && `${otrosCambios.length} otros cambios`,
  ].filter(Boolean);

  const version = tipoDeVersion(diferencias);

  return `---\n'@colombia-kit/divipola': ${version}\n'colombia-kit-php': ${version}\n---\n\nActualiza los datos de DIVIPOLA: ${partes.join(', ')}.\n`;
}
