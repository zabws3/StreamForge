
const express = require("express");
const path = require("path");
const fs = require("fs/promises");

const videoRepository = require("../repositories/videoRepository");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.use(requireAdmin);

router.get("/categories", async (req, res) => {
    try {
        const db = require("../db");
        const [rows] = await db.query(
            "SELECT category_id AS id, name FROM categories ORDER BY name"
        );

        res.json({ data: rows });
    } catch (error) {
        console.error("Admin categories error:", error);
        res.status(500).json({
            error: "No se pudieron obtener las categorías."
        });
    }
});



function validateVideo(body) {
    const title = typeof body.title === "string"
        ? body.title.trim()
        : "";

    const description = typeof body.description === "string"
        ? body.description.trim()
        : "";

    const thumbnailUrl = typeof body.thumbnailUrl === "string"
        ? body.thumbnailUrl.trim()
        : "";

    const mpdPath = typeof body.mpdPath === "string"
        ? body.mpdPath.trim().replaceAll("\\", "/")
        : "";

    const durationSeconds = Number(body.durationSeconds);
    const categoryId = body.categoryId === "" ||
        body.categoryId === null ||
        body.categoryId === undefined
        ? null
        : Number(body.categoryId);

    if (!title || title.length > 200) {
        return { error: "El título es obligatorio y debe tener como máximo 200 caracteres." };
    }

    if (description.length > 20000) {
        return { error: "La descripción es demasiado larga." };
    }

    if (!Number.isInteger(durationSeconds) || durationSeconds < 1) {
        return { error: "La duración debe ser un entero positivo en segundos." };
    }

    if (thumbnailUrl && (
        thumbnailUrl.length > 500 ||
        !/^https?:\/\/\S+$/i.test(thumbnailUrl)
    )) {
        return { error: "La portada debe ser una URL HTTP o HTTPS válida." };
    }

    if (
        !mpdPath ||
        mpdPath.length > 500 ||
        path.isAbsolute(mpdPath) ||
        mpdPath.includes(":") ||
        mpdPath.split("/").some(part =>
            !part || part === "." || part === ".."
        )
    ) {
        return { error: "Indica una ruta MPD relativa válida, por ejemplo Cortometraje/manifest.mpd." };
    }

    if (
        categoryId !== null &&
        (!Number.isInteger(categoryId) || categoryId < 1)
    ) {
        return { error: "La categoría no es válida." };
    }

    return {
        video: {
            title,
            description: description || null,
            durationSeconds,
            thumbnailUrl: thumbnailUrl || null,
            mpdPath,
            categoryId
        }
    };
}

async function validateMpdExists(mpdPath) {
    const mediaRoot = path.resolve(
        process.env.MEDIA_PATH || "/var/zabflix/media"
    );

    const manifestPath = path.resolve(mediaRoot, mpdPath);

    if (!manifestPath.startsWith(mediaRoot + path.sep)) {
        return false;
    }

    try {
        const stat = await fs.stat(manifestPath);
        return stat.isFile();
    } catch {
        return false;
    }
}

// GET /api/admin/videos
router.get("/videos", async (req, res) => {
    try {
        const videos = await videoRepository.getAllVideos();
        res.json({ data: videos });
    } catch (error) {
        console.error("Admin list videos error:", error);
        res.status(500).json({ error: "No se pudieron obtener los vídeos." });
    }
});

// POST /api/admin/videos
router.post("/videos", async (req, res) => {
    try {
        const result = validateVideo(req.body);

        if (result.error) {
            return res.status(400).json({ error: result.error });
        }

        if (!await validateMpdExists(result.video.mpdPath)) {
            return res.status(400).json({
                error: "No se encuentra el manifiesto MPD en el directorio de medios."
            });
        }

        const id = await videoRepository.createVideo(result.video);
        const video = await videoRepository.getVideoById(id);

        res.status(201).json({ data: video });
    } catch (error) {
        console.error("Admin create video error:", error);
        res.status(500).json({ error: "No se pudo crear el vídeo." });
    }
});

// PUT /api/admin/videos/:id
router.put("/videos/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: "ID no válido." });
        }

        const result = validateVideo(req.body);

        if (result.error) {
            return res.status(400).json({ error: result.error });
        }

        if (!await validateMpdExists(result.video.mpdPath)) {
            return res.status(400).json({
                error: "No se encuentra el manifiesto MPD en el directorio de medios."
            });
        }

        const updated = await videoRepository.updateVideo(id, result.video);

        if (!updated) {
            const existing = await videoRepository.getVideoById(id);

            if (!existing) {
                return res.status(404).json({ error: "Vídeo no encontrado." });
            }
        }

        const video = await videoRepository.getVideoById(id);
        res.json({ data: video });
    } catch (error) {
        console.error("Admin update video error:", error);
        res.status(500).json({ error: "No se pudo actualizar el vídeo." });
    }
});

// DELETE /api/admin/videos/:id
router.delete("/videos/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: "ID no válido." });
        }

        const deleted = await videoRepository.deleteVideo(id);

        if (!deleted) {
            return res.status(404).json({ error: "Vídeo no encontrado." });
        }

        res.json({ message: "Vídeo eliminado correctamente." });
    } catch (error) {
        console.error("Admin delete video error:", error);
        res.status(500).json({ error: "No se pudo eliminar el vídeo." });
    }
});

module.exports = router;