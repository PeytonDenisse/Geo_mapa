# Sistema de Reporte de Baches y Problemas Urbanos

Proyecto final de Aplicacion de Sistemas Geo-referenciados.

## Stack

- Frontend: Angular + Leaflet
- Backend: Node.js + Express
- Base de datos: MongoDB Atlas + Mongoose
- Autenticacion: usuarios en MongoDB + JWT
- Documentacion API: OpenAPI / Swagger en `/api-docs`

## Requisitos cubiertos

- Login y registro con usuarios guardados en MongoDB.
- Dos CRUD internos: reportes urbanos y categorias.
- Categorias iniciales: Bache, Alumbrado, Basura y Señalización.
- CRUD de puntos: registro, edicion, consulta y eliminacion de ubicaciones exactas del problema desde popups del mapa.
- CRUD de zonas: delimitar, editar, consultar y eliminar colonias afectadas.
- CRUD de rutas: trazar, editar, consultar y eliminar calles o tramos afectados.
- Categorias opcionales en puntos, zonas y rutas; el mapa pinta cada elemento con el color de su categoria.
- Reportes vinculados a ubicacion exacta, zona o ruta mediante `targetType` y `targetId`.
- Al crear o editar un reporte, la categoria se sincroniza con el punto, zona o ruta seleccionada.
- Tabla de problemas ubicados actualizada despues de cambios en el mapa.
- Busqueda de problemas por nombre.
- Consulta de reportes cercanos en un radio de 2 km.
- Trazo y guardado permanente de colonias afectadas con puntos de conexion.
- Backend por capas: middlewares, routes, services y models.
- Frontend con plantilla Angular.

## Configuracion

1. Instalar dependencias:

```bash
npm install
npm run install:all
```

2. Crear `backend/.env` basado en `backend/.env.example`:

```env
PORT=4000
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/geo_apoyo?retryWrites=true&w=majority
JWT_SECRET=un_secreto_largo
FRONTEND_URL=http://localhost:4200
```

3. Ejecutar en desarrollo:

```bash
npm run dev
```

4. Abrir:

```text
http://localhost:4200
```

5. Documentacion Swagger:

```text
http://localhost:4000/api-docs
http://localhost:4000/api-docs.json
```

## Build para despliegue

```bash
npm run build --prefix frontend
npm run start --prefix backend
```

El backend sirve el build de Angular desde `frontend/dist/geo-apoyo-angular/browser`.
