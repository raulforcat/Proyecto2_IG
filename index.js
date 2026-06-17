const express = require("express");
const app = express();

let fabrica = {
    modoFabrica: "AUTOMATICO",
    alarma: false,
    nivelEnergia: 72,
    puerta: {
        estado: "CERRADA",       // ABIERTA | CERRADA | BLOQUEADA | ACCESO_DENEGADO
        ultimoAcceso: "NINGUNO"  // RAYCAST | TRIGGER | RFID | NINGUNO
    },
    prensa: {
        estado: "ENCENDIDA",     // APAGADA | ENCENDIDA | TRABAJANDO | ERROR | MANTENIMIENTO
        ciclos: 0,
        error: false
    },
    generador: {
        estado: "NORMAL",        // NORMAL | BAJO_CONSUMO | CRITICO
        consumo: 35
    }
};

app.get("/", (req, res) => {
    res.send("API funcionando");
});

app.post("/fabrica/alarma", (req, res) => {
    const { alarma } = req.body;
 
    if (typeof alarma !== "boolean") {
        return res.status(400).json({ error: "El campo 'alarma' debe ser true o false" });
    }
 
    fabrica.alarma = alarma;
 
    if (alarma) {
        fabrica.puerta.estado = "BLOQUEADA";
    }
 
    res.json({
        mensaje: `Alarma ${alarma ? "activada" : "desactivada"}`,
        fabrica
    });
});

//----------PUERTA----------//

app.get("/puerta", (req, res) => {
    res.json(fabrica.puerta);
});

app.post("/puerta/abrir", (req, res) => {
    const { metodo } = req.body;
 
    const metodosValidos = ["RAYCAST", "TRIGGER", "RFID"];
    if (!metodosValidos.includes(metodo)) {
        return res.status(400).json({ error: "Método no válido. Usa RAYCAST, TRIGGER o RFID" });
    }
 
    if (fabrica.alarma) {
        fabrica.puerta.estado = "BLOQUEADA";
        return res.status(403).json({
            error: "Acceso denegado: alarma general activada",
            puerta: fabrica.puerta
        });
    }
 
    if (fabrica.puerta.estado === "BLOQUEADA") {
        return res.status(403).json({
            error: "La puerta está bloqueada",
            puerta: fabrica.puerta
        });
    }
 
    fabrica.puerta.estado = "ABIERTA";
    fabrica.puerta.ultimoAcceso = metodo;
 
    res.json({
        mensaje: `Puerta abierta mediante ${metodo}`,
        puerta: fabrica.puerta
    });
});

app.post("/puerta/cerrar", (req, res) => {
    if (fabrica.puerta.estado === "BLOQUEADA") {
        return res.status(403).json({
            error: "La puerta está bloqueada y no se puede cerrar manualmente",
            puerta: fabrica.puerta
        });
    }
 
    fabrica.puerta.estado = "CERRADA";
 
    res.json({
        mensaje: "Puerta cerrada",
        puerta: fabrica.puerta
    });
});

app.post("/puerta/bloquear", (req, res) => {
    const { bloquear } = req.body;
 
    if (typeof bloquear !== "boolean") {
        return res.status(400).json({ error: "El campo 'bloquear' debe ser true o false" });
    }
 
    fabrica.puerta.estado = bloquear ? "BLOQUEADA" : "CERRADA";
 
    res.json({
        mensaje: `Puerta ${bloquear ? "bloqueada" : "desbloqueada"}`,
        puerta: fabrica.puerta
    });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});