
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

    console.log(`[DASH] ${req.method} ${req.originalUrl}`);
    console.log(`[DASH] Archivo solicitado: ${requestedPath}`);

    if (!requestedPath) {
        console.warn("[DASH] Petición sin ruta de archivo");

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
        console.warn(`[DASH] Acceso denegado: ${requestedPath}`);

        return res.status(403).json({
            error: "Acceso denegado"
        });
    }

    fs.stat(filePath, (error, stats) => {
        if (error || !stats.isFile()) {
            console.warn(`[DASH] Archivo no encontrado: ${filePath}`);

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

        console.log(
            `[DASH] Sirviendo ${requestedPath} (${stats.size} bytes)`
        );

        res.sendFile(filePath, sendError => {
            if (sendError) {
                console.error(
                    `[DASH] Error sirviendo ${requestedPath}:`,
                    sendError.message
                );

                if (!res.headersSent) {
                    res.status(sendError.statusCode || 500).end();
                }
            } else {
                console.log(`[DASH] Envío completado: ${requestedPath}`);
            }
        });
    });
});

module.exports = router;
