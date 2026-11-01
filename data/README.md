# Datos

Fuente de verdad de los datos del proyecto, independiente del lenguaje. Los paquetes de JS y PHP usan estos archivos y no deben editar sus copias a mano.

| Archivo              | Contenido                                           | Cómo se actualiza                              |
| -------------------- | --------------------------------------------------- | ---------------------------------------------- |
| `divipola.json`      | Departamentos y municipios del DANE                 | `pnpm divipola:actualizar`, o el robot mensual |
| `normalizacion.json` | Tabla para comparar textos sin mayúsculas ni tildes | A mano, seguido de `pnpm datos:sincronizar`    |

`pnpm datos:sincronizar` regenera las copias de los paquetes, y el CI falla si alguna está desactualizada.

## Licencia y atribución

El código del proyecto usa licencia MIT, pero los datos de DIVIPOLA no: el DANE los publica bajo [Creative Commons Atribución-CompartirIgual 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.es).

- **Fuente:** [DIVIPOLA - Códigos municipios](https://www.datos.gov.co/d/gdxc-w37w), Departamento Administrativo Nacional de Estadística (DANE).
- **Transformaciones:** cambio de formato y nombres derivados en mayúsculas y minúsculas. El nombre oficial se conserva.
- **Redistribución:** quien redistribuya estos datos, o una versión modificada, debe mantener la atribución y la misma licencia.
