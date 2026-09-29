// Este modulo se encarga solo de leer archivos, no sabe nada de Express

const fs = require("node:fs/promises");

// lee un archivo json y lo devuelve ya convertido en objeto/arreglo
async function leerJSON(ruta) {
  const contenido = await fs.readFile(ruta, "utf8");
  const datos = JSON.parse(contenido);
  return datos;
}

module.exports = { leerJSON };
