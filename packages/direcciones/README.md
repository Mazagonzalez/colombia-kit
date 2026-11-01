# @colombia-kit/direcciones

Parsea, normaliza y formatea direcciones colombianas. No tiene dependencias y funciona desde Node 18, con ESM y CommonJS.

Forma parte de [colombia-kit](https://github.com/Mazagonzalez/colombia-kit).

## Instalación

```bash
npm install @colombia-kit/direcciones
```

## Ejemplos

```ts
import { formatearDireccion, parsearDireccion } from '@colombia-kit/direcciones';

const direccion = parsearDireccion('kra 7a no. 32b-16 apto 301');
// {
//   tipoVia: 'Carrera',
//   numeroVia: '7',
//   letraVia: 'A',
//   numeroCruce: '32',
//   letraCruce: 'B',
//   placa: '16',
//   complemento: 'Apartamento 301',
// }

formatearDireccion(direccion); // 'Cra 7A # 32B-16 Apto 301'
formatearDireccion(direccion, { estilo: 'largo' }); // 'Carrera 7 A # 32 B - 16 Apartamento 301'

parsearDireccion('Cra 7 con Cl 16'); // null
```

## API

| Función                                | Devuelve            | Qué hace                                         |
| -------------------------------------- | ------------------- | ------------------------------------------------ |
| `parsearDireccion(texto)`              | `Direccion \| null` | Separa la dirección y normaliza sus variantes    |
| `formatearDireccion(dir, { estilo? })` | `string \| null`    | Escribe la dirección en estilo `corto` o `largo` |

Ninguna función lanza errores.

### Campos de `Direccion`

Todos los valores son texto, salvo los dos `bis`. Los campos opcionales solo aparecen si la dirección los trae.

| Campo                              | Ejemplo                    | Notas                                                 |
| ---------------------------------- | -------------------------- | ----------------------------------------------------- |
| `tipoVia`                          | `'Avenida Carrera'`        | Siempre el nombre completo                            |
| `numeroVia`                        | `'7'`, `'El Dorado'`       | Número o nombre de la vía                             |
| `letraVia?`, `letraCruce?`         | `'A'`, `'EE'`              | En mayúsculas                                         |
| `bisVia?`, `bisCruce?`             | `true`                     |                                                       |
| `letraBisVia?`, `letraBisCruce?`   | `'A'`                      | La letra de `Calle 39 Bis A`                          |
| `cuadranteVia?`, `cuadranteCruce?` | `'Sur'`                    | `Norte`, `Sur`, `Este` u `Oeste`                      |
| `numeroCruce`                      | `'32'`                     |                                                       |
| `placa`                            | `'05'`, `'20A'`, `'48/50'` | Conserva los ceros, porque `10-05` no es `10-5`       |
| `complemento?`                     | `'Apartamento 301'`        | Todo lo que sigue a la placa, también barrio o ciudad |

## Qué reconoce

- **Tipos de vía:** Carrera, Calle, Avenida, Avenida Calle, Avenida Carrera, Diagonal, Transversal, Circular, Circunvalar, Autopista, Troncal y Vía, con sus abreviaturas (`Cra`, `Kra`, `Cr.`, `KR`, `Cll`, `AC`, `AK`…).
- **Marcadores:** `#`, `No.`, `N°`, `Nº`, `Nro`, `Número`, o ninguno (`Carrera 43 38 Sur 35`).
- **Complementos:** apartamento, torre, interior, local, oficina, piso, edificio, bloque, manzana, casa, barrio y otros, con sus abreviaturas.

La lista completa está en [`data/vias.json`](https://github.com/Mazagonzalez/colombia-kit/blob/main/data/vias.json).

## Cuándo devuelve `null`

Necesita tipo de vía, número o nombre, cruce y placa. Devuelve `null` en lugar de adivinar cuando:

- Es una referencia: `Cra 7 con Cl 16`, `Km 5 vía Tunja`, `Barrio Garupal Mz 36 Cs 10`.
- El tipo de vía no va al inicio: `Edificio Blu Carrera 2 # 12-44`.
- Trae dos vías o más números de los esperados: `Calle 5 Cra 4-12`, `Cra 8 # 21-03-17`.

## Reglas para casos ambiguos

- **`E`** se lee como letra, porque existen direcciones como `Cra 1 E` y `103 EE`. Para Este hay que escribir `Este`.
- **`N`** en la vía es Norte solo si después viene un marcador: `Av 2N # 10-70`. En `Cra 9 N 5-56` es el marcador de número. En el cruce siempre es Norte.
- **`S`** y **`O`** se leen como Sur y Oeste antes de la placa. Después de la placa solo cuenta la palabra completa.
- **Vías con nombre:** el marcador es obligatorio, y sin él `Avenida El Dorado 68-90` devuelve `null`.
- **Una letra después de la placa** solo es parte de ella si va pegada: `16A` sí, y `16 A` queda en el complemento.

## Licencia

[MIT](./LICENSE)
