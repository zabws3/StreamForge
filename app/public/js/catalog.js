const videoGrid = document.getElementById("videoGrid");
const statusMessage = document.getElementById("statusMessage");
const videoCount = document.getElementById("videoCount");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

async function loadVideos(search = "") {
    statusMessage.textContent = "Cargando catálogo...";
    videoGrid.replaceChildren();
    videoCount.textContent = "";

    try {
        const params = new URLSearchParams();

        if (search.trim()) {
            params.set("search", search.trim());
        }

        const query = params.toString();
        const url = query ? `/api/videos?${query}` : "/api/videos";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("No se ha podido consultar el catálogo.");
        }

        const result = await response.json();
        const videos = Array.isArray(result.data) ? result.data : [];

        statusMessage.textContent = "";
        videoCount.textContent =
            `${videos.length} ${videos.length === 1 ? "vídeo" : "vídeos"}`;

        if (videos.length === 0) {
            statusMessage.textContent = "";

            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.textContent = search
                ? "No se han encontrado vídeos con esa búsqueda."
                : "Todavía no hay vídeos registrados en la base de datos. Cuando añadamos el contenido, aparecerá aquí.";

            videoGrid.appendChild(empty);
            return;
        }

        for (const video of videos) {
            videoGrid.appendChild(createVideoCard(video));
        }
    } catch (error) {
        console.error("Error cargando vídeos:", error);
        statusMessage.textContent =
            "No se ha podido cargar el catálogo. Comprueba que el servidor esté funcionando.";
    }
}

function createVideoCard(video) {
    const card = document.createElement("article");
    card.className = "video-card";

    const artwork = document.createElement("div");
    artwork.className = "video-art";

    if (video.thumbnailUrl) {
        const image = document.createElement("img");
        image.src = video.thumbnailUrl;
        image.alt = `Carátula de ${video.title || "vídeo"}`;
        image.loading = "lazy";

        image.addEventListener("error", () => {
            artwork.replaceChildren();
            artwork.textContent = "SF";
        }, { once: true });

        artwork.appendChild(image);
    } else {
        artwork.textContent = "SF";
    }

    const info = document.createElement("div");
    info.className = "video-info";

    const title = document.createElement("h3");
    title.textContent = video.title || "Vídeo sin título";

    const description = document.createElement("p");
    description.textContent =
        video.description || "Descubre este contenido en StreamForge.";

    const button = document.createElement("a");
    button.className = "play-button";
    button.textContent = "▶ Ver vídeo";
    button.href = `/player.html?id=${encodeURIComponent(video.id)}`;

    info.append(title, description, button);
    card.append(artwork, info);

    return card;
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loadVideos(searchInput.value);
});

loadVideos();
