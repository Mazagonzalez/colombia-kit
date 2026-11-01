// Genera a partir de `data/` los archivos que usan los paquetes.
// Con `--check` no escribe nada y falla si alguno está desactualizado.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { DatosDivipola } from './divipola/transformar';

interface DatosVias {
  tiposVia: { nombre: string }[];
  cuadrantes: { nombre: string }[];
  [clave: string]: unknown;
}

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const ENCABEZADO = '// Generado por scripts/sincronizar-datos.ts. No editar a mano.\n';
const DIR_DIVIPOLA = 'packages/divipola/src/generated';
const DIR_DIRECCIONES = 'packages/direcciones/src/generated';

function unionDeTextos(valores: string[]): string {
  return valores.map((valor) => `  | '${valor}'`).join('\n');
}

function listaDeRegistros(registros: unknown[]): string {
  return registros.map((registro) => `  ${JSON.stringify(registro)},`).join('\n');
}

function leerJson(ruta: string): unknown {
  return JSON.parse(readFileSync(join(RAIZ, ruta), 'utf8'));
}

function archivosGenerados(): Map<string, string> {
  const { departamentos, municipios } = leerJson('data/divipola.json') as DatosDivipola;
  const { mapa } = leerJson('data/normalizacion.json') as { mapa: Record<string, string> };
  const vias = leerJson('data/vias.json') as DatosVias;
  const normalizacion = `${ENCABEZADO}export const TABLA_NORMALIZACION: Readonly<Record<string, string>> = ${JSON.stringify(mapa, null, 2)};\n`;

  return new Map([
    [
      `${DIR_DIVIPOLA}/codigos.ts`,
      `${ENCABEZADO}export type CodigoDepartamento =\n${unionDeTextos(departamentos.map((d) => d.codigo))};\n\nexport type CodigoMunicipio =\n${unionDeTextos(municipios.map((m) => m.codigo))};\n`,
    ],
    [
      `${DIR_DIVIPOLA}/departamentos.ts`,
      `${ENCABEZADO}import type { Departamento } from '../tipos';\n\nexport const DEPARTAMENTOS: readonly Departamento[] = [\n${listaDeRegistros(departamentos)}\n] as const;\n`,
    ],
    [
      `${DIR_DIVIPOLA}/municipios.ts`,
      `${ENCABEZADO}import type { Municipio } from '../tipos';\n\nexport const MUNICIPIOS: readonly Municipio[] = [\n${listaDeRegistros(municipios)}\n] as const;\n`,
    ],
    [`${DIR_DIVIPOLA}/normalizacion.ts`, normalizacion],
    [`${DIR_DIRECCIONES}/normalizacion.ts`, normalizacion],
    [
      `${DIR_DIRECCIONES}/vias.ts`,
      `${ENCABEZADO}export type TipoVia =\n${unionDeTextos(vias.tiposVia.map((t) => t.nombre))};\n\nexport type Cuadrante =\n${unionDeTextos(vias.cuadrantes.map((c) => c.nombre))};\n\nexport const VIAS = ${JSON.stringify(vias, null, 2)};\n`,
    ],
  ]);
}

/** Escribe los archivos generados. */
export function sincronizarDatos(): void {
  for (const [ruta, contenido] of archivosGenerados()) {
    mkdirSync(dirname(join(RAIZ, ruta)), { recursive: true });
    writeFileSync(join(RAIZ, ruta), contenido);
  }
}

function desactualizados(): string[] {
  return [...archivosGenerados()]
    .filter(([ruta, contenido]) => {
      try {
        return readFileSync(join(RAIZ, ruta), 'utf8') !== contenido;
      } catch {
        return true;
      }
    })
    .map(([ruta]) => ruta);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--check')) {
    const pendientes = desactualizados();

    if (pendientes.length > 0) {
      console.error(`Desactualizados; corre "pnpm datos:sincronizar":\n${pendientes.join('\n')}`);
      process.exit(1);
    }

    console.log('Los archivos generados coinciden con data/.');
  } else {
    sincronizarDatos();
    console.log('Archivos generados a partir de data/.');
  }
}
