const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000; // Para Render

// Configurar sesiones
app.use(session({
  secret: "lilyrosedepp",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 } // 30 días
}));

// Leer JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir carpeta public
app.use(express.static(path.join(__dirname, "public")));

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Middleware para proteger APIs
function protegerAPI(req, res, next) {
  if (req.session.autenticado) {
    next();
  } else {
    res.status(403).json({ error: "No autorizado" });
  }
}

// Ruta para enviar mensajes (pública)
app.post("/enviar", (req, res) => {
  const nuevoMensaje = req.body.mensaje;

  if (!nuevoMensaje) {
    return res.status(400).json({ error: "Mensaje vacío" });
  }

  fs.readFile("messages.json", "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Error leyendo mensajes" });

    const mensajes = JSON.parse(data);
    mensajes.push({
      mensaje: nuevoMensaje,
      fecha: new Date().toISOString()
    });

    fs.writeFile("messages.json", JSON.stringify(mensajes, null, 2), err => {
      if (err) return res.status(500).json({ error: "Error guardando mensaje" });
      res.status(200).json({ success: true });
    });
  });
});

// Ruta para obtener mensajes (protegida)
app.get("/api/messages", protegerAPI, (req, res) => {
  fs.readFile("messages.json", "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Error al leer mensajes" });
    res.json(JSON.parse(data));
  });
});

// Ruta para borrar un mensaje por índice (protegida)
app.delete("/api/messages/:index", protegerAPI, (req, res) => {
  const index = parseInt(req.params.index);

  fs.readFile("messages.json", "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Error al leer mensajes" });

    const mensajes = JSON.parse(data);
    if (index < 0 || index >= mensajes.length) {
      return res.status(400).json({ error: "Índice inválido" });
    }

    mensajes.splice(index, 1);

    fs.writeFile("messages.json", JSON.stringify(mensajes, null, 2), err => {
      if (err) return res.status(500).json({ error: "Error al borrar mensaje" });
      res.json({ success: true });
    });
  });
});

// Autenticación
const CLAVE_CORRECTA = "lilyrosedepp";

app.post("/login", (req, res) => {
  const claveIngresada = req.body.clave;

  if (claveIngresada === CLAVE_CORRECTA) {
    req.session.autenticado = true;
    res.redirect("/mensajes.html");
  } else {
    res.send("❌ Clave incorrecta. <a href='/login.html'>Volver</a>");
  }
});

// Proteger la bandeja
app.use("/mensajes.html", (req, res, next) => {
  if (req.session.autenticado) {
    next();
  } else {
    res.redirect("/login.html");
  }
});

// Iniciar el servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

