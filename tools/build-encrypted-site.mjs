import { createCipheriv, pbkdf2Sync, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const [sourceArg = "escala-nortada-2026-2028.html", outputArg = "docs/index.html"] = process.argv.slice(2);
const sourcePath = resolve(sourceArg);
const outputPath = resolve(outputArg);
const password = process.env.NORTADA_BUILD_PASSWORD;

if (!password || password.length < 12) {
  throw new Error("A palavra-passe tem de ter pelo menos 12 caracteres.");
}

const plaintext = readFileSync(sourcePath, "utf8");
const salt = randomBytes(16);
const iv = randomBytes(12);
const iterations = 600_000;
const key = pbkdf2Sync(password, salt, iterations, 32, "sha256");
const cipher = createCipheriv("aes-256-gcm", key, iv);
const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
const payload = Buffer.concat([encrypted, cipher.getAuthTag()]);
const keyId = salt.toString("hex");

const page = `<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#2aaee8">
  <meta name="application-name" content="Nortada">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Nortada">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; manifest-src 'self'; base-uri 'none'; form-action 'self'">
  <link rel="apple-touch-icon" sizes="180x180" href="nortada-icon-180.png">
  <link rel="icon" type="image/png" sizes="192x192" href="nortada-icon-192.png">
  <link rel="manifest" href="nortada.webmanifest">
  <title>Nortada · Acesso privado</title>
  <style>
    :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-width: 320px; min-height: 100svh; display: grid; place-items: center; padding: 24px; color: #16181d; background: #f4f5f7; }
    main { width: min(100%, 430px); padding: 32px 26px 26px; border: 1px solid #dfe2e7; border-radius: 28px; background: rgba(255,255,255,.96); box-shadow: 0 18px 55px rgba(22,24,29,.10); text-align: center; }
    img { width: 86px; height: 86px; border-radius: 22px; }
    .eyebrow { margin: 20px 0 6px; color: #2864dc; font-size: 12px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
    h1 { margin: 0; font-size: 36px; letter-spacing: -.045em; }
    .intro { margin: 10px auto 24px; color: #6b7280; line-height: 1.45; }
    label { display: block; margin-bottom: 7px; color: #525864; font-size: 13px; font-weight: 750; text-align: left; }
    input[type="password"] { width: 100%; height: 50px; padding: 0 14px; border: 1px solid #cfd4dc; border-radius: 14px; color: #16181d; background: #fff; font: inherit; font-size: 17px; outline: none; }
    input[type="password"]:focus { border-color: #2864dc; box-shadow: 0 0 0 4px rgba(40,100,220,.14); }
    .remember { display: flex; align-items: center; gap: 9px; margin: 14px 2px 20px; color: #555b66; font-size: 13px; text-align: left; }
    .remember input { width: 18px; height: 18px; accent-color: #2864dc; }
    button { width: 100%; min-height: 50px; border: 0; border-radius: 14px; color: #fff; background: #2864dc; cursor: pointer; font: inherit; font-weight: 760; }
    button:disabled { cursor: wait; opacity: .65; }
    .error { min-height: 20px; margin: 12px 0 0; color: #b42318; font-size: 13px; font-weight: 650; }
    footer { margin-top: 19px; color: #8a9099; font-size: 11px; line-height: 1.4; }
  </style>
</head>
<body>
  <main>
    <img src="nortada-icon-192.png" alt="Nortada">
    <p class="eyebrow">Bar da Júlia</p>
    <h1>Nortada</h1>
    <p class="intro">Introduza a palavra-passe familiar para abrir o calendário.</p>
    <form id="unlockForm">
      <label for="password">Palavra-passe</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
      <label class="remember"><input id="remember" type="checkbox" checked> Manter o acesso neste dispositivo</label>
      <button id="submitButton" type="submit">Entrar</button>
      <p class="error" id="error" role="alert" aria-live="polite"></p>
    </form>
    <footer>Informação privada do Bar da Júlia · ligação HTTPS</footer>
  </main>
  <script>
    (() => {
      "use strict";
      const salt = Uint8Array.from(atob("${salt.toString("base64")}"), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob("${iv.toString("base64")}"), c => c.charCodeAt(0));
      const encrypted = Uint8Array.from(atob("${payload.toString("base64")}"), c => c.charCodeAt(0));
      const iterations = ${iterations};
      const storageKey = "nortada-access-${keyId}";
      const form = document.getElementById("unlockForm");
      const passwordInput = document.getElementById("password");
      const rememberInput = document.getElementById("remember");
      const button = document.getElementById("submitButton");
      const error = document.getElementById("error");
      const bytesToBase64 = bytes => btoa(String.fromCharCode(...bytes));
      const base64ToBytes = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));

      async function decryptWithRawKey(rawKey) {
        const cryptoKey = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
        const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv, tagLength: 128 }, cryptoKey, encrypted);
        return new TextDecoder().decode(plain);
      }

      async function deriveRawKey(password) {
        const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
        const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, material, 256);
        return new Uint8Array(bits);
      }

      function openCalendar(html) {
        document.open();
        document.write(html);
        document.close();
      }

      async function tryStoredKey() {
        const saved = localStorage.getItem(storageKey);
        if (!saved) return;
        try { openCalendar(await decryptWithRawKey(base64ToBytes(saved))); }
        catch { localStorage.removeItem(storageKey); }
      }

      form.addEventListener("submit", async event => {
        event.preventDefault();
        button.disabled = true;
        error.textContent = "";
        try {
          const rawKey = await deriveRawKey(passwordInput.value);
          const html = await decryptWithRawKey(rawKey);
          if (rememberInput.checked) localStorage.setItem(storageKey, bytesToBase64(rawKey));
          openCalendar(html);
        } catch {
          error.textContent = "Palavra-passe incorreta.";
          passwordInput.select();
        } finally {
          button.disabled = false;
        }
      });

      tryStoredKey();
    })();
  </script>
</body>
</html>`;

writeFileSync(outputPath, page, "utf8");
console.log(`Site cifrado criado em ${outputPath} a partir de ${basename(sourcePath)}.`);

