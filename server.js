const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8000;
const SESSION_TTL = 8 * 60 * 60 * 1000;
const MAX_BODY = 8 * 1024;
const sessions = new Map();
const attempts = new Map();
const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon"
};

function loadEnvFile() {
    const file = path.join(ROOT, ".env");
    if (!fs.existsSync(file)) return;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
        if (match && !Object.hasOwn(process.env, match[1])) {
            process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
        }
    }
}

loadEnvFile();

const users = [
    { username: process.env.ADMIN_USERNAME || "admin@ruangrasa.id", password: process.env.ADMIN_PASSWORD, role: "admin", name: "Admin RuangRasa" },
    { username: process.env.SELLER_USERNAME || "penjual@ruangrasa.id", password: process.env.SELLER_PASSWORD, role: "seller", name: "Penjual RuangRasa" }
];

function sendJson(res, status, payload, headers = {}) {
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        ...headers
    });
    res.end(JSON.stringify(payload));
}

function getCookies(req) {
    return Object.fromEntries((req.headers.cookie || "").split(";").map(part => {
        const index = part.indexOf("=");
        return index < 0 ? ["", ""] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
    }).filter(([key]) => key));
}

function currentSession(req) {
    const token = getCookies(req).rr_session;
    const session = token && sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
        if (token) sessions.delete(token);
        return null;
    }
    return { token, ...session };
}

function requireRole(req, res, role) {
    const session = currentSession(req);
    if (!session) {
        sendJson(res, 401, { error: "Silakan login terlebih dahulu." });
        return null;
    }
    if (role && session.role !== role) {
        sendJson(res, 403, { error: "Anda tidak memiliki akses ke halaman ini." });
        return null;
    }
    return session;
}

function readJson(req) {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", chunk => {
            data += chunk;
            if (Buffer.byteLength(data) > MAX_BODY) {
                reject(new Error("Payload terlalu besar."));
                req.destroy();
            }
        });
        req.on("end", () => {
            try { resolve(JSON.parse(data || "{}")); }
            catch { reject(new Error("Format data tidak valid.")); }
        });
        req.on("error", reject);
    });
}

function verifyPassword(password, storedHash) {
    const [salt, expectedHex] = (storedHash || "").split(":");
    if (!salt || !expectedHex) return Promise.resolve(false);
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (error, derived) => {
            if (error) return reject(error);
            const expected = Buffer.from(expectedHex, "hex");
            resolve(expected.length === derived.length && crypto.timingSafeEqual(expected, derived));
        });
    });
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (error, derived) => {
            if (error) return reject(error);
            resolve(`${salt}:${derived.toString("hex")}`);
        });
    });
}

