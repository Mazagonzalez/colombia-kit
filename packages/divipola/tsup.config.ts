import { defineConfig } from 'tsup';
import { crearConfigTsup } from '../../tsup.config.base';

export default defineConfig(
  crearConfigTsup(['src/index.ts', 'src/departamentos.ts', 'src/municipios.ts']),
);
