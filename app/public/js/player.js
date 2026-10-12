
const videoElement = document.getElementById("videoPlayer");
const titleElement = document.getElementById("videoTitle");
const descriptionElement = document.getElementById("videoDescription");
const messageElement = document.getElementById("playerMessage");
const qualitySelect = document.getElementById("qualitySelect");
const qualityInfo = document.getElementById("qualityInfo");

let dashPlayer = null;
let qualityLevels = [];

function showMessage(message) {
    messageElement.textContent = message;
}

function getManifestUrl(mpdPath) {
    let relativePath = mpdPath
        .replace(/^\/var\/zabflix\/media\//, "")
        .replace(/^\/media\//, "")
        .replace(/^\/+/, "");

    const segments = relativePath.split("/");

    if (
        !relativePath ||
        segments.some(segment =>
            !segment || segment === "." || segment === ".."
        )
    ) {
        throw new Error("La ruta del manifiesto no es válida.");
    }

    return "/video/stream/" +
        segments.map(segment => encodeURIComponent(segment)).join("/");
}

function updateQualityOptions() {
    if (!dashPlayer) return;

    const bitrateInfo = dashPlayer.getBitrateInfoListFor("video") || [];

    // dash.js proporciona el índice de calidad que usa setQualityFor().
    const uniqueLevels = new Map();

    bitrateInfo.forEach((level, index) => {
        const qualityIndex = level.qualityIndex ?? index;
        const height = level.height;
        const width = level.width;

        if (!height) return;

        if (!uniqueLevels.has(qualityIndex)) {
            uniqueLevels.set(qualityIndex, {
                qualityIndex,
                height,
                width,
                bitrate: level.bitrate || 0
            });
        }
    });

    qualityLevels = Array.from(uniqueLevels.values())
        .sort((a, b) => a.height - b.height);

    qualitySelect.innerHTML = "";

    const autoOption = document.createElement("option");
    autoOption.value = "auto";
    autoOption.textContent = "Automática";
    qualitySelect.appendChild(autoOption);

    qualityLevels.forEach(level => {
        const option = document.createElement("option");
        option.value = String(level.qualityIndex);
        option.textContent = `${level.height}p`;
        qualitySelect.appendChild(option);
    });

    qualitySelect.disabled = qualityLevels.length === 0;

    qualityInfo.textContent = qualityLevels.length
        ? `${qualityLevels.length} niveles de calidad disponibles`
        : "No se han detectado resoluciones de vídeo.";
}

function selectQuality() {
    if (!dashPlayer) return;

    const selectedValue = qualitySelect.value;

    if (selectedValue === "auto") {
        dashPlayer.updateSettings({
            streaming: {
                abr: {
                    autoSwitchBitrate: {
                        video: true
                    }
                }
            }
        });

        qualityInfo.textContent = "Calidad automática";
        return;
    }

    const qualityIndex = Number(selectedValue);

    dashPlayer.updateSettings({
        streaming: {
            abr: {
                autoSwitchBitrate: {
                    video: false
                }
            }
        }
    });

    dashPlayer.setQualityFor("video", qualityIndex);
    qualityInfo.textContent = "Calidad manual seleccionada";
}

async function loadVideo() {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get("id");

    if (!videoId) {
        showMessage("No se ha indicado ningún vídeo.");
        return;
    }

    try {
        const response = await fetch(
            `/api/videos/${encodeURIComponent(videoId)}`,
            { credentials: "same-origin" }
        );

        if (response.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        if (!response.ok) {
            showMessage(
                response.status === 404
                    ? "No se ha encontrado el vídeo."
                    : "No se ha podido cargar el vídeo."
            );
            return;
        }

        const result = await response.json();
        const video = result.data ?? result;

        titleElement.textContent = video.title;
        descriptionElement.textContent = video.description || "";

        if (!window.dashjs) {
            showMessage("No se ha podido cargar el reproductor MPEG-DASH.");
            return;
        }

        const manifestUrl = getManifestUrl(video.mpdPath);

        dashPlayer = window.dashjs.MediaPlayer().create();

        dashPlayer.on(
            window.dashjs.MediaPlayer.events.STREAM_INITIALIZED,
            () => {
                updateQualityOptions();
                showMessage("Reproducción lista.");
            }
        );

        dashPlayer.on(
            window.dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED,
            event => {
                if (event.mediaType === "video" &&
                    qualitySelect.value === "auto") {
                    qualityInfo.textContent =
                        `Calidad actual: ${event.newQuality}`;
                }
            }
        );

        qualitySelect.addEventListener("change", selectQuality);

        dashPlayer.initialize(videoElement, manifestUrl, true);
        showMessage("Preparando reproducción...");
    } catch (error) {
        console.error("Error al cargar el vídeo:", error);
        showMessage(error.message || "Error al iniciar la reproducción.");
    }
}

window.addEventListener("beforeunload", () => {
    if (dashPlayer) {
        dashPlayer.reset();
    }
});

loadVideo();
