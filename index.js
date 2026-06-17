const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("API funcionando");
});

app.get("/puerta", (req, res) => {
    res.json({
        estado: "abierta"
    });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});