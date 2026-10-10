/* 作者会话跨栏目复用；GitHub 权限由服务端校验，保存的连接只含加密密文。 */
(function () {
  "use strict";
  const api = window.Homepage;
  const OWNER = "PaulLi07";
  const REPO = "personal-homepage";
  const REPOSITORY = "/repos/" + OWNER + "/" + REPO;
  const CONTENT_PATHS = new Set([
    REPOSITORY + "/contents/modules/life/moments/posts.js",
    REPOSITORY + "/contents/modules/academic/experience/entries.js"
  ]);
  const ITERATIONS = 600000;
  const STORAGE_KEY = "personal-homepage:author-connection:v1";
  const MASTER_DOMAIN = "personal-homepage:author:master:v1:";
  const VAULT_DOMAIN = "personal-homepage:author:vault:v1:" + OWNER + "/" + REPO;
  const encoder = new TextEncoder();
  const subscribers = new Set();
  const operations = new Set();
  let unlocked = false;
  let token = "";
  let masterKey = null;
  let vaultKey = null;
  let generation = 0;
  let remembered = false;
  let restoreError = "";
  try { remembered = window.localStorage.getItem(STORAGE_KEY) !== null; } catch (_) { /* 存储不可用仍可使用内存会话。 */ }

  function state(event) {
    return Object.freeze({unlocked, connected: unlocked && Boolean(token), remembered, restoreError, ...(event ? {event} : {})});
  }
  function notify(event) {
    const value = state(event);
    for (const callback of Array.from(subscribers)) {
      try { callback(value); } catch (_) { /* 不让视图回调故障暴露凭据或阻断其他订阅者。 */ }
    }
    return value;
  }
  function cancelled() { return new DOMException("The author operation was cancelled.", "AbortError"); }
  function invalidate() {
    generation += 1;
    for (const operation of operations) operation.controller.abort();
  }
  function operationFor(signal) {
    if (signal?.aborted) throw cancelled();
    const controller = new AbortController();
    const operation = {controller, generation, signal};
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, {once: true});
    operations.add(operation);
    return {
      signal: controller.signal,
      check() {
        if (operation.generation !== generation || controller.signal.aborted || signal?.aborted) throw cancelled();
      },
      finish() {
        operations.delete(operation);
        signal?.removeEventListener("abort", abort);
      }
    };
  }
  function requireCrypto() {
    if (!window.crypto?.subtle || !window.crypto?.getRandomValues) {
      throw new Error("Author sign in requires Web Crypto in a secure browser context.");
    }
    return window.crypto;
  }
  function base64(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }
  function bytesFrom(value, length) {
    if (typeof value !== "string" || !value || value.length > 6000
      || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
      throw new Error("The saved author connection is invalid.");
    }
    let bytes;
    try { bytes = Uint8Array.from(atob(value), character => character.charCodeAt(0)); }
    catch (_) { throw new Error("The saved author connection is invalid."); }
    if (base64(bytes) !== value || (length !== undefined && bytes.length !== length)) {
      throw new Error("The saved author connection is invalid.");
    }
    return bytes;
  }
  function configuration() {
    const config = api.authorConfig;
    if (!config || config.version !== 1 || config.iterations !== ITERATIONS || config.owner !== OWNER || config.repo !== REPO) {
      throw new Error("Author sign in has not been configured correctly.");
    }
    try { return {salt: bytesFrom(config.salt, 16), verifier: bytesFrom(config.verifier, 32)}; }
    catch (_) { throw new Error("Author sign in has not been configured correctly."); }
  }
  function tokenValue(value) {
    if (typeof value !== "string" || !/^[!-~]{1,500}$/.test(value)) {
      throw new Error("Enter a valid GitHub token to connect.");
    }
    return value;
  }
  function savedPayload(text) {
    let payload;
    try { payload = JSON.parse(text); } catch (_) { throw new Error("The saved author connection is invalid."); }
    if (!payload || Array.isArray(payload) || Object.keys(payload).sort().join(",") !== "ciphertext,iterations,iv,salt,version"
      || payload.version !== 1 || payload.iterations !== ITERATIONS) {
      throw new Error("The saved author connection is invalid.");
    }
    const ciphertext = bytesFrom(payload.ciphertext);
    if (ciphertext.length < 17 || ciphertext.length > 4096) throw new Error("The saved author connection is invalid.");
    return {salt: bytesFrom(payload.salt, 16), iv: bytesFrom(payload.iv, 12), ciphertext};
  }
  async function deriveMaster(password, config, operation) {
    const crypto = requireCrypto();
    const passwordBytes = encoder.encode(password);
    let material;
    try { material = await crypto.subtle.importKey("raw", passwordBytes, "PBKDF2", false, ["deriveBits"]); }
    finally { passwordBytes.fill(0); }
    operation.check();
    const verification = new Uint8Array(await crypto.subtle.deriveBits({name: "PBKDF2", hash: "SHA-256",
      salt: config.salt, iterations: ITERATIONS}, material, 256));
    let difference = 0;
    try {
      operation.check();
      for (let index = 0; index < 32; index += 1) difference |= verification[index] ^ config.verifier[index];
    } finally { verification.fill(0); }
    if (difference !== 0) throw new Error("The author password is incorrect.");
    const prefix = encoder.encode(MASTER_DOMAIN);
    const salt = new Uint8Array(prefix.length + config.salt.length);
    salt.set(prefix); salt.set(config.salt, prefix.length);
    const secret = new Uint8Array(await crypto.subtle.deriveBits({name: "PBKDF2", hash: "SHA-256",
      salt, iterations: ITERATIONS}, material, 256));
    try {
      operation.check();
      return await crypto.subtle.importKey("raw", secret, "HKDF", false, ["deriveKey"]);
    }
    finally { secret.fill(0); }
  }
  async function deriveVault(master, salt, operation) {
    const key = await requireCrypto().subtle.deriveKey({name: "HKDF", hash: "SHA-256", salt,
      info: encoder.encode(VAULT_DOMAIN)}, master, {name: "AES-GCM", length: 256}, false, ["encrypt", "decrypt"]);
    operation.check();
    return key;
  }
  async function restoreToken(master, text, operation) {
    const payload = savedPayload(text);
    const key = await deriveVault(master, payload.salt, operation);
    let plaintext;
    try {
      plaintext = new Uint8Array(await requireCrypto().subtle.decrypt({name: "AES-GCM", iv: payload.iv,
        additionalData: encoder.encode(VAULT_DOMAIN), tagLength: 128}, key, payload.ciphertext));
      operation.check();
      const data = JSON.parse(new TextDecoder("utf-8", {fatal: true}).decode(plaintext));
      if (!data || Array.isArray(data) || Object.keys(data).join(",") !== "token") throw new Error("Invalid connection.");
      return {token: tokenValue(data.token), key};
    } finally { plaintext?.fill(0); }
  }
  async function encryptToken(master, candidate, operation) {
    const crypto = requireCrypto();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveVault(master, salt, operation);
    const plaintext = encoder.encode(JSON.stringify({token: candidate}));
    let ciphertext;
    try { ciphertext = new Uint8Array(await crypto.subtle.encrypt({name: "AES-GCM", iv,
      additionalData: encoder.encode(VAULT_DOMAIN), tagLength: 128}, key, plaintext)); }
    finally { plaintext.fill(0); }
    operation.check();
    return {key, text: JSON.stringify({version: 1, iterations: ITERATIONS, salt: base64(salt), iv: base64(iv), ciphertext: base64(ciphertext)})};
  }
  async function rawRequest(path, candidate, {method = "GET", body, operation}) {
    operation.check();
    let response;
    try {
      response = await fetch("https://api.github.com" + path, {
        method, credentials: "omit", cache: "no-store", redirect: "error", signal: operation.signal,
        headers: {Accept: "application/vnd.github+json", Authorization: "Bearer " + candidate,
          "X-GitHub-Api-Version": "2026-03-10", ...(body !== undefined ? {"Content-Type": "application/json"} : {})},
        ...(body !== undefined ? {body: JSON.stringify(body)} : {})
      });
    } catch (_) {
      operation.check();
      throw new Error("Could not reach GitHub. Check the repository before retrying a publication.");
    }
    operation.check();
    if (!response.ok) {
      const messages = {
        401: "GitHub did not accept this token. Connect with a valid token.",
        403: "GitHub denied access. Check token permissions or try again later.",
        404: "The repository file was not found on main. Deploy this website version before publishing.",
        409: "The file changed during publication. Nothing was overwritten. Please try again.",
        422: "GitHub could not accept this change. Check the branch and token permissions."
      };
      const error = new Error(messages[response.status] || "GitHub could not complete this request. Check the repository before retrying.");
      error.status = response.status;
      throw error;
    }
    let result;
    try { result = await response.json(); }
    catch (_) { operation.check(); throw new Error("GitHub returned an unexpected response. Check the repository before retrying."); }
    operation.check();
    return result;
  }
  async function verifyIdentity(candidate, operation) {
    const user = await rawRequest("/user", candidate, {operation});
    if (typeof user?.login !== "string" || user.login.toLowerCase() !== OWNER.toLowerCase()) {
      throw new Error("This account is not the author. Access is limited to PaulLi07.");
    }
    const repository = await rawRequest(REPOSITORY, candidate, {operation});
    if (typeof repository?.owner?.login !== "string" || repository.owner.login.toLowerCase() !== OWNER.toLowerCase()
      || repository.permissions?.push !== true) {
      throw new Error("This token cannot publish to the author's repository.");
    }
    operation.check();
  }
  function allowedRequest(path, method, body) {
    if (typeof path !== "string" || (method !== "GET" && method !== "PUT")) throw new Error("This author request is not allowed.");
    if (method === "GET") {
      if (body !== undefined) throw new Error("This author request is not allowed.");
      if (path === "/user" || path === REPOSITORY) return {path};
      for (const contentPath of CONTENT_PATHS) {
        if (path === contentPath || path === contentPath + "?ref=main") return {path: contentPath + "?ref=main"};
      }
      throw new Error("This author request is not allowed.");
    }
    if (!CONTENT_PATHS.has(path) || !body || Array.isArray(body) || body.branch !== "main"
      || Object.keys(body).sort().join(",") !== "branch,content,message,sha"
      || typeof body.message !== "string" || !body.message.trim() || body.message.length > 256
      || typeof body.sha !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(body.sha)
      || typeof body.content !== "string" || !body.content || body.content.length > 1300000
      || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.content)) {
      throw new Error("Publishing requires an allowed file, its current SHA, and the main branch.");
    }
    return {path, body: {message: body.message, branch: "main", sha: body.sha, content: body.content}};
  }

  api.authorSession = Object.freeze({
    isUnlocked() { return unlocked; },
    isConnected() { return unlocked && Boolean(token); },
    async unlock(password, {signal} = {}) {
      if (signal?.aborted) throw cancelled();
      const wasUnlocked = unlocked;
      invalidate();
      unlocked = false; token = ""; masterKey = null; vaultKey = null; restoreError = "";
      const operation = operationFor(signal);
      if (wasUnlocked) notify("locked");
      try {
        if (typeof password !== "string" || !password || password.length > 4096) throw new Error("The author password is incorrect.");
        const derivedMaster = await deriveMaster(password, configuration(), operation);
        password = "";
        operation.check();
        let text = null;
        let restored = null;
        let warning = "";
        try { text = window.localStorage.getItem(STORAGE_KEY); remembered = text !== null; }
        catch (_) { warning = "Browser storage is unavailable. Connect to GitHub for this session."; remembered = false; }
        if (text !== null) {
          try {
            restored = await restoreToken(derivedMaster, text, operation);
            await verifyIdentity(restored.token, operation);
          } catch (error) {
            operation.check();
            restored = null;
            warning = "Your saved GitHub connection could not be restored. Connect again.";
          }
        }
        operation.check();
        masterKey = derivedMaster; vaultKey = restored?.key || null; token = restored?.token || "";
        unlocked = true; restoreError = warning;
        return notify("unlocked");
      } catch (error) {
        if (operation.signal.aborted || signal?.aborted) throw cancelled();
        operation.check();
        notify("unlock-failed");
        if (error?.message === "The author password is incorrect." || error?.message === "Author sign in has not been configured correctly."
          || error?.message === "Author sign in requires Web Crypto in a secure browser context.") throw error;
        throw new Error("Author sign in could not be completed. Please try again.");
      } finally { password = ""; operation.finish(); }
    },
    async connect(value, {remember = false, signal} = {}) {
      if (signal?.aborted) throw cancelled();
      if (!unlocked || !masterKey) throw new Error("Unlock the author workspace before connecting to GitHub.");
      const candidate = tokenValue(typeof value === "string" ? value.trim() : value);
      value = "";
      invalidate();
      token = ""; vaultKey = null; restoreError = "";
      const operation = operationFor(signal);
      const activeMaster = masterKey;
      notify("connecting");
      try {
        await verifyIdentity(candidate, operation);
        if (remember === true) {
          const encrypted = await encryptToken(activeMaster, candidate, operation);
          operation.check();
          try { window.localStorage.setItem(STORAGE_KEY, encrypted.text); }
          catch (_) { throw new Error("Browser storage could not save this connection. Connect without Remember this browser."); }
          remembered = true; vaultKey = encrypted.key;
        } else {
          try { window.localStorage.removeItem(STORAGE_KEY); remembered = false; }
          catch (_) {
            if (remembered) throw new Error("Browser storage could not remove the saved connection. Clear saved site data before connecting without Remember this browser.");
            restoreError = "Browser storage is unavailable. This connection will last for this session.";
          }
        }
        operation.check();
        token = candidate;
        return notify("connected");
      } catch (error) {
        if (operation.signal.aborted || signal?.aborted) {
          if (unlocked) notify("connection-cancelled");
          throw cancelled();
        }
        operation.check();
        notify("connection-failed");
        throw error;
      } finally { operation.finish(); }
    },
    signOut() {
      invalidate();
      token = ""; masterKey = null; vaultKey = null; unlocked = false; restoreError = "";
      return notify("signed-out");
    },
    forgetConnection() {
      invalidate();
      token = ""; vaultKey = null; restoreError = "";
      try { window.localStorage.removeItem(STORAGE_KEY); remembered = false; }
      catch (_) { restoreError = "Browser storage could not be cleared. Remove saved site data in your browser."; }
      return notify("connection-forgotten");
    },
    async request(path, {method = "GET", body, signal} = {}) {
      if (!unlocked || !token) throw new Error("Connect the author workspace to GitHub before making this request.");
      const allowed = allowedRequest(path, method, body);
      const operation = operationFor(signal);
      try { return await rawRequest(allowed.path, token, {method, body: allowed.body, operation}); }
      catch (error) {
        operation.check();
        if (error.status === 401 && unlocked && token) {
          invalidate();
          token = ""; vaultKey = null;
          restoreError = "Your GitHub connection has expired. Connect again to publish.";
          notify("connection-expired");
        }
        throw error;
      }
      finally { operation.finish(); }
    },
    subscribe(callback) {
      if (typeof callback !== "function") throw new Error("An author session subscriber must be a function.");
      subscribers.add(callback);
      try { callback(state()); } catch (_) { /* 回调故障与身份验证无关。 */ }
      return () => subscribers.delete(callback);
    }
  });
  window.addEventListener("pagehide", () => api.authorSession.signOut());
})();
