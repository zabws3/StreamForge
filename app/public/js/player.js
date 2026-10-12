const videoElement = document.getElementById("videoPlayer");
const titleElement = document.getElementById("videoTitle");
const descriptionElement = document.getElementById("videoDescription");
const messageElement = document.getElementById("playerMessage");

let dashPlayer = null;

function showMessage(message) {
    messageElement.textContent = message;
}

function getManifestUrl(mpdPath) {
    if (typeof mpdPath !== "string" || !mpdPath.trim()) {
        throw new Error("El vídeo no tiene un manifiesto MPEG-DASH.");
    }

    let relativePath = mpdPath.trim().replaceAll("\\", "/");

    relativePath = relativePath.replace(/^\/var\/zabflix\/media\//, "");
    relativePath = relativePath.replace(/^\/media\//, "");
    relativePath = relativePath.replace(/^\/+/, "");

    const segments = relativePath.split("/");

    if (
        segments.some(segment =>
            !segment || segment === "." || segment === ".."
        )
    ) {
        throw new Error("La ruta del vídeo no es válida.");
    }

    return "/video/stream/" +
        segments.map(encodeURIComponent).join("/");
}

async function loadVideo() {
    const videoId = new URLSearchParams(window.location.search).get("id");

    if (!videoId || !/^\d+$/.test(videoId)) {
        showMessage("No se ha indicado un vídeo válido.");
        titleElement.textContent = "Vídeo no disponible";
        return;
    }

    try {
        const response = await fetch(
            `/api/videos/${encodeURIComponent(videoId)}`,
            { credentials: "same-origin" }
        );

        if (response.status === 401) {
            window.location.replace("/login.html");
            return;
        }

        if (response.status === 404) {
            throw new Error("No se ha encontrado el vídeo.");
        }

        if (!response.ok) {
            throw new Error("No se han podido cargar los datos del vídeo.");
        }

        const result = await response.json();
        const video = result.data;

        if (!video) {
            throw new Error("No se ha encontrado el vídeo.");
        }

        titleElement.textContent = video.title || "Sin título";
        descriptionElement.textContent = video.description || "";

        const manifestUrl = getManifestUrl(video.mpdPath);

        if (!window.dashjs) {
            throw new Error("No se ha podido cargar el reproductor DASH.");
        }

        dashPlayer = dashjs.MediaPlayer().create();

        dashPlayer.initialize(videoElement, manifestUrl, true);

        dashPlayer.on(dashjs.MediaPlayer.events.ERROR, () => {
            showMessage("Error al reproducir el vídeo. Comprueba el manifiesto y sus segmentos.");
        });

        showMessage("Vídeo cargado. Preparando reproducción...");
    } catch (error) {
        console.error("Error al cargar el vídeo:", error);
        showMessage(error.message || "No se ha podido reproducir el vídeo.");
    }
}

window.addEventListener("beforeunload", () => {
    if (dashPlayer) {
        dashPlayer.reset();
    }
});

loadVideo();