async function api(req, res, url) {
    if (req.method === "GET" && url.pathname === "/api/demo-credentials") {
        if (process.env.NODE_ENV === "production") {
            return sendJson(res, 404, { error: "Not found." });
        }
        return sendJson(res, 200, {
            admin: { username: users[0].username, password: process.env.ADMIN_PASSWORD },
            seller: { username: users[1].username, password: process.env.SELLER_PASSWORD }
        });
    }

    if (req.method === "POST" && req.headers.origin) {
        try {
            if (new URL(req.headers.origin).host !== req.headers.host) {
                return sendJson(res, 403, { error: "Permintaan tidak diizinkan." });
            }
        } catch {
            return sendJson(res, 403, { error: "Permintaan tidak diizinkan." });
        }
    }

    if (req.method === "GET" && url.pathname === "/api/session") {
        const session = currentSession(req);
        return sendJson(res, 200, { user: session ? { username: session.username, role: session.role, name: session.name } : null });
    }

    if (req.method === "POST" && url.pathname === "/api/login") {
        const ip = req.socket.remoteAddress || "unknown";
        const state = attempts.get(ip) || { count: 0, lockedUntil: 0 };
        if (state.lockedUntil > Date.now()) return sendJson(res, 429, { error: "Terlalu banyak percobaan. Coba lagi beberapa menit." });

        let body;
        try { body = await readJson(req); }
        catch (error) { return sendJson(res, 400, { error: error.message }); }
        if (typeof body.username !== "string" || typeof body.password !== "string" || body.password.length > 200) {
            return sendJson(res, 400, { error: "Username dan password wajib diisi." });
        }

        const user = users.find(item => item.username.toLowerCase() === body.username.trim().toLowerCase());
        const valid = user && user.passwordHash && await verifyPassword(body.password, user.passwordHash);
        if (!valid) {
            state.count += 1;
            if (state.count >= 5) {
                state.count = 0;
                state.lockedUntil = Date.now() + 10 * 60 * 1000;
            }
            attempts.set(ip, state);
            return sendJson(res, 401, { error: "Username atau password tidak sesuai." });
        }

        attempts.delete(ip);
        const token = crypto.randomBytes(32).toString("base64url");
        sessions.set(token, { username: user.username, role: user.role, name: user.name, expiresAt: Date.now() + SESSION_TTL });
        return sendJson(res, 200, { user: { username: user.username, role: user.role, name: user.name } }, {
            "Set-Cookie": `rr_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL / 1000}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
        });
    }

    if (req.method === "POST" && url.pathname === "/api/logout") {
        const session = currentSession(req);
        if (session) sessions.delete(session.token);
        return sendJson(res, 200, { ok: true }, {
            "Set-Cookie": "rr_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
        });
    }

    if (req.method === "GET" && url.pathname === "/api/dashboard") {
        const session = requireRole(req, res);
        if (!session) return;
        const common = { user: { username: session.username, name: session.name, role: session.role } };
        if (session.role === "admin") {
            return sendJson(res, 200, { ...common, title: "Dashboard Admin", description: "Ringkasan dan kendali seluruh RuangRasa.", stats: [
                { label: "Produk katalog", value: 6 },
                { label: "Penjual terdaftar", value: 1 },
                { label: "Pesanan masuk", value: 0 }
            ], notice: "Pengelolaan produk dan pesanan terhubung ke WhatsApp pada tahap ini." });
        }
        return sendJson(res, 200, { ...common, title: "Dashboard Penjual", description: "Ringkasan aktivitas toko RuangRasa.", stats: [
            { label: "Produk katalog", value: 6 },
            { label: "Pesanan menunggu", value: 0 },
            { label: "Pesanan diproses", value: 0 }
        ], notice: "Pesanan dikonfirmasi melalui WhatsApp; dashboard ini belum menyimpan status pesanan." });
    }

    sendJson(res, 404, { error: "Endpoint tidak ditemukan." });
}

function serveStatic(req, res, url) {
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); }
    catch { res.writeHead(400).end("Bad request"); return; }
    if (pathname === "/") pathname = "/index.html";
    const relative = path.normalize(pathname).replace(/^([/\\])+/, "");
    const file = path.resolve(ROOT, relative);
    if (!file.startsWith(ROOT + path.sep) || path.basename(file).startsWith(".")) {
        res.writeHead(404).end("Not found"); return;
    }
    const type = mimeTypes[path.extname(file).toLowerCase()];
    if (!type) { res.writeHead(404).end("Not found"); return; }
    fs.readFile(file, (error, content) => {
        if (error) { res.writeHead(404).end("Not found"); return; }
        res.writeHead(200, { "Content-Type": type, "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin" });
        if (req.method === "HEAD") return res.end();
        res.end(content);
    });
}

async function main() {
    for (const user of users) {
        if (!user.password || user.password.length < 12) {
            console.error(`Konfigurasi ${user.role} tidak aman. Set ${user.role === "admin" ? "ADMIN" : "SELLER"}_PASSWORD (minimal 12 karakter) di .env.`);
            process.exitCode = 1;
            return;
        }
        user.passwordHash = await hashPassword(user.password);
        delete user.password;
    }

    const server = http.createServer((req, res) => {
        const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
        if (url.pathname.startsWith("/api/")) {
            api(req, res, url).catch(error => {
                console.error(error);
                if (!res.headersSent) sendJson(res, 500, { error: "Terjadi kesalahan pada server." });
            });
        } else if (req.method === "GET" || req.method === "HEAD") {
            serveStatic(req, res, url);
        } else {
            res.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
        }
    });
    server.listen(PORT, () => console.log(`RuangRasa berjalan di http://localhost:${PORT}`));
}

main().catch(error => {
    console.error("Server gagal dijalankan:", error);
    process.exitCode = 1;
});
