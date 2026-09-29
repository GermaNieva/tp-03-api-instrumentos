# Trabajo práctico 03

## Descripción

API HTTP hecha con Node.js y Express que administra un catálogo de
instrumentos musicales. Los datos iniciales están en `datos/instrumentos.json`
y la mayoría son instrumentos del folklore argentino y andino (charango,
bombo legüero, quena, etc.).

La API permite:

- ver una bienvenida;
- listar todos los instrumentos;
- filtrar el listado por familia (cuerda, viento, percusión);
- ver el detalle de un instrumento por su id;
- cargar un instrumento nuevo, que se guarda solo en memoria.

Antes de levantar el servidor, `src/index.js` lee el JSON de forma asíncrona
con la función `leerJSON` de `src/archivos.js`. Si el archivo no existe o
tiene un error de formato, se muestra un mensaje de error de inicio y Express
no llega a arrancar.

## Instalación

Hay que tener instalado Node.js. Después, desde la carpeta del proyecto:

```
npm install
```

Eso descarga Express, que es la única dependencia y figura en `dependencies`
dentro de `package.json`.

## Ejecución

```
npm start
```

La terminal muestra:

```
API andando en http://localhost:3000
Instrumentos cargados: 6
Para detener el servidor: Ctrl + C
```

La terminal queda ocupada mientras el servidor está activo. Para detenerlo hay
que apretar **Ctrl + C** en esa misma terminal. No hay que ejecutar
`npm start` en otra terminal sin haber detenido el anterior, porque el puerto
3000 ya está en uso (error `EADDRINUSE`).

También se puede revisar que los archivos no tengan errores de sintaxis:

```
npm run check
```

## Endpoints

| Método | URL                                   | Qué hace                                    |
| ------ | ------------------------------------- | ------------------------------------------- |
| GET    | `/`                                   | Bienvenida, indica que la API está disponible |
| GET    | `/api/instrumentos`                   | Lista todos los instrumentos                |
| GET    | `/api/instrumentos?familia=cuerda`    | Lista solo los de esa familia               |
| GET    | `/api/instrumentos/:id`               | Detalle de un instrumento                   |
| POST   | `/api/instrumentos`                   | Crea un instrumento en memoria              |

### Parámetro de ruta y parámetro de consulta

- **Parámetro de ruta**: es parte del camino de la URL e identifica un recurso
  concreto. En `/api/instrumentos/3`, el `3` llega en `req.params.id` como
  texto (`"3"`), por eso se convierte con `Number` antes de buscarlo con
  `find`.
- **Parámetro de consulta**: va después del `?` en formato `clave=valor` y es
  opcional. No elige un recurso, sino que modifica lo que devuelve el listado.
  En `/api/instrumentos?familia=viento`, el valor llega en
  `req.query.familia`. El filtro usa `filter`, que arma un arreglo nuevo, así
  que la colección original no se modifica. La comparación no distingue
  mayúsculas de minúsculas: `?familia=CUERDA` funciona igual que
  `?familia=cuerda`.

### Cuerpo necesario para POST

La solicitud tiene que llevar el encabezado:

```
Content-Type: application/json
```

Y un cuerpo con estos cinco campos, todos obligatorios:

```json
{
  "nombre": "Violín",
  "familia": "cuerda",
  "origen": "Norte de Italia, siglo XVI",
  "descripcion": "Cuatro cuerdas frotadas con arco, afinadas en quintas.",
  "disponible": true
}
```

El `id` no se manda: lo genera el servidor sumándole 1 al id del último
instrumento del arreglo.

`disponible: false` es un valor válido. Por eso la validación no usa
`!disponible` (que tomaría `false` como si faltara el dato), sino que revisa si
cada campo es `undefined`.

### Para qué sirve `express.json()`

El cuerpo de una solicitud llega como texto. `app.use(express.json())` es un
middleware que, cuando la solicitud trae `Content-Type: application/json`,
convierte ese texto en un objeto y lo deja en `req.body`. Tiene que estar
configurado antes de las rutas. Si faltara, `req.body` quedaría `undefined` y
el POST respondería 400 aunque se mandaran todos los datos.

## Ejemplos de solicitudes

Las pruebas se hicieron con `curl`. También se pueden hacer con Thunder
Client, Postman o, para los GET, con el navegador.

