// Comprueba en el `dist/` que la entrada de departamentos no arrastre los datos de municipios.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const CODIGO_DE_MUNICIPIO = '"05001"';
const IMPORTACION = /(?:from\s*|require\(\s*|import\s*)["'](\.[^"']+)["']/g;

function contieneMunicipios(ruta, visitados = new Set()) {
  if (visitados.has(ruta)) return false;
  visitados.add(ruta);

  const codigo = readFileSync(ruta, 'utf8');

  if (codigo.includes(CODIGO_DE_MUNICIPIO)) return true;

  return [...codigo.matchAll(IMPORTACION)].some(([, destino]) =>
    contieneMunicipios(join(dirname(ruta), destino), visitados),
  );
}

for (const archivo of ['dist/departamentos.js', 'dist/departamentos.cjs']) {
  if (contieneMunicipios(archivo)) {
    console.error(`${archivo} incluye los datos de municipios`);
    process.exit(1);
  }

  console.log(`ok ${archivo}: sin datos de municipios`);
}
