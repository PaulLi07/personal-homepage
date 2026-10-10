/* 统一作者编辑器通过公开集合契约发布；各栏目保留自己的数据和阅读界面。 */
(function () {
  "use strict";
  const api = window.Homepage;
  const allowed = Object.freeze({
    moments: {path: "modules/life/moments/posts.js", registration: "registerBlogPosts"},
    experience: {path: "modules/academic/experience/entries.js", registration: "registerAcademicLogs"}
  });
  const encoder = new TextEncoder();
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  api.createAuthorEditor = function ({collection, onPublished, onCancel}) {
    const contract = allowed[collection?.id];
    if (!contract || contract.path !== collection.path || contract.registration !== collection.registration
      || typeof collection.getRecords !== "function" || typeof collection.normalize !== "function") {
      throw new TypeError("An allowed author collection is required.");
    }
    const session = api.authorSession;
    const publisher = api.createAuthorPublisher(collection);
    const {sourceFor, merge} = publisher;
    return {
      render({host, signal}) {
        if (signal?.aborted) return () => {};
        const controller = new AbortController();
        let formController = null;
        let active = true;
        let busy = false;
        let mode = null;
        let currentState = null;
        let unsubscribe = () => {};
        let connectedMessage = null;
        let connectionForm = null;
        let publish = null;
        let forget = null;
        let photoPicker = null;
        let documentPicker = null;
        let download = null;
        const section = node("section", undefined, "author-workspace author-workspace--" + collection.id);
        section.setAttribute("aria-label", collection.label + " author workspace");
        const status = node("p", "", "author-workspace__status");
        status.setAttribute("role", "status");
        const abort = () => dispose();
        signal?.addEventListener("abort", abort, {once: true});
        function dispose() {
          if (!active) return;
          active = false;
          photoPicker?.dispose(); photoPicker = null;
          documentPicker?.dispose(); documentPicker = null;
          unsubscribe();
          formController?.abort();
          controller.abort();
          signal?.removeEventListener("abort", abort);
          section.querySelectorAll("input,textarea").forEach(input => { input.value = ""; });
          section.remove();
        }
        function listen(element, event, callback) {
          element.addEventListener(event, callback, {signal: formController.signal});
        }
        function button(text, action, className = "author-workspace__button") {
          const element = node("button", text, className);
          element.type = "button";
          listen(element, "click", action);
          return element;
        }
        function updateControls() {
          if (!active) return;
          section.querySelectorAll("button,input,textarea,select").forEach(element => { element.disabled = busy; });
          photoPicker?.setDisabled(busy);
          documentPicker?.setDisabled(busy);
          const preparing = photoPicker?.isPreparing() || documentPicker?.isPreparing();
          if (publish) publish.disabled = busy || preparing || !currentState?.connected;
          if (download) download.disabled = busy || preparing;
          if (forget) forget.hidden = !currentState?.remembered;
          if (connectionForm) connectionForm.hidden = Boolean(currentState?.connected);
          if (connectedMessage && currentState) {
            connectedMessage.textContent = currentState.connected
              ? "Connected as PaulLi07." + (currentState.remembered ? " Your encrypted connection is saved in this browser." : " This connection lasts for this session.")
              : currentState.restoreError || "Connect to GitHub once to publish. You can prepare an entry before connecting.";
          }
        }
        function header(title) {
          formController?.abort();
          photoPicker?.dispose(); photoPicker = null;
          documentPicker?.dispose(); documentPicker = null;
          formController = new AbortController();
          section.replaceChildren();
          publish = null; download = null; forget = null; connectedMessage = null; connectionForm = null;
          const heading = node("h3", title);
          heading.tabIndex = -1;
          heading.setAttribute("data-view-heading", "");
          section.append(node("p", collection.eyebrow, "author-workspace__eyebrow"), heading,
            button(collection.id === "experience" ? "← All entries" : "← All posts", () => onCancel?.(), "author-workspace__back"));
          status.textContent = "";
          if (document.getElementById("detail-dialog")?.open) heading.focus({preventScroll: true});
        }
        function field(form, name, labelText, {type = "text", maxLength, value = "", multiline = false, options, required = true} = {}) {
          const label = node("label", labelText, "author-workspace__field");
          const input = document.createElement(options ? "select" : multiline ? "textarea" : "input");
          if (options) options.forEach(option => { const item = node("option", option); item.value = option; input.append(item); });
          else if (!multiline) input.type = type;
          input.name = name;
          input.required = required;
          if (maxLength) input.maxLength = maxLength;
          if (!options || value) input.value = value;
          if (multiline) input.rows = name === "body" ? 12 : 3;
          label.append(input);
          form.append(label);
          return input;
        }
        function signIn() {
          header("Author sign in");
          section.append(node("p", "One author account for Moments and Experience. Enter your author password to continue."));
          const form = document.createElement("form");
          form.noValidate = true;
          const input = field(form, "author-password", "Author password", {type: "password", maxLength: 4096});
          input.autocomplete = "current-password";
          const submit = node("button", "Sign in", "author-workspace__button");
          submit.type = "submit";
          form.append(submit);
          section.append(form, status);
          listen(form, "submit", async event => {
            event.preventDefault();
            if (busy) return;
            let password = input.value;
            input.value = "";
            if (!password) { status.textContent = "Enter your author password to continue."; input.focus(); return; }
            busy = true; updateControls();
            status.textContent = "Unlocking the author workspace…";
            try { await session.unlock(password, {signal: controller.signal}); }
            catch (error) { if (active && error.name !== "AbortError") status.textContent = error.message; }
            finally { password = ""; busy = false; updateControls(); }
          });
        }
        function connection() {
          const panel = node("div", undefined, "author-workspace__connection-panel");
          panel.append(node("h4", "Publishing connection"));
          connectedMessage = node("p", "", "author-workspace__connection");
          connectedMessage.setAttribute("role", "status");
          panel.append(connectedMessage);
          connectionForm = document.createElement("form");
          connectionForm.noValidate = true;
          const token = field(connectionForm, "token", "GitHub repository token", {type: "password", maxLength: 500});
          token.autocomplete = "off";
          token.spellcheck = false;
          const label = node("label", undefined, "author-workspace__remember");
          const remember = document.createElement("input");
          remember.type = "checkbox";
          remember.name = "remember";
          label.append(remember, node("span", "Remember encrypted connection in this browser"));
          connectionForm.append(label);
          const help = node("a", "Create a repository token ↗");
          help.href = "https://github.com/settings/personal-access-tokens/new";
          help.target = "_blank";
          help.rel = "noopener noreferrer";
          connectionForm.append(node("p", "Select PaulLi07 / personal-homepage and allow Contents read and write. Only the repository owner can connect."), help);
          const connect = node("button", "Connect GitHub", "author-workspace__button");
          connect.type = "submit";
          connectionForm.append(connect);
          panel.append(connectionForm);
          forget = button("Forget saved connection", () => {
            const result = session.forgetConnection();
            status.textContent = result.restoreError || (result.remembered
              ? "The saved connection could not be removed. Clear this site's data in your browser."
              : "Saved connection removed. Your author workspace remains unlocked.");
          }, "author-workspace__back");
          panel.append(forget);
          section.append(panel);
          listen(connectionForm, "submit", async event => {
            event.preventDefault();
            if (busy) return;
            let candidate = token.value.trim();
            token.value = "";
            if (!candidate) { status.textContent = "Enter your GitHub token to connect."; token.focus(); return; }
            busy = true; updateControls();
            status.textContent = "Connecting to GitHub…";
            try {
              await session.connect(candidate, {remember: remember.checked, signal: controller.signal});
              if (active) status.textContent = "GitHub connected. You can now publish.";
            } catch (error) { if (active && error.name !== "AbortError") status.textContent = error.message; }
            finally { candidate = ""; busy = false; updateControls(); }
          });
        }
        function editor() {
          header(collection.editorTitle);
          const actions = node("div", undefined, "author-workspace__session-actions");
          actions.append(node("p", "Author workspace unlocked. Your login is shared across Moments and Experience."),
            button("Sign out", () => session.signOut(), "author-workspace__back"));
          section.append(actions);
          connection();
          const form = document.createElement("form");
          form.noValidate = true;
          form.className = "author-workspace__draft";
          const title = field(form, "title", "Title", {maxLength: 160});
          const slug = field(form, "id", "Entry address", {maxLength: 80});
          slug.pattern = "[a-z0-9]+(-[a-z0-9]+)*";
          const help = node("p", "Use lowercase letters, numbers and hyphens. Keep this address unique and stable.");
          help.id = "author-slug-help-" + collection.id;
          slug.setAttribute("aria-describedby", help.id);
          form.append(help);
          listen(title, "input", () => {
            if (!slug.dataset.edited) slug.value = title.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80).replace(/-$/, "");
          });
          listen(slug, "input", () => { slug.dataset.edited = "true"; });
          const today = new Date();
          const date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
          field(form, "date", "Publication date", {type: "date", value: date});
          for (const extra of collection.fields || []) field(form, extra.name, extra.label, {...extra, maxLength: extra.name === "reference" ? 2000 : undefined});
          field(form, "excerpt", collection.id === "experience" ? "Summary" : "Short introduction", {maxLength: 600, multiline: true});
          field(form, "body", collection.id === "experience" ? "Log entry" : "Article", {maxLength: 50000, multiline: true});
          const photos = node("div");
          form.append(photos);
          photoPicker = api.articlePhotos.createPicker({host: photos, collectionId: collection.id,
            signal: formController.signal, onChange: updateControls});
          const documents = node("div");
          form.append(documents);
          documentPicker = api.articleDocuments.createPicker({host: documents, collectionId: collection.id,
            signal: formController.signal, onChange: updateControls});
          form.append(node("p", "Write in English using plain text. Line breaks are preserved. Entries are public once published; keep a local copy of longer drafts."));
          const controls = node("div", undefined, "author-workspace__actions");
          publish = node("button", "Publish to GitHub", "author-workspace__button");
          publish.type = "submit";
          download = button("Download update", () => {
            if (busy || !session.isUnlocked()) return;
            try {
              const entry = draft();
              const source = sourceFor(merge(collection.normalize(collection.getRecords()), entry));
              const files = selectedFiles(entry.id);
              if (files.length) {
                api.articlePhotos.downloadBundle([{path: contract.path, bytes: encoder.encode(source)}, ...files], entry.id + "-update.zip");
                status.textContent = "Update downloaded. Extract the ZIP and upload its contents to the repository root to publish manually.";
                return;
              }
              const url = URL.createObjectURL(new Blob([source], {type: "text/javascript;charset=utf-8"}));
              const link = document.createElement("a");
              link.href = url;
              link.download = contract.path.split("/").pop();
              section.append(link); link.click(); link.remove();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              status.textContent = "Update downloaded. Upload it to " + contract.path + " to publish manually.";
            } catch (error) { status.textContent = error.message; }
          }, "author-workspace__back");
          controls.append(publish, download);
          form.append(controls);
          section.append(form, status);
          function draft() {
            const data = new FormData(form);
            let entry = {};
            for (const key of ["id", "title", "date", "excerpt", "body", ...(collection.fields || []).map(extra => extra.name)]) {
              const value = data.get(key);
              if (typeof value === "string") entry[key] = value.trim();
            }
            entry.author = "Yuhong Li";
            entry = collection.normalize([entry])[0];
            const selected = photoPicker.getPhotos(entry.id);
            if (selected.length) entry.photos = selected;
            const attachments = documentPicker.getAttachments(entry.id);
            if (attachments.length) entry.attachments = attachments;
            return collection.normalize([entry])[0];
          }
          function selectedFiles(entryId) {
            return [...photoPicker.getFiles(entryId), ...documentPicker.getFiles(entryId)];
          }
          listen(form, "submit", async event => {
            event.preventDefault();
            if (busy || !session.isUnlocked()) return;
            let entry;
            try { entry = draft(); }
            catch (error) { status.textContent = error.message; return; }
            if (!session.isConnected()) { status.textContent = "Connect to GitHub before publishing."; return; }
            busy = true; updateControls();
            status.textContent = "Publishing to GitHub…";
            try {
              const records = await publisher.publish(entry, {files: selectedFiles(entry.id), signal: controller.signal,
                onProgress(message) { if (active) status.textContent = message; }});
              if (active) { status.textContent = "Published to GitHub. The live website may take a moment to update."; onPublished?.(entry, records); }
            } catch (error) { if (active && error.name !== "AbortError") status.textContent = error.message; }
            finally { busy = false; updateControls(); }
          });
        }
        host.replaceChildren(section);
        unsubscribe = session.subscribe(state => {
          if (!active) return;
          currentState = state;
          const nextMode = state.unlocked ? "editor" : "sign-in";
          if (mode !== nextMode) { mode = nextMode; if (state.unlocked) editor(); else signIn(); }
          updateControls();
        });
        return dispose;
      }
    };
  };
})();
