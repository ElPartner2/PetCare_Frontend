# PetCare Frontend

Cliente web independiente para consumir `PetCare_API`, organizado con el patrón utilizado en Desarrollo de Software I: páginas por componente, navegación, servicios, modelos y estilos globales.

## Ejecución

1. Ejecuta la API Django en `http://localhost:8000`.
2. Desde esta carpeta inicia un servidor web, por ejemplo: `python -m http.server 5500`.
3. Abre `http://localhost:5500`.

No abras `index.html` directamente con `file://`, porque la navegación carga los templates con `fetch`.

## Configuración

La URL del backend se encuentra en `environment.js`. El backend debe permitir mediante CORS el origen usado por el frontend.
