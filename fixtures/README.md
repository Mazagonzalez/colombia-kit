# Fixtures

Casos de prueba compartidos (entrada → salida esperada). Los tests de JS y de PHP leen estos mismos archivos, y así se garantiza que ambas versiones dan resultados idénticos.

- Si agregas un caso, debe pasar en los dos lenguajes.
- Los NIT reales llevan su fuente, y su DV se calcula antes de usarlos.
- Los casos de DIVIPOLA no fijan totales que cambien con cada actualización, para que el robot mensual no los rompa.
- Las direcciones reales son solo de entidades públicas (alcaldías, universidades, hospitales), con su fuente. Nunca de viviendas ni de personas.
