const express = require("express");
const userRepository = require("../repositories/userRepository");

const router = express.Router();

function createSession(req, res, user, statusCode = 200) {
    req.session.regenerate((error) => {
        if (error) {
            console.error("Session creation error:", error);
            return res.status(500).json({
                error: "No se ha podido crear la sesión"
            });
        }

        req.session.user = user;

        req.session.save((saveError) => {
            if (saveError) {
                console.error("Session save error:", saveError);
                return res.status(500).json({
                    error: "No se ha podido guardar la sesión"
                });
            }

            res.status(statusCode).json({ user });
        });
    });
}

// GET /auth/me
router.get("/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            error: "No has iniciado sesión"
        });
    }

    res.json({ user: req.session.user });
});

// POST /auth/register
router.post("/register", async (req, res) => {
    try {
        const username =
            typeof req.body.username === "string"
                ? req.body.username.trim()
                : "";

        const email =
            typeof req.body.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "";

        const password = req.body.password;

        if (!username || !email || typeof password !== "string" || !password) {
            return res.status(400).json({
                error: "Nombre, email y contraseña son obligatorios"
            });
        }

        if (username.length < 2 || username.length > 40) {
            return res.status(400).json({
                error: "El nombre debe tener entre 2 y 40 caracteres"
            });
        }

        if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({
                error: "La contraseña debe tener al menos 8 caracteres y un máximo de 72 bytes"
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
            return res.status(400).json({
                error: "Introduce un email válido"
            });
        }

        const existingUser = await userRepository.getUserByEmail(email);

        if (existingUser) {
            return res.status(409).json({
                error: "El email ya está registrado"
            });
        }

        const id = await userRepository.createUser(
            username,
            email,
            password
        );

        createSession(
            req,
            res,
            { id, username, email },
            201
        );
    } catch (error) {
        console.error("Register error:", error);

        res.status(500).json({
            error: "Error al registrar el usuario"
        });
    }
});

// POST /auth/login
router.post("/login", async (req, res) => {
    try {
        const email =
            typeof req.body.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "";

        const password = req.body.password;

        if (!email || typeof password !== "string" || !password) {
            return res.status(400).json({
                error: "Email y contraseña son obligatorios"
            });
        }

        const user = await userRepository.validateUser(email, password);

        if (!user) {
            return res.status(401).json({
                error: "Email o contraseña incorrectos"
            });
        }

        createSession(req, res, user);
    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            error: "Error al iniciar sesión"
        });
    }
});

// POST /auth/logout
router.post("/logout", (req, res) => {
    if (!req.session) {
        res.clearCookie("streamforge.sid");
        return res.json({ message: "Sesión cerrada" });
    }

    req.session.destroy((error) => {
        if (error) {
            console.error("Logout error:", error);
            return res.status(500).json({
                error: "No se ha podido cerrar la sesión"
            });
        }

        res.clearCookie("streamforge.sid", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        });

        res.json({ message: "Sesión cerrada correctamente" });
    });
});

module.exports = router;