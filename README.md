# colombia-kit

[![CI](https://github.com/Mazagonzalez/colombia-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/Mazagonzalez/colombia-kit/actions/workflows/ci.yml)
[![Licencia: MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)

Utilidades open source para desarrolladores que trabajan con datos colombianos: NIT, DIVIPOLA y direcciones. Disponible para JavaScript/TypeScript y para PHP con integración para Laravel, con la misma lógica y los mismos resultados en ambos lenguajes.

> **Estado:** los paquetes de JavaScript/TypeScript ya están publicados en npm. La versión de PHP está en desarrollo y todavía no está publicada en Packagist.

## Por qué existe

Casi todos los proyectos colombianos terminan reescribiendo lo mismo: el dígito de verificación del NIT, la lista de municipios o un parser de direcciones que entienda que "Cra", "Kra" y "KR" son lo mismo. colombia-kit reúne esa lógica en un solo lugar, sin dependencias, con datos oficiales actualizados y con casos de prueba compartidos entre lenguajes.

## Paquetes

| Paquete                     | Qué hace                                        | npm                                                                                                                       |
| --------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `@colombia-kit/nit`         | Calcula el DV y valida, formatea y limpia NIT   | [![npm](https://img.shields.io/npm/v/@colombia-kit/nit)](https://www.npmjs.com/package/@colombia-kit/nit)                 |
| `@colombia-kit/divipola`    | Departamentos y municipios con códigos del DANE | [![npm](https://img.shields.io/npm/v/@colombia-kit/divipola)](https://www.npmjs.com/package/@colombia-kit/divipola)       |
| `@colombia-kit/direcciones` | Parsea, normaliza y formatea direcciones        | [![npm](https://img.shields.io/npm/v/@colombia-kit/direcciones)](https://www.npmjs.com/package/@colombia-kit/direcciones) |

| Paquete Composer            | Qué hace                                                  | Packagist                                                                                                                              |
| --------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `colombia-kit/colombia-kit` | NIT, DIVIPOLA, direcciones y reglas de validación Laravel | [![Packagist](https://img.shields.io/packagist/v/colombia-kit/colombia-kit)](https://packagist.org/packages/colombia-kit/colombia-kit) |

## Ejemplos rápidos

### JavaScript / TypeScript

```ts
import { validarNIT, calcularDV } from '@colombia-kit/nit';
import { buscarMunicipio } from '@colombia-kit/divipola';
import { parsearDireccion } from '@colombia-kit/direcciones';

calcularDV('800197268'); // 4
validarNIT('800.197.268-4'); // true

buscarMunicipio('medellin');
parsearDireccion('Cra 7 # 45-20 Apto 301');
// { tipoVia: 'Carrera', numeroVia: '7', numeroCruce: '45', placa: '20', complemento: 'Apartamento 301' }
```

### PHP

```php
use ColombiaKit\Direcciones;
use ColombiaKit\Divipola;
use ColombiaKit\Nit;

Nit::calcularDV('800197268'); // 4
Nit::validar('800.197.268-4'); // true

Divipola::buscarMunicipio('medellin');
Direcciones::parsear('Cra 7 # 45-20 Apto 301');
// ['tipoVia' => 'Carrera', 'numeroVia' => '7', 'numeroCruce' => '45', 'placa' => '20', 'complemento' => 'Apartamento 301']
```

### Laravel

```php
$request->validate([
    'nit' => 'required|nit',
    'ciudad' => 'required|municipio',
    'direccion' => 'required|direccion',
]);
```

Los detalles están en el [README de PHP](php/README.md).

## Una sola fuente de verdad

Los datos viven en [`data/`](data/README.md) y los casos de prueba en [`fixtures/`](fixtures/README.md). Ambos son JSON independiente del lenguaje, y los tests de JS y de PHP leen los mismos archivos.

## Contribuir

Lee la [guía de contribución](CONTRIBUTING.md) y el [código de conducta](CODE_OF_CONDUCT.md).

## Licencia

El código usa licencia [MIT](LICENSE). Los datos de DIVIPOLA son del DANE y se distribuyen bajo CC BY-SA 4.0; los detalles están en [`data/README.md`](data/README.md).
