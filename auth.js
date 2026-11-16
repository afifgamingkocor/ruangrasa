async function requestJson(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", ...options.headers }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Permintaan tidak berhasil.");
    return data;
}

const authNavLinks = document.querySelectorAll("[data-auth-nav]");
if (authNavLinks.length) {
    requestJson("/api/session").then(({ user }) => {
        authNavLinks.forEach(link => {
            link.textContent = user ? "Dashboard" : "Login";
            link.href = user ? "dashboard.html" : "login.html";
            link.title = user ? "Buka dashboard" : "Khusus admin dan penjual";
            link.setAttribute("aria-label", link.title);
        });
    }).catch(() => {});
}

const demoCredentials = document.querySelector("[data-demo-credentials]");
if (demoCredentials) {
    requestJson("/api/demo-credentials").then(data => {
        demoCredentials.textContent = `Admin — Username: ${data.admin.username} · Password: ${data.admin.password}\nPenjual — Username: ${data.seller.username} · Password: ${data.seller.password}`;
    }).catch(() => {
        demoCredentials.textContent = "Kredensial demo hanya ditampilkan pada server pengembangan.";
    });
}

const loginForm = document.querySelector("#login-form");
if (loginForm) {
    requestJson("/api/session").then(({ user }) => {
        if (user) location.replace("dashboard.html");
    }).catch(() => {});

    loginForm.addEventListener("submit", async event => {
        event.preventDefault();
        const error = document.querySelector("#login-error");
        const button = loginForm.querySelector("button[type=submit]");
        error.hidden = true;
        button.disabled = true;
        try {
            const data = new FormData(loginForm);
            await requestJson("/api/login", {
                method: "POST",
                body: JSON.stringify({ username: data.get("username"), password: data.get("password") })
            });
            location.replace("dashboard.html");
        } catch (reason) {
            error.textContent = reason.message;
            error.hidden = false;
        } finally {
            button.disabled = false;
        }
    });
}

const dashboardTitle = document.querySelector("#dashboard-title");
if (dashboardTitle) {
    requestJson("/api/dashboard").then(data => {
        document.querySelector("#account-name").textContent = `${data.user.name} · ${data.user.role === "admin" ? "Admin" : "Penjual"}`;
        dashboardTitle.textContent = data.title;
        document.querySelector("#dashboard-description").textContent = data.description;
        document.querySelector("#dashboard-notice").textContent = data.notice;
        const stats = document.querySelector("#dashboard-stats");
        stats.replaceChildren(...data.stats.map(item => {
            const card = document.createElement("article");
            card.className = "dashboard-stat";
            const label = document.createElement("p");
            label.textContent = item.label;
            const value = document.createElement("strong");
            value.textContent = item.value;
            card.append(label, value);
            return card;
        }));
    }).catch(() => location.replace("login.html"));

    document.querySelector("#logout-button").addEventListener("click", async () => {
        try { await requestJson("/api/logout", { method: "POST", body: "{}" }); }
        finally { location.replace("login.html"); }
    });
}
