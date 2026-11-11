# TuControl · Sitio y demo

Sitio estático de TuControl para publicar en Netlify.

| Ruta | Qué es |
|---|---|
| `/` | Página principal para clientes, con el formulario "Solicita una demo" |
| `/demo/` | Demo interactiva con datos de ejemplo (se guarda en el navegador) |
| `/socios-2026/` | Presentación para socios e inversores (no enlazada, sin indexar) |
| `/privacidad/` | Política de privacidad (borrador) |
| `/gracias/` | Confirmación del formulario |

## Uso

```bash
npm install
npm run dev      # desarrollo en http://localhost:5173
npm run build    # genera dist/
```

## Pendientes antes de publicar

- `privacidad/index.html`: completar los datos entre corchetes y pedir revisión legal.
- `socios-2026/index.html`: completar los bloques marcados como pendientes.

## Netlify

`netlify.toml` ya define el comando de compilación (`npm run build`) y la carpeta publicada (`dist`).
