const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Obtener mensajes
app.get("/api/messages", (req, res) => {
  try {
    const data = fs.readFileSync("messages.json", "utf8");
    const mensajes = JSON.parse(data);
    res.json(mensajes);
  } catch (err) {
    console.error("Error leyendo mensajes:", err);
    res.status(500).json({ error: "Error leyendo mensajes" });
  }
});

// Enviar mensaje (ahora con lectura/escritura inmediata para evitar pérdida)
app.post("/enviar", (req, res) => {
  const nuevoMensaje = req.body.mensaje?.trim();
  if (!nuevoMensaje) {
    return res.status(400).json({ error: "Mensaje vacío" });
  }

  try {
    // Leer el archivo actualizado
    const data = fs.readFileSync("messages.json", "utf8");
    const mensajes = JSON.parse(data);

    // Agregar mensaje
    mensajes.push({
      mensaje: nuevoMensaje,
      fecha: new Date().toISOString()
    });

    // Guardar inmediatamente
    fs.writeFileSync("messages.json", JSON.stringify(mensajes, null, 2), "utf8");

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error guardando mensaje:", err);
    res.status(500).json({ error: "Error guardando mensaje" });
  }
});

// Borrar mensaje por índice
app.delete("/api/messages/:index", (req, res) => {
  const index = parseInt(req.params.index);
  try {
    const data = fs.readFileSync("messages.json", "utf8");
    let mensajes = JSON.parse(data);

    if (index < 0 || index >= mensajes.length) {
      return res.status(404).json({ error: "Mensaje no encontrado" });
    }

    mensajes.splice(index, 1);

    fs.writeFileSync("messages.json", JSON.stringify(mensajes, null, 2), "utf8");

    res.json({ success: true });
  } catch (err) {
    console.error("Error borrando mensaje:", err);
    res.status(500).json({ error: "Error borrando mensaje" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
