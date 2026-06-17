const express = require('express');
const app = express();

app.get('/estado', (req, res) => {
    res.json({ status: "Servidor en funcionamiento" });
});

app.get("/puerta", (req, res) => {
    res.json({
        estado: "abierta"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});