// Descarga DIVIPOLA del DANE, la valida y, si cambió, regenera los datos y crea el changeset.
// Si la fuente falla no toca ningún archivo: escribe el motivo y termina con código 1.
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compararDatos, resumenEnMarkdown, textoChangeset } from './divipola/diferencias';
import {
  ErrorFuente,
  serializarDatos,
  transformar,
  validarFuente,
  type DatosDivipola,
} from './divipola/transformar';
import { sincronizarDatos } from './sincronizar-datos';

const URL_FUENTE =
  process.env.DIVIPOLA_URL ??
  'https://www.datos.gov.co/resource/gdxc-w37w.json?$limit=5000&$order=cod_mpio';

/** Si desaparece más de esta fracción de los municipios, se asume un problema de la fuente. */
const MAXIMO_ELIMINADOS = 0.1;

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const RUTA_DATOS = join(RAIZ, 'data/divipola.json');
const DIR_SALIDA = process.env.DIVIPOLA_SALIDA ?? tmpdir();

async function descargar(): Promise<unknown> {
  const respuesta = await fetch(URL_FUENTE, { signal: AbortSignal.timeout(60_000) }).catch(
    (error: unknown) => {
      throw new ErrorFuente(`No se pudo descargar la fuente: ${String(error)}`);
    },
  );

  if (!respuesta.ok) throw new ErrorFuente(`La fuente respondió con HTTP ${respuesta.status}.`);

  return respuesta.json().catch(() => {
    throw new ErrorFuente('La respuesta de la fuente no es JSON.');
  });
}

function reportarSalida(cambios: boolean): void {
  if (process.env.GITHUB_OUTPUT !== undefined) {
    appendFileSync(process.env.GITHUB_OUTPUT, `cambios=${cambios}\n`);
  }
}

async function principal(): Promise<void> {
  const datos = transformar(validarFuente(await descargar()));
  const serializados = serializarDatos(datos);
  const anteriorTexto = existsSync(RUTA_DATOS) ? readFileSync(RUTA_DATOS, 'utf8') : null;

  if (anteriorTexto === serializados) {
    console.log('DIVIPOLA no tiene cambios.');
    reportarSalida(false);

    return;
  }

  if (anteriorTexto !== null) {
    const anterior = JSON.parse(anteriorTexto) as DatosDivipola;
    const diferencias = compararDatos(anterior, datos);

    if (diferencias.eliminados.length > anterior.municipios.length * MAXIMO_ELIMINADOS) {
      throw new ErrorFuente(
        `Desaparecerían ${diferencias.eliminados.length} de ${anterior.municipios.length} municipios.`,
      );
    }

    const fecha = new Date().toISOString().slice(0, 10);
    const resumen = resumenEnMarkdown(diferencias);

    writeFileSync(
      join(RAIZ, `.changeset/actualizar-divipola-${fecha}.md`),
      textoChangeset(diferencias),
    );
    writeFileSync(join(DIR_SALIDA, 'divipola-resumen.md'), resumen);
    console.log(resumen);
  }

  writeFileSync(RUTA_DATOS, serializados);
  sincronizarDatos();
  reportarSalida(true);
  console.log(`DIVIPOLA actualizada: ${datos.municipios.length} municipios.`);
}

principal().catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : String(error);

  writeFileSync(join(DIR_SALIDA, 'divipola-error.md'), `${mensaje}\n`);
  console.error(mensaje);
  process.exit(1);
});