```
curl http://localhost:3000/
curl http://localhost:3000/api/instrumentos
curl "http://localhost:3000/api/instrumentos?familia=cuerda"
curl "http://localhost:3000/api/instrumentos?familia=inexistente"
curl http://localhost:3000/api/instrumentos/1
curl http://localhost:3000/api/instrumentos/999
```

POST válido:

```
curl -X POST http://localhost:3000/api/instrumentos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Violín","familia":"cuerda","origen":"Norte de Italia, siglo XVI","descripcion":"Cuatro cuerdas frotadas con arco, afinadas en quintas.","disponible":true}'
```

POST sin nombre:

```
curl -X POST http://localhost:3000/api/instrumentos \
  -H "Content-Type: application/json" \
  -d '{"familia":"viento","origen":"Puna jujeña","descripcion":"Trompeta larga de caña.","disponible":true}'
```

POST con `disponible: false`:

```
curl -X POST http://localhost:3000/api/instrumentos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Erke","familia":"viento","origen":"Puna jujeña","descripcion":"Trompeta larga de caña con un cuerno en la punta.","disponible":false}'
```

### Matriz de pruebas

| Caso                          | Solicitud                                      | Esperado | Obtenido |
| ----------------------------- | ---------------------------------------------- | -------- | -------- |
| Bienvenida                    | `GET /`                                        | 200      | 200      |
| Listado                       | `GET /api/instrumentos`                        | 200      | 200, 6 instrumentos |
| Filtro con coincidencias      | `GET /api/instrumentos?familia=CUERDA`         | 200      | 200, Charango y Guitarra criolla |
| Filtro sin coincidencias      | `GET /api/instrumentos?familia=inexistente`    | 200      | 200, `[]` |
| Detalle existente             | `GET /api/instrumentos/1`                      | 200      | 200, Charango |
| Detalle inexistente           | `GET /api/instrumentos/999`                    | 404      | 404, `{ "error": "No existe un instrumento con el id 999" }` |
| Creación válida               | `POST /api/instrumentos`                       | 201      | 201, Violín con id 7 |
| Creación sin nombre           | `POST /api/instrumentos`                       | 400      | 400, `{ "error": "Faltan campos obligatorios: nombre" }` |
| Creación con `disponible: false` | `POST /api/instrumentos`                    | 201      | 201, Erke con id 8 y `disponible: false` |

Después de crear los dos instrumentos, el listado devolvió 8 registros (ids 1
a 8). Detuve el servidor con Ctrl + C, lo inicié de nuevo, y el listado volvió
a tener 6. `GET /api/instrumentos/7` respondió 404.

También probé el error de inicio renombrando por un momento
`datos/instrumentos.json`: la terminal mostró `No se pudo iniciar la API, fallo
la lectura de los datos: ENOENT...` y el servidor no arrancó. Después dejé el
archivo con su nombre original.

## Códigos de estado

| Código | Cuándo se usa en esta API |
| ------ | ------------------------- |
| `200 OK` | Lecturas exitosas: bienvenida, listado, filtro y detalle. Un filtro sin coincidencias también es 200 con `[]`, porque la ruta existe y la búsqueda se hizo bien, solo que no encontró nada. |
| `201 Created` | El POST tenía todos los campos y el instrumento se agregó. Devuelve el instrumento creado con su `id`. |
| `400 Bad Request` | Al POST le falta algún campo obligatorio. Devuelve `{ "error": "..." }` con los campos que faltan y no agrega nada. |
| `404 Not Found` | Se pidió el detalle de un id que no existe. Devuelve `{ "error": "..." }`. |

## Persistencia de los datos

Los instrumentos creados con POST **desaparecen al reiniciar el servidor**.

Al arrancar, el programa lee `datos/instrumentos.json` y copia su contenido a
un arreglo que vive en la memoria del proceso. El POST hace `push` sobre ese
arreglo, no sobre el archivo. Mientras el servidor sigue encendido, el
instrumento nuevo aparece en el listado. Cuando el proceso se detiene, esa
memoria se descarta. Al volver a iniciar, se lee otra vez el JSON, que nunca
fue modificado, y el catálogo vuelve a los 6 instrumentos originales.

Para que los cambios se conserven habría que escribirlos en el archivo o usar
una base de datos, y eso está fuera del alcance de este trabajo.
