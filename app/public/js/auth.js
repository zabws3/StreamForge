async function sendAuthRequest(endpoint, payload) {
    const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.error || "No se ha podido completar la operación.");
    }

    return result;
}

function showFormMessage(message, success = false) {
    const element = document.getElementById("formMessage");

    if (!element) return;

    element.textContent = message;
    element.classList.toggle("success", success);
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const button = loginForm.querySelector("button[type=submit]");
        button.disabled = true;
        showFormMessage("Iniciando sesión...");

        try {
            const form = new FormData(loginForm);

            await sendAuthRequest("/auth/login", {
                email: form.get("email"),
                password: form.get("password")
            });

            window.location.assign("/");
        } catch (error) {
            showFormMessage(error.message);
        } finally {
            button.disabled = false;
        }
    });
}

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const button = registerForm.querySelector("button[type=submit]");
        button.disabled = true;
        showFormMessage("Creando cuenta...");

        try {
            const form = new FormData(registerForm);

            await sendAuthRequest("/auth/register", {
                username: form.get("username"),
                email: form.get("email"),
                password: form.get("password")
            });

            window.location.assign("/");
        } catch (error) {
            showFormMessage(error.message);
        } finally {
            button.disabled = false;
        }
    });
}

// Actualizar el menú si el usuario ya tiene una sesión.
async function updateNavigation() {
    const actions = document.querySelector(".header-actions");

    if (!actions) return;

    try {
        const response = await fetch("/auth/me", {
            credentials: "same-origin"
        });

        if (!response.ok) return;

        const { user } = await response.json();

        const loginLink = actions.querySelector(".login-link");

        if (loginLink) {
            loginLink.remove();
        }

        const profile = document.createElement("span");
        profile.className = "profile-name";
        profile.textContent = `Hola, ${user.username}`;

        const logout = document.createElement("button");
        logout.type = "button";
        logout.className = "logout-button";
        logout.textContent = "Cerrar sesión";

        logout.addEventListener("click", async () => {
            logout.disabled = true;

            try {
                const response = await fetch("/auth/logout", {
                    method: "POST",
                    credentials: "same-origin"
                });

                if (!response.ok) {
                    throw new Error("No se ha podido cerrar la sesión.");
                }

                window.location.assign("/login.html");
            } catch (error) {
                logout.disabled = false;
                alert(error.message);
            }
        });

        actions.append(profile, logout);
    } catch (error) {
        console.error("Error consultando la sesión:", error);
    }
}

updateNavigation();
