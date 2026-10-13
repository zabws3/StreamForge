
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

        // Express responde si el endpoint /health está disponible.
        // Un HTTP 503 puede indicar que solo falla una dependencia.
        const appHealthy = true;

        const dbHealthy = data.database === "connected";
        const redisConfigured = window.location.port === "8080";
        // Si el endpoint informa del estado de Redis, lo usamos.
        const redisHealthy = data.cache === "connected";

        setStatus(
            appStatus,
            appHealthy ? "OK" : "Error",
            appHealthy
        );

        setStatus(
            dbStatus,
            dbHealthy ? "Conectado" : "Error",
            dbHealthy
        );

        if (!redisConfigured) {
            redisStatus.textContent = "No configurado";
            redisStatus.style.color = "#aaa";
        } else {
            setStatus(
                redisStatus,
                redisHealthy ? "Operativo" : "Error",
                redisHealthy
            );
        }

        const allHealthy =
            appHealthy &&
            dbHealthy &&
            (!redisConfigured || redisHealthy);

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
