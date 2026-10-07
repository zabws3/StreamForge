const db = require("../db");
const bcrypt = require("bcrypt");

async function getUserById(id) {
    const [rows] = await db.query(
        `SELECT
            user_id AS id,
            username,
            email,
            password_hash AS passwordHash
         FROM users
         WHERE user_id = ?`,
        [id]
    );

    return rows[0] || null;
}

async function getUserByEmail(email) {
    const [rows] = await db.query(
        `SELECT
            user_id AS id,
            username,
            email,
            password_hash AS passwordHash
         FROM users
         WHERE email = ?`,
        [email]
    );

    return rows[0] || null;
}

async function createUser(username, email, password) {
    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await db.query(
        `INSERT INTO users
            (username, email, password_hash)
         VALUES (?, ?, ?)`,
        [username, email, passwordHash]
    );

    return result.insertId;
}

async function validateUser(email, password) {
    const user = await getUserByEmail(email);

    if (!user) {
        return null;
    }

    const validPassword = await bcrypt.compare(
        password,
        user.passwordHash
    );

    if (!validPassword) {
        return null;
    }

    return {
        id: user.id,
        username: user.username,
        email: user.email
    };
}

async function deleteUser(id) {
    const [result] = await db.query(
        `DELETE FROM users
         WHERE user_id = ?`,
        [id]
    );

    return result.affectedRows > 0;
}

module.exports = {
    getUserById,
    getUserByEmail,
    createUser,
    validateUser,
    deleteUser
};