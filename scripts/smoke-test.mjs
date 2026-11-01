// Carga cada entrada publicada de cada paquete, en ESM y en CJS, desde su `dist/` compilado.
// No usa dependencias ni TypeScript: debe correr tal cual en Node 18, la versión mínima soportada.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = fileURLToPath(new globalThis.URL('..', import.meta.url));
const dirPaquetes = existsSync(join(raiz, 'packages')) ? join(raiz, 'packages') : null;
const require = createRequire(import.meta.url);

/** Devuelve las rutas `import` y `require` de cada entrada del campo `exports`. */
function entradas(exportsDelPaquete) {
  return Object.entries(exportsDelPaquete)
    .filter(([subruta]) => subruta !== './package.json')
    .map(([subruta, destino]) => ({ subruta, esm: destino.import, cjs: destino.require }));
}

let revisadas = 0;

for (const nombre of dirPaquetes ? readdirSync(dirPaquetes) : []) {
  const dir = join(dirPaquetes, nombre);
  const rutaManifiesto = join(dir, 'package.json');
  if (!existsSync(rutaManifiesto)) continue;

  const manifiesto = JSON.parse(readFileSync(rutaManifiesto, 'utf8'));

  for (const { subruta, esm, cjs } of entradas(manifiesto.exports ?? {})) {
    const moduloEsm = await import(pathToFileURL(join(dir, esm.default ?? esm)).href);
    const moduloCjs = require(join(dir, cjs.default ?? cjs));

    const clavesEsm = Object.keys(moduloEsm)
      .filter((clave) => clave !== 'default')
      .sort();
    const clavesCjs = Object.keys(moduloCjs).sort();

    if (clavesEsm.length === 0 || clavesEsm.join() !== clavesCjs.join()) {
      throw new Error(
        `${manifiesto.name} (${subruta}): ESM [${clavesEsm}] y CJS [${clavesCjs}] no coinciden`,
      );
    }

    console.log(`ok ${manifiesto.name} ${subruta}: ${clavesEsm.length} exportaciones`);
    revisadas += 1;
  }
}

console.log(`Node ${process.version}: ${revisadas} entradas revisadas`);
