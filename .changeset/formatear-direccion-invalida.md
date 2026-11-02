---
'@colombia-kit/direcciones': patch
---

`formatearDireccion` devuelve `null` si faltan campos obligatorios o el tipo de vía no existe, en vez de un texto con `undefined`, e ignora los campos opcionales que no son texto, igual que la versión de PHP.
