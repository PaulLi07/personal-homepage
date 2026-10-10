/* 只有成功解密后才展示正文；关闭、切换或锁定后移除明文，不保存解锁状态。 */
(function () {
  "use strict";
  const ITERATIONS_MIN = 600000;
  const ITERATIONS_MAX = 2000000;
  const MAX_BYTES = 1024 * 1024;
  const AAD = new TextEncoder().encode("personal-homepage:relationship:v1");
  let viewId = 0;

  function decode(value, maxBytes) {
    if (typeof value !== "string" || !value.length || value.length > Math.ceil(maxBytes / 3) * 4 ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
      throw new Error("Invalid encrypted content.");
    }
    const binary = atob(value);
    if (btoa(binary) !== value) throw new Error("Invalid encrypted content.");
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    if (bytes.length > maxBytes) throw new Error("Invalid encrypted content.");
    return bytes;
  }

  function validatePayload(value) {
    const names = ["version", "iterations", "salt", "iv", "ciphertext"];
    if (!value || typeof value !== "object" || Array.isArray(value) ||
        Object.keys(value).length !== names.length || names.some(name => !Object.hasOwn(value, name)) ||
        value.version !== 1 || !Number.isInteger(value.iterations) ||
        value.iterations < ITERATIONS_MIN || value.iterations > ITERATIONS_MAX) {
      throw new Error("Invalid encrypted content.");
    }
    const salt = decode(value.salt, 16);
    const iv = decode(value.iv, 12);
    const ciphertext = decode(value.ciphertext, MAX_BYTES + 16);
    if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 17) {
      throw new Error("Invalid encrypted content.");
    }
    return { salt, iv, ciphertext };
  }

  async function decrypt(value, password) {
    const parts = validatePayload(value);
    const passwordBytes = new TextEncoder().encode(password);
    let plaintext;
    try {
      const keyMaterial = await crypto.subtle.importKey("raw", passwordBytes, "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: parts.salt,
        iterations: value.iterations }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      plaintext = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: parts.iv,
        additionalData: AAD, tagLength: 128 }, key, parts.ciphertext));
      const item = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(plaintext));
      if (!item || typeof item !== "object" || Array.isArray(item) || Object.keys(item).length !== 2 ||
          typeof item.title !== "string" || typeof item.body !== "string" ||
          !item.title.trim() || item.title.length > 300) throw new Error("Invalid private content.");
      return item;
    } finally {
      passwordBytes.fill(0);
      if (plaintext) plaintext.fill(0);
    }
  }

  window.Homepage.createRelationshipView = function ({ payload }) {
    const getPayload = typeof payload === "function" ? payload : () => payload;
    return {
      render({ host, route, signal }) {
        const container = document.createElement("section");
        container.className = "relationship-security";
        container.setAttribute("aria-label", "Private relationship content");
        const inputId = "relationship-password-" + (++viewId);
        let active = !signal || !signal.aborted;
        let attempt = 0;
        let input = null;
        let secret = null;
        const node = (tag, value, className) => {
          const element = document.createElement(tag);
          if (value) element.textContent = value;
          if (className) element.className = className;
          return element;
        };
        function dispose() {
          active = false;
          attempt += 1;
          if (input) input.value = "";
          input = null;
          secret = null;
          container.replaceChildren();
          container.remove();
          if (signal) signal.removeEventListener("abort", dispose);
        }
        if (!active) return dispose;
        host.replaceChildren(container);
        if (signal) signal.addEventListener("abort", dispose, { once: true });

        function locked() {
          attempt += 1;
          secret = null;
          if (input) input.value = "";
          container.replaceChildren();
          const encrypted = getPayload();
          if (!encrypted) {
            container.append(node("h3", "Not configured yet."), node("p",
              "The author has not added private content yet. Please check back later."));
            return;
          }
          if (!window.crypto || !window.crypto.subtle) {
            container.append(node("h3", "Secure unlock unavailable."), node("p",
              "Open this page over HTTPS or in a supported local browser to unlock private content."));
            return;
          }
          try { validatePayload(encrypted); } catch {
            container.append(node("h3", "Private content unavailable."), node("p",
              "The encrypted content cannot be opened. Please contact the author."));
            return;
          }
          container.append(node("h3", "A private space."), node("p",
            "Enter the shared password to read this section. It locks again when you leave or close the detail."));
          const form = document.createElement("form");
          form.noValidate = true;
          const label = node("label", "Password");
          label.htmlFor = inputId;
          input = document.createElement("input");
          input.id = inputId;
          input.type = "password";
          input.name = "relationship-password";
          input.autocomplete = "current-password";
          input.required = true;
          input.maxLength = 1024;
          const actions = node("div", "", "relationship-actions");
          const button = node("button", "Unlock", "buttondiv");
          button.type = "submit";
          actions.append(button);
          const status = node("p", "", "relationship-status");
          status.setAttribute("role", "status");
          status.setAttribute("aria-live", "polite");
          status.id = inputId + "-status";
          input.setAttribute("aria-describedby", status.id);
          form.append(label, input, actions, status);
          container.append(form);
          form.addEventListener("submit", async event => {
            event.preventDefault();
            if (!active || button.disabled) return;
            const ownAttempt = ++attempt;
            const passwordInput = input;
            if (!passwordInput.value) {
              status.textContent = "Enter a password to continue.";
              passwordInput.setAttribute("aria-invalid", "true");
              passwordInput.focus({preventScroll: true});
              return;
            }
            let password = passwordInput.value;
            passwordInput.value = "";
            passwordInput.removeAttribute("aria-invalid");
            button.disabled = true;
            passwordInput.disabled = true;
            button.textContent = "Unlocking…";
            status.textContent = "Checking password…";
            try {
              const item = await decrypt(encrypted, password);
              if (!active || attempt !== ownAttempt) return;
              secret = item;
              input = null;
              container.replaceChildren(node("h3", secret.title), node("p", secret.body, "relationship-body"));
              const privateActions = node("div", "", "relationship-actions");
              const lock = node("button", "Lock this section", "buttondiv");
              lock.type = "button";
              lock.addEventListener("click", () => {
                if (!active) return;
                locked();
                if (input) input.focus({ preventScroll: true });
              });
              privateActions.append(lock);
              container.append(privateActions);
              lock.focus({ preventScroll: true });
            } catch {
              if (!active || attempt !== ownAttempt) return;
              status.textContent = "Unable to unlock. Check the password and try again.";
              passwordInput.setAttribute("aria-invalid", "true");
              button.textContent = "Unlock";
              button.disabled = false;
              passwordInput.disabled = false;
              passwordInput.focus({ preventScroll: true });
            } finally {
              password = "";
            }
          });
        }
        locked();
        return dispose;
      }
    };
  };
})();
