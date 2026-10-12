const express = require("express");
const db = require("./db");
const { client: redis, connectRedis } = require("./cache");
const authRoutes = require("./routes/auth");
const videoRoutes = require("./routes/videos");
const streamRoutes = require("./routes/stream");
const session = require("express-session");
const { RedisStore } = require("connect-redis");
const requireAuth = require("./middleware/requireAuth");
const adminRoutes = require("./routes/admin");
const path = require("path");
const seedDemoUsers = require("./scripts/seedDemoUsers");


const app = express();

const PORT = 3000;

app.use(express.json());


const sessionOptions = {
    name: "streamforge.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 8 * 60 * 60 * 1000
    }
};

if (!sessionOptions.secret) {
    throw new Error("Falta configurar SESSION_SECRET");
}

if (process.env.REDIS_HOST) {
    sessionOptions.store = new RedisStore({
        client: redis,
        prefix: "streamforge:sess:"
    });
}

const sessionMiddleware = session(sessionOptions);

app.use(async (req, res, next) => {
    try {
        if (process.env.REDIS_HOST) {
            await connectRedis();
        }

        sessionMiddleware(req, res, next);
    } catch (error) {
        next(error);
    }
});


app.get("/player.html", (req, res) => {
    if (!req.session || !req.session.user) {
        return res.redirect("/login.html");
    }

    res.sendFile(path.join(__dirname, "../public/player.html"));
});

const requireAdmin = require("./middleware/requireAdmin");

app.get("/admin.html", (req, res, next) => {
    requireAdmin(req, res, (error) => {
        if (error) return next(error);

        res.sendFile(
            path.join(__dirname, "../public/admin.html")
        );
    });
});


app.use(express.static(path.join(__dirname, "../public")));



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

app.get("/services", async (req, res) => {
    try {
        if (process.env.REDIS_HOST) {
            await connectRedis();

            const cachedServices = await redis.get("services");

            if (cachedServices) {
                return res.json({
                    source: "redis",
                    data: JSON.parse(cachedServices)
                });
            }
        }

        const [rows] = await db.query(
            "SELECT id, name, status FROM services"
        );

        if (process.env.REDIS_HOST) {
            await redis.setEx("services", 60, JSON.stringify(rows));
        }

        res.json({
            source: "mysql",
            data: rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "error"
        });
    }
});

app.use("/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/video/stream", requireAuth, streamRoutes);
app.use("/api/admin", adminRoutes);


async function startServer() {
    try {
        await db.query("SELECT 1");
        await seedDemoUsers();

        app.listen(PORT, () => {
            console.log(`StreamForge listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("No se pudo inicializar StreamForge:", error);
        process.exit(1);
    }
}

startServer();