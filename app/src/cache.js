const { createClient } = require("redis");

const client = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

client.on("error", (error) => {
    console.error("Redis error:", error);
});

async function connectRedis() {
    if (!client.isOpen) {
        await client.connect();
    }
}

module.exports = {
    client,
    connectRedis
};
