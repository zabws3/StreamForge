const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const MEDIA_PATH = path.resolve(
    process.env.MEDIA_PATH || "/var/zabflix/media"
);

const MIME_TYPES = {
    ".mpd": "application/dash+xml",
    ".m4s": "video/iso.segment",
    ".mp4": "video/mp4",
    ".m4a": "audio/mp4"
};

router.get("/*filepath", (req, res) => {
    const requestedPath = Array.isArray(req.params.filepath)
        ? req.params.filepath.join(path.sep)
        : req.params.filepath;

    if (!requestedPath) {
        return res.status(400).json({
            error: "Falta la ruta del archivo"
        });
    }

    const filePath = path.resolve(MEDIA_PATH, requestedPath);

    // Impedir que se acceda a archivos fuera de MEDIA_PATH.
    if (
        filePath !== MEDIA_PATH &&
        !filePath.startsWith(MEDIA_PATH + path.sep)
    ) {
        return res.status(403).json({
            error: "Acceso denegado"
        });
    }

    fs.stat(filePath, (error, stats) => {
        if (error || !stats.isFile()) {
            return res.status(404).json({
                error: "Archivo multimedia no encontrado"
            });
        }

        const extension = path.extname(filePath).toLowerCase();

        res.setHeader(
            "Content-Type",
            MIME_TYPES[extension] || "application/octet-stream"
        );

        res.setHeader("Cache-Control", "public, max-age=3600");
        res.setHeader("Accept-Ranges", "bytes");

        res.sendFile(filePath);
    });
});

module.exports = router;
