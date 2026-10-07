const express = require("express");
const userRepository = require("../repositories/userRepository");

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                error: "username, email y password son obligatorios"
            });
        }

        const existingUser = await userRepository.getUserByEmail(email);

        if (existingUser) {
            return res.status(409).json({
                error: "El email ya está registrado"
            });
        }

        const userId = await userRepository.createUser(
            username,
            email,
            password
        );

        res.status(201).json({
            id: userId,
            username,
            email
        });

    } catch (error) {
        console.error("Register error:", error);

        res.status(500).json({
            error: "Error al registrar el usuario"
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "email y password son obligatorios"
            });
        }

        const user = await userRepository.validateUser(
            email,
            password
        );

        if (!user) {
            return res.status(401).json({
                error: "Credenciales incorrectas"
            });
        }

        res.json({
            message: "Login correcto",
            user
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            error: "Error al iniciar sesión"
        });
    }
});

router.post("/logout", (req, res) => {
    res.json({
        message: "Logout correcto"
    });
});

module.exports = router;