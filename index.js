const express = require("express");
const app = express();

app.use(express.json());

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

//----------PRENSA----------//

app.get("/prensa", (req, res) => {
    res.json(fabrica.prensa);
});

app.post("/prensa/estado", (req, res) => {
    const { estado } = req.body;
 
    const estadosValidos = ["APAGADA", "ENCENDIDA", "TRABAJANDO", "ERROR", "MANTENIMIENTO"];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
            error: "Estado no válido",
            estadosValidos
        });
    }
 
    if (fabrica.alarma && estado === "TRABAJANDO") {
        return res.status(403).json({
            error: "No se puede activar la prensa con alarma general activada",
            prensa: fabrica.prensa
        });
    }
 
    fabrica.prensa.estado = estado;
    fabrica.prensa.error = (estado === "ERROR");
 
    res.json({
        mensaje: `Estado de la prensa cambiado a ${estado}`,
        prensa: fabrica.prensa
    });
});

app.post("/prensa/ciclo", (req, res) => {
    if (fabrica.prensa.estado !== "TRABAJANDO") {
        return res.status(400).json({
            error: "La prensa no está en estado TRABAJANDO",
            prensa: fabrica.prensa
        });
    }
 
    fabrica.prensa.ciclos += 1;
 
    res.json({
        mensaje: "Ciclo registrado",
        prensa: fabrica.prensa
    });
});

app.post("/prensa/reset", (req, res) => {
    fabrica.prensa.ciclos = 0;
    fabrica.prensa.error = false;
    fabrica.prensa.estado = "ENCENDIDA";
 
    res.json({
        mensaje: "Prensa reseteada",
        prensa: fabrica.prensa
    });
});

//----------GENERADOR----------//

app.get("/generador", (req, res) => {
    res.json({
        ...fabrica.generador,
        nivelEnergia: fabrica.nivelEnergia
    });
});

app.post("/generador/energia", (req, res) => {
    const { nivelEnergia } = req.body;
 
    if (typeof nivelEnergia !== "number" || nivelEnergia < 0 || nivelEnergia > 100) {
        return res.status(400).json({ error: "nivelEnergia debe ser un número entre 0 y 100" });
    }
 
    fabrica.nivelEnergia = nivelEnergia;
 
    if (nivelEnergia > 50) {
        fabrica.generador.estado = "NORMAL";
        fabrica.alarma = false;
    } else if (nivelEnergia >= 25) {
        fabrica.generador.estado = "BAJO_CONSUMO";
    } else {
        fabrica.generador.estado = "CRITICO";
        fabrica.alarma = true;
    }
 
    res.json({
        mensaje: `Nivel de energía actualizado a ${nivelEnergia}%`,
        nivelEnergia: fabrica.nivelEnergia,
        generador: fabrica.generador,
        alarma: fabrica.alarma
    });
});
 
app.post("/generador/consumo", (req, res) => {
    const { consumo } = req.body;
 
    if (typeof consumo !== "number" || consumo < 0) {
        return res.status(400).json({ error: "consumo debe ser un número positivo" });
    }
 
    fabrica.generador.consumo = consumo;
 
    res.json({
        mensaje: `Consumo actualizado a ${consumo}`,
        generador: fabrica.generador
    });
});

//----------SERVIDOR----------//

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});