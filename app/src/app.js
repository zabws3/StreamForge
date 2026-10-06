const express = require("express");
const db = require("./db");
const { client: redis, connectRedis } = require("./cache");

const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
    res.send("StreamForge is running!");
});

app.get("/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        let cacheStatus = "disabled";

        if (process.env.REDIS_HOST) {
            await connectRedis();
            await redis.ping();
            cacheStatus = "connected";
        }

        res.json({
            status: "ok",
            database: "connected",
            cache: cacheStatus
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            database: "disconnected"
        });
    }
});

app.listen(PORT, () => {
    console.log(`StreamForge listening on port ${PORT}`);
});
