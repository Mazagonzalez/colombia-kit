# Cómo contribuir

¡Gracias por ayudar! Esta guía resume lo que necesitas para enviar un cambio.

## La regla principal: una sola fuente de verdad

colombia-kit tiene implementaciones en JavaScript/TypeScript y en PHP que deben dar **exactamente los mismos resultados**. Para garantizarlo:

- **Los datos viven en `data/`.** Nunca edites las copias de los paquetes a mano.
- **Los casos de prueba viven en `fixtures/`.** Son JSON de entrada → salida esperada, y los tests de ambos lenguajes leen los mismos archivos.
- **Si agregas un caso, debe pasar en los dos lenguajes.** Si corriges un error, agrega primero el fixture que lo demuestra.

Más detalles en [`fixtures/README.md`](fixtures/README.md) y [`data/README.md`](data/README.md).

## Preparar el entorno

Necesitas Node 22.12 o superior (solo para desarrollar; los paquetes funcionan desde Node 18) y pnpm.

```bash
pnpm install
```

```bash
pnpm verificar
```

`pnpm verificar` comprueba que los archivos generados coincidan con `data/` y corre lint, formato, tipos, tests con cobertura (mínimo 90 %), build y la prueba de carga de los paquetes.

## Enviar un cambio

1. Crea una rama desde `main`: nunca se hacen commits directos a `main`.
2. Usa [Conventional Commits](https://www.conventionalcommits.org/es/): `feat(nit): …`, `fix(direcciones): …`, `chore: …`.
3. Si el cambio afecta a un paquete publicado, agrega un changeset con `pnpm changeset`.
4. Abre un PR y completa la plantilla. Todos los PR pasan por el mismo CI, y nada se mergea solo.

## Código de conducta

Al participar aceptas nuestro [código de conducta](CODE_OF_CONDUCT.md).
