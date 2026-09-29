// Archivo principal del TP 03
// Levanta una API HTTP con Express para el catalogo de instrumentos musicales

const path = require("node:path");
const express = require("express");

const { leerJSON } = require("./archivos");

const PUERTO = 3000;
const rutaDatos = path.join(__dirname, "..", "datos", "instrumentos.json");
const CAMPOS_OBLIGATORIOS = ["nombre", "familia", "origen", "descripcion", "disponible"];

// Aca viven los instrumentos mientras el servidor esta encendido.
// Se llena al arrancar con lo que hay en el JSON.
let instrumentos = [];

// ---------------------------------------------------------------
// Creacion de la app y rutas
// ---------------------------------------------------------------

function crearApp() {
  const app = express();

  // Convierte el cuerpo JSON de los POST en un objeto dentro de req.body.
  // Tiene que ir antes de las rutas.
  app.use(express.json());

  // Bienvenida
  app.get("/", function (req, res) {
    res.status(200).json({
      mensaje: "API de instrumentos musicales disponible",
      instrumentosCargados: instrumentos.length,
      endpoints: [
        "GET /api/instrumentos",
        "GET /api/instrumentos?familia=cuerda",
        "GET /api/instrumentos/:id",
        "POST /api/instrumentos",
      ],
    });
  });

  // Listado completo o filtrado por familia (?familia=...)
  app.get("/api/instrumentos", function (req, res) {
    const familia = req.query.familia;

    if (familia === undefined) {
      res.status(200).json(instrumentos);
      return;
    }

    // filter devuelve un arreglo nuevo, la coleccion original no se toca
    const buscada = String(familia).trim().toLowerCase();
    const filtrados = instrumentos.filter(function (instrumento) {
      return instrumento.familia.toLowerCase() === buscada;
    });

    // si no hay coincidencias igual es 200, con un arreglo vacio
    res.status(200).json(filtrados);
  });

  // Detalle de un instrumento por id
  app.get("/api/instrumentos/:id", function (req, res) {
    const id = Number(req.params.id);
    const instrumento = instrumentos.find(function (item) {
      return item.id === id;
    });

    if (!instrumento) {
      res.status(404).json({
        error: "No existe un instrumento con el id " + req.params.id,
      });
      return;
    }

    res.status(200).json(instrumento);
  });

  // Alta de un instrumento (solo en memoria)
  app.post("/api/instrumentos", function (req, res) {
    // si no llega un cuerpo JSON, req.body queda undefined
    const datos = req.body || {};

    // Se compara contra undefined y no con !datos.campo,
    // porque disponible: false es un valor valido.
    const faltantes = CAMPOS_OBLIGATORIOS.filter(function (campo) {
      return datos[campo] === undefined;
    });

    if (faltantes.length > 0) {
      res.status(400).json({
        error: "Faltan campos obligatorios: " + faltantes.join(", "),
      });
      return;
    }

    const nuevo = {
      id: proximoId(),
      nombre: datos.nombre,
      familia: datos.familia,
      origen: datos.origen,
      descripcion: datos.descripcion,
      disponible: datos.disponible,
    };

    instrumentos.push(nuevo);

    res.status(201).json(nuevo);
  });

  return app;
}

// ---------------------------------------------------------------
// Funciones auxiliares
// ---------------------------------------------------------------

// los ids estan ordenados, asi que alcanza con mirar el ultimo
function proximoId() {
  if (instrumentos.length === 0) {
    return 1;
  }

  const ultimo = instrumentos[instrumentos.length - 1];
  return ultimo.id + 1;
}

// ---------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------

async function main() {
  try {
    // Primero se leen los datos iniciales.
    instrumentos = await leerJSON(rutaDatos);
  } catch (error) {
    console.error("No se pudo iniciar la API, fallo la lectura de los datos: " + error.message);
    process.exitCode = 1;
    return;
  }

  // Recien cuando el JSON se leyo bien se crea Express y empieza a escuchar.
  const app = crearApp();

  app.listen(PUERTO, function () {
    console.log("API andando en http://localhost:" + PUERTO);
    console.log("Instrumentos cargados: " + instrumentos.length);
    console.log("Para detener el servidor: Ctrl + C");
  });
}

main();
