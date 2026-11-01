# @colombia-kit/nit

Calcula el dígito de verificación (DV) y valida, formatea y limpia NIT colombianos con el algoritmo módulo 11 de la DIAN. No tiene dependencias y funciona desde Node 18, con ESM y CommonJS.

Forma parte de [colombia-kit](https://github.com/Mazagonzalez/colombia-kit).

## Instalación

```bash
npm install @colombia-kit/nit
```

## Ejemplos

```ts
import { calcularDV, formatearNIT, limpiarNIT, validarNIT } from '@colombia-kit/nit';

calcularDV('800.197.268'); // 4

validarNIT('800.197.268-4'); // true
validarNIT('800.197.268-5'); // false

formatearNIT('8001972684'); // '800.197.268-4'
formatearNIT('800197268'); // '800.197.268-4'

limpiarNIT('800.197.268-4'); // { numero: '800197268', dv: 4 }
limpiarNIT('800197268'); // { numero: '800197268', dv: null }
```

## API

Las funciones aceptan texto o números y no lanzan errores: una entrada inválida devuelve `null` (`false` en `validarNIT`).

| Función             | Devuelve                                         | Qué hace                                               |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| `calcularDV(nit)`   | `number \| null`                                 | Calcula el DV. Si la entrada trae un DV, lo ignora     |
| `validarNIT(nit)`   | `boolean`                                        | `true` solo si el NIT trae DV y este es correcto       |
| `formatearNIT(nit)` | `string \| null`                                 | Da el formato `800.197.268-4` y calcula el DV si falta |
| `limpiarNIT(nit)`   | `{ numero: string, dv: number \| null } \| null` | Separa el número y el DV, sin comprobar el DV          |

## Cómo se lee la entrada

Se ignoran los puntos y los espacios. El DV se reconoce así:

| Entrada         | Número       | DV     | Motivo                                |
| --------------- | ------------ | ------ | ------------------------------------- |
| `800.197.268-4` | `800197268`  | `4`    | Lo que sigue al guion es el DV        |
| `1012345678-9`  | `1012345678` | `9`    | Con guion, hasta 15 dígitos de número |
| `8001972684`    | `800197268`  | `4`    | Sin guion, 10 dígitos son 9 + DV      |
| `800197268`     | `800197268`  | `null` | Sin guion, menos de 10 no traen DV    |
| `10123456789`   | no válido    |        | Sin guion, más de 10 son ambiguos     |

**Las cédulas de 10 dígitos deben llevar guion.** `1012345678` se lee como el número `101234567` con DV `8`, porque sin guion no se puede distinguir de un NIT de 9 dígitos con su DV. `calcularDV` es la excepción: como su entrada es el número, usa todos los dígitos que hay antes del guion.

## Licencia

[MIT](./LICENSE)
