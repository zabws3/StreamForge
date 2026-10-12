
const toggle = document.getElementById("health-toggle");
const details = document.getElementById("health-details");
const refresh = document.getElementById("health-refresh");
const dot = document.getElementById("health-dot");
const label = document.getElementById("health-label");

const appStatus = document.getElementById("health-app");
const dbStatus = document.getElementById("health-db");
const redisStatus = document.getElementById("health-redis");

toggle.addEventListener("click", () => {
    const opening = details.hidden;
    details.hidden = !opening;
    toggle.setAttribute("aria-expanded", String(opening));
});

refresh.addEventListener("click", checkHealth);

function setStatus(element, text, healthy) {
    element.textContent = text;
    element.style.color = healthy ? "#62d99a" : "#e50914";
}

async function checkHealth() {
    label.textContent = "Comprobando...";
    dot.style.background = "#aaa";
    refresh.disabled = true;

    try {
        const response = await fetch("/health", {
            cache: "no-store"
        });

        const data = await response.json();

        const appHealthy = response.ok && data.status === "ok";
        const dbHealthy = response.ok && data.database === "connected";
        const redisHealthy = response.ok && data.cache === "connected";

        setStatus(appStatus, appHealthy ? "Online" : "Error", appHealthy);
        setStatus(dbStatus, dbHealthy ? "Conectado" : "Error", dbHealthy);
        setStatus(
            redisStatus,
            redisHealthy ? "Conectado" : "Error",
            redisHealthy
        );

        const allHealthy = appHealthy && dbHealthy && redisHealthy;

        label.textContent = allHealthy
            ? "Sistema operativo"
            : "Incidencia detectada";

        dot.style.background = allHealthy ? "#62d99a" : "#e50914";
    } catch (error) {
        console.error("Error consultando el estado del sistema:", error);

        label.textContent = "Sistema no disponible";
        dot.style.background = "#e50914";

        setStatus(appStatus, "Sin conexión", false);
        setStatus(dbStatus, "Sin comprobar", false);
        setStatus(redisStatus, "Sin comprobar", false);
    } finally {
        refresh.disabled = false;
    }
}

checkHealth();