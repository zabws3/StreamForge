const express = require("express");

const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
    res.send("StreamForge is running!");
});

app.get("/health", (req, res) => {
    res.json({
        status: "ok"
    });
});

app.listen(PORT, () => {
    console.log(`StreamForge listening on port ${PORT}`);
});
