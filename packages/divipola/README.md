# @colombia-kit/divipola

Departamentos y municipios de Colombia con los códigos DIVIPOLA del DANE. No tiene dependencias y funciona desde Node 18, con ESM y CommonJS. Los datos se comparan cada mes con la fuente oficial.

Forma parte de [colombia-kit](https://github.com/Mazagonzalez/colombia-kit).

## Instalación

```bash
npm install @colombia-kit/divipola
```

## Ejemplos

```ts
import { buscarMunicipio, departamentos, municipios, porCodigo } from '@colombia-kit/divipola';

departamentos()[0]; // { codigo: '05', nombre: 'Antioquia', nombreOficial: 'ANTIOQUIA' }

municipios('88').map((m) => m.nombre); // ['San Andrés', 'Providencia']

buscarMunicipio('medellin')[0]?.codigo; // '05001'
buscarMunicipio('cali')[0]?.nombre; // 'Santiago de Cali'

porCodigo('05')?.nombre; // 'Antioquia'
porCodigo('05001')?.nombre; // 'Medellín'
porCodigo('99999'); // null
```

## API

| Función                    | Devuelve                            | Qué hace                                                     |
| -------------------------- | ----------------------------------- | ------------------------------------------------------------ |
| `departamentos()`          | `readonly Departamento[]`           | Lista los departamentos, incluido Bogotá, D.C.               |
| `municipios(codigoDepto?)` | `readonly Municipio[]`              | Lista los municipios, todos o los de un departamento         |
| `buscarMunicipio(nombre)`  | `readonly Municipio[]`              | Busca sin distinguir mayúsculas, tildes ni puntuación        |
| `porCodigo(codigo)`        | `Departamento \| Municipio \| null` | Busca por código de 2 dígitos (departamento) o 5 (municipio) |

`buscarMunicipio` devuelve primero las coincidencias exactas, después las de palabras completas y por último las parciales. Varios municipios pueden compartir nombre: `narino` encuentra tres. La ñ se compara como n.

Ninguna función lanza errores. Los códigos deben ser texto, porque como número se perdería el cero inicial de `05001`.

### Tipos

```ts
interface Departamento {
  codigo: CodigoDepartamento; // '05' | '08' | …
  nombre: string; // 'Valle del Cauca'
  nombreOficial: string; // 'VALLE DEL CAUCA', tal como lo publica el DANE
}

interface Municipio {
  codigo: CodigoMunicipio; // '05001' | '05002' | …
  nombre: string;
  nombreOficial: string;
  tipo: 'Municipio' | 'Isla' | 'Área no municipalizada';
  codigoDepartamento: CodigoDepartamento;
  departamento: string;
  latitud: number;
  longitud: number;
}
```

`nombre` se deriva de `nombreOficial` con una regla automática. Si necesitas el nombre exacto de la fuente, usa `nombreOficial`.

## Cargar solo lo necesario

Los datos de municipios pesan cerca de 225 KB sin comprimir. Si solo necesitas una parte, importa desde su entrada:

```ts
import { departamentos } from '@colombia-kit/divipola/departamentos'; // no carga los municipios
import { buscarMunicipio, municipios } from '@colombia-kit/divipola/municipios';
```

## Licencia

El código usa licencia MIT. Los datos son del DANE y se distribuyen bajo CC BY-SA 4.0, con transformaciones de formato y nombres derivados. Los detalles están en [LICENSE](./LICENSE).
