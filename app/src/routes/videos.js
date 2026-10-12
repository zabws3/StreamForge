const express = require("express");
const videoRepository = require("../repositories/videoRepository");
const { client: redis, connectRedis } = require("../cache");

const router = express.Router();
const CACHE_TTL = 60;

async function getCached(key, fetchData) {
    if (process.env.REDIS_HOST) {
        try {
            await connectRedis();

            const cached = await redis.get(key);

            if (cached) {
                return {
                    source: "redis",
                    data: JSON.parse(cached)
                };
            }
        } catch (error) {
            console.error("Redis read error:", error.message);
        }
    }

    const data = await fetchData();

    if (process.env.REDIS_HOST) {
        try {
            await connectRedis();
            await redis.setEx(key, CACHE_TTL, JSON.stringify(data));
        } catch (error) {
            console.error("Redis write error:", error.message);
        }
    }

    return {
        source: "mysql",
        data
    };
}

// GET /api/videos
// GET /api/videos?search=matrix
// GET /api/videos?categoryId=1
router.get("/", async (req, res) => {
    try {
        const { search, categoryId } = req.query;

        let result;

        if (search || categoryId) {
            const category = categoryId
                ? Number(categoryId)
                : null;

            if (categoryId && (!Number.isInteger(category) || category < 1)) {
                return res.status(400).json({
                    error: "categoryId debe ser un entero positivo"
                });
            }

            const key = `videos:search:${search || ""}:category:${category || ""}`;

            result = await getCached(key, () => {
                if (category && search) {
                    return videoRepository.searchVideos(
                        search,
                        null,
                        category
                    );
                }

                if (category) {
                    return videoRepository.getVideosByCategory(category);
                }

                return videoRepository.searchVideos(search, null, null);
            });
        } else {
            result = await getCached(
                "videos:all",
                () => videoRepository.getAllVideos()
            );
        }

        res.json(result);

    } catch (error) {
        console.error("Get videos error:", error);

        res.status(500).json({
            error: "Error al obtener los vídeos"
        });
    }
});

// GET /api/videos/:id
router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                error: "El ID debe ser un entero positivo"
            });
        }

        const result = await getCached(
            `videos:${id}`,
            () => videoRepository.getVideoById(id)
        );

        if (!result.data) {
            return res.status(404).json({
                error: "Vídeo no encontrado"
            });
        }

        res.json(result);

    } catch (error) {
        console.error("Get video error:", error);

        res.status(500).json({
            error: "Error al obtener el vídeo"
        });
    }
});

module.exports = router;