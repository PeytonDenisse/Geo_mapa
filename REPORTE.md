# Reporte de desarrollo

## Portada institucional

Universidad La Salle Bajio  
Materia: Aplicacion de Sistemas Geo-referenciados  
Proyecto final: Sistema de Reporte de Baches y Problemas Urbanos  

## Problematica

Los ciudadanos no cuentan con una plataforma centralizada para reportar
problemas urbanos como baches, fallas de alumbrado, acumulacion de basura o
daños en señalizacion. Esto provoca que los reportes queden dispersos y sea
mas dificil priorizar su atencion.

El Sistema de Reporte de Baches y Problemas Urbanos permite registrar la
ubicacion exacta del problema, clasificarlo por categoria, consultar reportes
cercanos, delimitar colonias afectadas y dar seguimiento al estado del reporte.

## Desarrollo paso a paso

1. Se creo un backend con Node.js, Express y MongoDB usando Mongoose.
2. Se agregaron modelos para usuarios, ubicaciones, zonas, rutas, reportes y categorias.
3. Se separo la logica en capas: middlewares, routes, services y models.
4. Se implemento autenticacion con registro, login, hash de password y JWT.
5. Se construyo el frontend con Angular y Leaflet.
6. Se agrego el mapa principal para marcar ubicaciones exactas de problemas urbanos.
7. Se programaron popups editables para actualizar o eliminar ubicaciones.
8. Se agrego una tabla de problemas ubicados que se recarga al guardar cambios.
9. Se implemento busqueda de ubicaciones por nombre desde MongoDB.
10. Se agrego consulta de reportes cercanos a una ubicacion.
11. Se agrego el modo de dibujo de colonias afectadas con puntos conectados.
12. Se agrego el modo de dibujo de rutas o tramos afectados con puntos conectados.
13. Se agregaron CRUD completos de puntos, zonas y rutas.
14. Se agregaron dos CRUD internos: reportes y categorias.
15. Se vincularon los reportes con tres tipos de destino: punto, zona o ruta.
16. Se agrego categoria opcional a puntos, zonas y rutas para colorear el mapa.
17. Se sincronizo la categoria del reporte con el elemento georeferenciado seleccionado.
18. Se agrego documentacion OpenAPI / Swagger en `/api-docs`.

## Resultados

La aplicacion permite a un usuario crear una cuenta, iniciar sesion, administrar
ubicaciones exactas de problemas urbanos, consultar la informacion registrada,
buscar problemas, trazar colonias afectadas, registrar rutas urbanas afectadas
y gestionar reportes con categoria, tipo de destino y estado: pendiente, en
proceso o resuelto.

## Conclusiones

El proyecto integra los temas principales del semestre: uso de mapas web,
persistencia en MongoDB, referencias entre entidades, separacion por capas en
backend, validacion, manejo de errores y desarrollo de una interfaz web con una
plantilla moderna de Angular.
