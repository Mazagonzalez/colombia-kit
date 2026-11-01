import type { Options } from 'tsup';

/**
 * Configuración de build compartida por los paquetes de `packages/`.
 * Genera ESM, CJS y `.d.ts`, e incluye los datos en el bundle para no leer archivos en runtime.
 */
export function crearConfigTsup(entry: Options['entry'] = ['src/index.ts']): Options {
  return {
    entry,
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: false,
    splitting: true,
    treeshake: true,
    target: 'node18',
  };
}
