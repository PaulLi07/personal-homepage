/* PDF 附件只校验基本文件边界并保留原字节；不内嵌、解读或执行 PDF 内容。 */
(function () {
  "use strict";
  const MAX_DOCUMENTS = 3;
  const MAX_FILE = 10 * 1024 * 1024;
  const MAX_TOTAL = 30 * 1024 * 1024;
  const folders = Object.freeze({moments: "modules/life/moments", experience: "modules/academic/experience"});
  const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const aborted = () => new DOMException("Document processing was cancelled.", "AbortError");
  const checkAbort = signal => { if (signal?.aborted) throw aborted(); };
  function folderFor(collectionId) {
    if (!Object.hasOwn(folders, collectionId)) throw new Error("An allowed article collection is required.");
    return folders[collectionId];
  }
  function entryFor(entryId) {
    if (typeof entryId !== "string" || entryId.length > 80 || !slug.test(entryId) || entryId === "author") {
      throw new Error("Enter a valid article address before adding documents.");
    }
    return entryId;
  }
  function pathFor(collectionId, entryId, batchId, index) {
    const folder = folderFor(collectionId);
    entryFor(entryId);
    if (typeof batchId !== "string" || !/^[a-f0-9]{24}$/.test(batchId)
      || !Number.isInteger(index) || index < 1 || index > MAX_DOCUMENTS) throw new Error("Invalid article document path.");
    return folder + "/documents/posts/" + entryId + "/" + batchId + "-" + index + ".pdf";
  }
  function normalize(attachments, collectionId, entryId) {
    const folder = folderFor(collectionId);
    entryFor(entryId);
    if (attachments === undefined) return [];
    if (!Array.isArray(attachments) || attachments.length > MAX_DOCUMENTS) throw new Error("An article can include up to three PDFs.");
    const prefix = folder + "/documents/posts/" + entryId + "/";
    const sources = new Set();
    let total = 0;
    return attachments.map(attachment => {
      if (!attachment || typeof attachment !== "object" || Array.isArray(attachment)
        || typeof attachment.src !== "string" || !attachment.src.startsWith(prefix)
        || !/^[a-f0-9]{24}-[1-3]\.pdf$/.test(attachment.src.slice(prefix.length)) || sources.has(attachment.src)) {
        throw new Error("A PDF must belong to this article and collection.");
      }
      if (typeof attachment.title !== "string" || !attachment.title.trim() || attachment.title.length > 160) {
        throw new Error("Add an English title for every PDF (up to 160 characters).");
      }
      if (!Number.isInteger(attachment.size) || attachment.size < 1 || attachment.size > MAX_FILE) {
        throw new Error("Each PDF must be no larger than 10 MiB.");
      }
      total += attachment.size;
      if (total > MAX_TOTAL) throw new Error("PDF documents must total no more than 30 MiB.");
      sources.add(attachment.src);
      return {src: attachment.src, title: attachment.title.trim(), size: attachment.size};
    });
  }
  function validateBytes(bytes) {
    if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > MAX_FILE) {
      throw new Error("Each PDF must be no larger than 10 MiB.");
    }
    const header = String.fromCharCode(...bytes.subarray(0, 12));
    if (!/^%PDF-[12]\.[0-9](?:[ \t\r\n]|$)/.test(header)) throw new Error("Choose a PDF with a valid version header.");
    let end = bytes.length;
    while (end && [9,10,11,12,13,32].includes(bytes[end - 1])) end -= 1;
    if (end < 5 || String.fromCharCode(...bytes.subarray(end - 5, end)) !== "%%EOF") {
      throw new Error("This PDF is incomplete or has an invalid end marker.");
    }
    return bytes;
  }
  function waitFor(promise, signal) {
    checkAbort(signal);
    if (!signal) return promise;
    return new Promise((resolve, reject) => {
      const cancel = () => { signal.removeEventListener("abort", cancel); reject(aborted()); };
      signal.addEventListener("abort", cancel, {once: true});
      promise.then(value => { signal.removeEventListener("abort", cancel); resolve(value); },
        error => { signal.removeEventListener("abort", cancel); reject(error); });
    });
  }
  async function prepare(file, {signal} = {}) {
    checkAbort(signal);
    if (!(file instanceof Blob) || file.type !== "application/pdf") throw new Error("Choose a PDF document.");
    if (!file.size || file.size > MAX_FILE) throw new Error("Each PDF must be no larger than 10 MiB.");
    const bytes = new Uint8Array(await waitFor(file.arrayBuffer(), signal));
    try {
      checkAbort(signal);
      validateBytes(bytes);
      return {bytes, blob: new Blob([bytes], {type: "application/pdf"})};
    } catch (error) { bytes.fill(0); throw error; }
  }
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  function formatSize(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MiB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KiB";
    return bytes + (bytes === 1 ? " byte" : " bytes");
  }
  function renderAttachments(host, attachments, {collectionId, entryId, signal} = {}) {
    if (!host || typeof host.append !== "function") throw new TypeError("An article document host is required.");
    checkAbort(signal);
    const items = normalize(attachments, collectionId, entryId);
    if (!items.length) return () => {};
    const section = node("section", "article-documents");
    section.setAttribute("aria-label", "PDF attachments");
    section.append(node("h4", "", "Documents"));
    const list = node("ul", "article-documents__list");
    items.forEach(attachment => {
      const item = node("li", "article-documents__item");
      const summary = node("div", "article-documents__summary");
      summary.append(node("h5", "article-documents__title", attachment.title),
        node("p", "article-documents__meta", "PDF · " + formatSize(attachment.size)));
      const actions = node("div", "article-documents__actions");
      const open = node("a", "article-documents__open", "Open PDF ↗");
      open.href = attachment.src; open.target = "_blank"; open.rel = "noopener noreferrer";
      open.setAttribute("aria-label", "Open PDF: " + attachment.title);
      const download = node("a", "article-documents__download", "Download PDF ↓");
      download.href = attachment.src; download.download = attachment.src.split("/").pop();
      download.target = "_blank"; download.rel = "noopener noreferrer";
      download.setAttribute("aria-label", "Download PDF: " + attachment.title);
      actions.append(open, download); item.append(summary, actions); list.append(item);
    });
    section.append(list); host.append(section);
    const dispose = () => { section.remove(); signal?.removeEventListener("abort", dispose); };
    signal?.addEventListener("abort", dispose, {once: true});
    return dispose;
  }
  function createPicker({host, collectionId, signal, onChange} = {}) {
    folderFor(collectionId);
    if (!host || typeof host.append !== "function") throw new TypeError("A document picker host is required.");
    checkAbort(signal);
    const batchId = Array.from(crypto.getRandomValues(new Uint8Array(12)), byte => byte.toString(16).padStart(2, "0")).join("");
    const controller = new AbortController();
    let rowController = new AbortController();
    let active = true, preparing = false, disabled = false, items = [];
    const section = node("section", "article-document-picker");
    section.setAttribute("aria-label", "PDF attachments");
    const label = node("label", "article-document-picker__choose", "Add PDFs (optional)");
    const input = node("input", "article-document-picker__input");
    input.type = "file"; input.multiple = true; input.accept = "application/pdf";
    label.append(input);
    const status = node("p", "article-document-picker__status", "");
    status.setAttribute("role", "status");
    const list = node("div", "article-document-picker__list");
    section.append(node("h4", "", "PDF documents"),
      node("p", "article-document-picker__help", "Up to 3 PDFs, up to 10 MiB each. Documents become public with the article and keep their original metadata."), label, status, list);
    host.append(section);
    const notify = () => { if (active && typeof onChange === "function") onChange({count: items.length, preparing, totalBytes: items.reduce((sum, item) => sum + item.bytes.length, 0)}); };
    function updateControls() {
      section.querySelectorAll("input,button").forEach(control => { control.disabled = disabled || preparing; });
      input.disabled = disabled || preparing || items.length >= MAX_DOCUMENTS;
      list.querySelectorAll(".article-document-picker__item").forEach((row, index) => {
        row.querySelector(".article-document-picker__up").disabled = disabled || preparing || index === 0;
        row.querySelector(".article-document-picker__down").disabled = disabled || preparing || index === items.length - 1;
      });
    }
    function release(item) { item.bytes.fill(0); item.blob = null; }
    function focusAction(index, selector) {
      const row = list.querySelectorAll(".article-document-picker__item")[index];
      const preferred = row?.querySelector(selector);
      const target = preferred && !preferred.disabled ? preferred : row?.querySelector(".article-document-picker__remove");
      (target || input).focus({preventScroll: true});
    }
    function renderRows() {
      rowController.abort(); rowController = new AbortController(); list.replaceChildren();
      if (!items.length) list.append(node("p", "article-document-picker__empty", "No PDF documents selected."));
      items.forEach((item, index) => {
        const row = node("article", "article-document-picker__item");
        row.append(node("h5", "", "Document " + (index + 1)), node("p", "article-document-picker__size", "PDF · " + formatSize(item.bytes.length)));
        const label = node("label", "article-document-picker__field", "Title (English, required)");
        const title = node("input", ""); title.type = "text"; title.name = "document-title";
        title.maxLength = 160; title.required = true; title.value = item.title;
        title.addEventListener("input", () => { item.title = title.value; notify(); }, {signal: rowController.signal});
        label.append(title); row.append(label);
        const actions = node("div", "article-document-picker__actions");
        function action(text, className, accessible, callback) {
          const button = node("button", "article-document-picker__button " + className, text);
          button.type = "button"; button.setAttribute("aria-label", accessible);
          button.addEventListener("click", callback, {signal: rowController.signal}); actions.append(button);
        }
        action("Move up", "article-document-picker__up", "Move document " + (index + 1) + " up", () => {
          if (disabled || preparing || index === 0) return;
          [items[index - 1], items[index]] = [items[index], items[index - 1]];
          renderRows(); focusAction(index - 1, ".article-document-picker__up"); notify();
        });
        action("Move down", "article-document-picker__down", "Move document " + (index + 1) + " down", () => {
          if (disabled || preparing || index === items.length - 1) return;
          [items[index], items[index + 1]] = [items[index + 1], items[index]];
          renderRows(); focusAction(index + 1, ".article-document-picker__down"); notify();
        });
        action("Remove document", "article-document-picker__remove", "Remove document " + (index + 1), () => {
          if (disabled || preparing) return;
          release(items.splice(index, 1)[0]); renderRows(); focusAction(Math.min(index, items.length - 1), ".article-document-picker__remove"); notify();
        });
        row.append(actions); list.append(row);
      });
      updateControls();
    }
    input.addEventListener("change", async () => {
      const files = Array.from(input.files || []); input.value = "";
      if (!active || disabled || preparing || !files.length) return;
      if (items.length + files.length > MAX_DOCUMENTS) { status.textContent = "An article can include up to three PDFs."; return; }
      preparing = true; status.textContent = "Preparing PDF documents…"; updateControls(); notify();
      const staged = [];
      try {
        let total = items.reduce((sum, item) => sum + item.bytes.length, 0);
        for (const file of files) {
          const prepared = await prepare(file, {signal: controller.signal});
          staged.push({...prepared, title: "Document " + (items.length + staged.length + 1)});
          total += prepared.bytes.length;
          if (total > MAX_TOTAL) throw new Error("PDF documents must total no more than 30 MiB.");
        }
        checkAbort(controller.signal); items.push(...staged); staged.length = 0;
        status.textContent = "PDF documents ready. Review their English titles."; renderRows();
      } catch (error) { if (active && error.name !== "AbortError") status.textContent = error.message; }
      finally { staged.forEach(release); preparing = false; if (active) { updateControls(); notify(); } }
    }, {signal: controller.signal});
    function getAttachments(entryId) {
      if (!active) throw new Error("The document picker is no longer active.");
      if (preparing) throw new Error("Wait for the PDF documents to finish processing.");
      return normalize(items.map((item, index) => ({src: pathFor(collectionId, entryId, batchId, index + 1), title: item.title, size: item.bytes.length})), collectionId, entryId);
    }
    function dispose() {
      if (!active) return;
      active = false; controller.abort(); rowController.abort(); input.value = "";
      section.querySelectorAll("input").forEach(field => { field.value = ""; });
      items.forEach(release); items = []; section.remove(); signal?.removeEventListener("abort", dispose);
    }
    signal?.addEventListener("abort", dispose, {once: true}); renderRows();
    return {getAttachments, getFiles(entryId) { return getAttachments(entryId).map((attachment, index) => ({path: attachment.src, bytes: items[index].bytes})); },
      dispose, isPreparing() { return active && preparing; }, setDisabled(value) { disabled = Boolean(value); if (active) updateControls(); }};
  }
  window.Homepage.articleDocuments = Object.freeze({normalize, pathFor, validateBytes, prepare, createPicker, renderAttachments});
})();
