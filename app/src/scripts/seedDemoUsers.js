
const db = require("../db");
const bcrypt = require("bcrypt");

async function seedDemoUsers() {
    // Las cuentas predeterminadas solo pueden crearse en desarrollo.
    if (
        process.env.NODE_ENV === "production" ||
        process.env.SEED_DEMO_USERS !== "true"
    ) {
        return;
    }

    const accounts = [
        {
            username: "Admin",
            email: "admin@admin.com",
            password: "admin123",
            role: "admin"
        },
        {
            username: "Usuario",
            email: "usuario@usuario.com",
            password: "usuario123",
            role: "user"
        }
    ];

    const [columns] = await db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'users'
           AND COLUMN_NAME = 'role'`
    );

    if (columns.length === 0) {
        await db.query(
            `ALTER TABLE users
             ADD COLUMN role ENUM('user', 'admin')
             NOT NULL DEFAULT 'user'`
        );
    }

    for (const account of accounts) {
        const [existing] = await db.query(
            `SELECT user_id FROM users
             WHERE email = ? OR username = ?`,
            [account.email, account.username]
        );

        if (existing.length > 0) {
            console.log(
                `Cuenta de demostración ya existente: ${account.email}`
            );
            continue;
        }

        const passwordHash = await bcrypt.hash(account.password, 12);

        await db.query(
            `INSERT INTO users
                (username, email, password_hash, role)
             VALUES (?, ?, ?, ?)`,
            [
                account.username,
                account.email,
                passwordHash,
                account.role
            ]
        );

        console.log(`Cuenta de demostración creada: ${account.email}`);
    }
}

module.exports = seedDemoUsers;
