const db = require("../db");

async function getCategoryById(id) {
    const [rows] = await db.query(
        `SELECT
            category_id AS id,
            name,
            description
         FROM categories
         WHERE category_id = ?`,
        [id]
    );

    return rows[0] || null;
}

async function getAllCategories() {
    const [rows] = await db.query(
        `SELECT
            category_id AS id,
            name,
            description
         FROM categories
         ORDER BY name ASC`
    );

    return rows;
}

async function createCategory(category) {
    const [result] = await db.query(
        `INSERT INTO categories
            (name, description)
         VALUES (?, ?)`,
        [
            category.name,
            category.description
        ]
    );

    return result.insertId;
}

async function updateCategory(id, category) {
    const [result] = await db.query(
        `UPDATE categories
         SET
            name = ?,
            description = ?
         WHERE category_id = ?`,
        [
            category.name,
            category.description,
            id
        ]
    );

    return result.affectedRows > 0;
}

async function deleteCategory(id) {
    const [result] = await db.query(
        `DELETE FROM categories
         WHERE category_id = ?`,
        [id]
    );

    return result.affectedRows > 0;
}

module.exports = {
    getCategoryById,
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
};