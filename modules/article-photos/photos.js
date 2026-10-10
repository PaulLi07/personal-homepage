/* 两栏共用的公开文章照片服务；处理、预览和下载均在浏览器本地完成。 */
(function () {
  "use strict";
  const MAX_PHOTOS = 6;
  const MAX_INPUT = 10 * 1024 * 1024;
  const MAX_OUTPUT = 2 * 1024 * 1024;
  const MAX_TOTAL = 8 * 1024 * 1024;
  const MAX_PIXELS = 40000000;
  const folders = Object.freeze({moments: "modules/life/moments", experience: "modules/academic/experience"});
  const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const encoder = new TextEncoder();
  const aborted = () => new DOMException("Photo processing was cancelled.", "AbortError");
  const checkAbort = signal => { if (signal?.aborted) throw aborted(); };
  function folderFor(collectionId) {
    if (!Object.hasOwn(folders, collectionId)) throw new Error("An allowed article collection is required.");
    return folders[collectionId];
  }
  function entryFor(entryId) {
    if (typeof entryId !== "string" || entryId.length > 80 || !slug.test(entryId) || entryId === "author") {
      throw new Error("Enter a valid article address before adding photos.");
    }
    return entryId;
  }
  function pathFor(collectionId, entryId, batchId, index) {
    const folder = folderFor(collectionId);
    entryFor(entryId);
    if (typeof batchId !== "string" || !/^[a-f0-9]{24}$/.test(batchId)
      || !Number.isInteger(index) || index < 1 || index > MAX_PHOTOS) throw new Error("Invalid article photo path.");
    return folder + "/images/posts/" + entryId + "/" + batchId + "-" + index + ".jpg";
  }
  function normalize(photos, collectionId, entryId) {
    const folder = folderFor(collectionId);
    entryFor(entryId);
    if (photos === undefined) return [];
    if (!Array.isArray(photos) || photos.length > MAX_PHOTOS) throw new Error("An article can include up to six photos.");
    const prefix = folder + "/images/posts/" + entryId + "/";
    const sources = new Set();
    return photos.map(photo => {
      if (!photo || typeof photo !== "object" || Array.isArray(photo)
        || typeof photo.src !== "string" || !photo.src.startsWith(prefix)
        || !/^[a-f0-9]{24}-[1-6]\.jpg$/.test(photo.src.slice(prefix.length)) || sources.has(photo.src)) {
        throw new Error("A photo must belong to this article and collection.");
      }
      if (typeof photo.alt !== "string" || !photo.alt.trim() || photo.alt.length > 300) {
        throw new Error("Add alternative text in English for every photo (up to 300 characters).");
      }
      if (photo.caption !== undefined && (typeof photo.caption !== "string" || photo.caption.length > 600)) {
        throw new Error("Photo captions must be text of up to 600 characters.");
      }
      sources.add(photo.src);
      return {src: photo.src, alt: photo.alt.trim(), ...(photo.caption?.trim() ? {caption: photo.caption.trim()} : {})};
    });
  }
  function dimensions(bytes, mime) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const text = (start, length) => String.fromCharCode(...bytes.subarray(start, start + length));
    if (mime === "image/png") {
      if (bytes.length < 33 || ![137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value)
        || text(12, 4) !== "IHDR" || view.getUint32(8) !== 13) throw new Error("The file is not a valid PNG image.");
      return {width: view.getUint32(16), height: view.getUint32(20)};
    }
    if (mime === "image/jpeg") {
      if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) throw new Error("The file is not a valid JPEG image.");
      let offset = 2;
      while (offset + 3 < bytes.length) {
        if (bytes[offset++] !== 255) break;
        while (bytes[offset] === 255) offset += 1;
        const marker = bytes[offset++];
        if (marker === 217 || marker === 218) break;
        if (marker === 1 || marker === 216 || (marker >= 208 && marker <= 215)) continue;
        if (offset + 2 > bytes.length) break;
        const size = view.getUint16(offset);
        if (size < 2 || offset + size > bytes.length) break;
        if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && size >= 8) {
          return {width: view.getUint16(offset + 5), height: view.getUint16(offset + 3)};
        }
        offset += size;
      }
      throw new Error("The JPEG image has an invalid size header.");
    }
    if (mime === "image/webp") {
      if (bytes.length < 25 || text(0, 4) !== "RIFF" || text(8, 4) !== "WEBP"
        || view.getUint32(4, true) + 8 > bytes.length) throw new Error("The file is not a valid WebP image.");
      let offset = 12;
      while (offset + 8 <= bytes.length) {
        const kind = text(offset, 4);
        const length = view.getUint32(offset + 4, true);
        const data = offset + 8;
        if (data + length > bytes.length) break;
        if (kind === "VP8X" && length >= 10) return {
          width: 1 + bytes[data + 4] + (bytes[data + 5] << 8) + (bytes[data + 6] << 16),
          height: 1 + bytes[data + 7] + (bytes[data + 8] << 8) + (bytes[data + 9] << 16)
        };
        if (kind === "VP8L" && length >= 5 && bytes[data] === 47) {
          const packed = view.getUint32(data + 1, true);
          return {width: 1 + (packed & 16383), height: 1 + ((packed >>> 14) & 16383)};
        }
        if (kind === "VP8 " && length >= 10 && bytes[data + 3] === 157 && bytes[data + 4] === 1 && bytes[data + 5] === 42) {
          return {width: view.getUint16(data + 6, true) & 16383, height: view.getUint16(data + 8, true) & 16383};
        }
        offset = data + length + (length & 1);
      }
      throw new Error("The WebP image has an invalid size header.");
    }
    throw new Error("Choose a JPEG, PNG or WebP image.");
  }
  function checkDimensions(size) {
    if (!Number.isInteger(size.width) || !Number.isInteger(size.height) || size.width < 1 || size.height < 1
      || size.width * size.height > MAX_PIXELS) throw new Error("Each image must be no larger than 40 megapixels.");
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
  function stripJPEGMetadata(bytes) {
    const invalid = () => new Error("The encoded JPEG is invalid. Choose another photo.");
    if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216) throw invalid();
    const pieces = [bytes.subarray(0, 2)];
    let offset = 2;
    let frame = false;
    let scanned = false;
    let ended = false;
    while (offset < bytes.length) {
      const start = offset;
      if (bytes[offset++] !== 255) throw invalid();
      while (offset < bytes.length && bytes[offset] === 255) offset += 1;
      if (offset >= bytes.length) throw invalid();
      const marker = bytes[offset++];
      if (marker === 0 || marker === 216) throw invalid();
      if (marker === 217) {
        if (!frame || !scanned || offset !== bytes.length) throw invalid();
        pieces.push(bytes.subarray(start, offset));
        ended = true;
        break;
      }
      if (marker === 1) { pieces.push(bytes.subarray(start, offset)); continue; }
      if (marker >= 208 && marker <= 215) throw invalid();
      if (offset + 2 > bytes.length) throw invalid();
      const length = (bytes[offset] << 8) | bytes[offset + 1];
      const end = offset + length;
      if (length < 2 || end > bytes.length) throw invalid();
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)) {
        if (length < 8) throw invalid();
        frame = true;
      }
      // APP1 可承载 EXIF/XMP，APP13 可承载 IPTC；ICC 所在 APP2 与其他编码段原样保留。
      if (marker !== 225 && marker !== 237) pieces.push(bytes.subarray(start, end));
      offset = end;
      if (marker !== 218) continue;
      if (!frame || length < 6) throw invalid();
      scanned = true;
      const scanStart = offset;
      let nextMarker = false;
      while (offset < bytes.length) {
        if (bytes[offset] !== 255) { offset += 1; continue; }
        const markerStart = offset;
        let codeAt = offset + 1;
        while (codeAt < bytes.length && bytes[codeAt] === 255) codeAt += 1;
        if (codeAt >= bytes.length) throw invalid();
        const code = bytes[codeAt];
        // 扫描内 FF00 是转义字节；重启标记和 TEM 不终止当前压缩像素段。
        if (code === 0 || code === 1 || (code >= 208 && code <= 215)) { offset = codeAt + 1; continue; }
        pieces.push(bytes.subarray(scanStart, markerStart));
        offset = markerStart;
        nextMarker = true;
        break;
      }
      if (!nextMarker) throw invalid();
    }
    if (!ended) throw invalid();
    const output = new Uint8Array(pieces.reduce((size, piece) => size + piece.length, 0));
    let position = 0;
    for (const piece of pieces) { output.set(piece, position); position += piece.length; }
    return output;
  }
  async function prepare(file, {signal} = {}) {
    checkAbort(signal);
    if (!(file instanceof Blob) || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("Choose a JPEG, PNG or WebP image.");
    }
    if (!file.size || file.size > MAX_INPUT) throw new Error("Each original image must be no larger than 10 MiB.");
    const raw = new Uint8Array(await waitFor(file.arrayBuffer(), signal));
    let url = null;
    let image = null;
    let canvas = null;
    let output = null;
    try {
      checkAbort(signal);
      checkDimensions(dimensions(raw, file.type));
      image = new Image();
      image.decoding = "async";
      url = URL.createObjectURL(file);
      const loaded = new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("This image could not be decoded. Choose another photo."));
        image.src = url;
      });
      await waitFor(loaded, signal);
      checkAbort(signal);
      checkDimensions({width: image.naturalWidth, height: image.naturalHeight});
      canvas = document.createElement("canvas");
      const ratio = Math.min(1, 1920 / Math.max(image.naturalWidth, image.naturalHeight));
      let width = Math.max(1, Math.round(image.naturalWidth * ratio));
      let height = Math.max(1, Math.round(image.naturalHeight * ratio));
      let quality = .88;
      for (let attempt = 0; attempt < 12; attempt += 1) {
        checkAbort(signal);
        canvas.width = width; canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Photo processing is unavailable in this browser.");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        const blob = await waitFor(new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality)), signal);
        checkAbort(signal);
        if (!blob || blob.type !== "image/jpeg") throw new Error("This browser could not create a JPEG photo.");
        const encoded = new Uint8Array(await waitFor(blob.arrayBuffer(), signal));
        try { output = stripJPEGMetadata(encoded); }
        finally { encoded.fill(0); }
        checkAbort(signal);
        if (output.length <= MAX_OUTPUT) return {bytes: output, blob: new Blob([output], {type: "image/jpeg"}), width, height};
        output.fill(0); output = null;
        if (quality > .52) quality -= .12;
        else { width = Math.max(1, Math.floor(width * .8)); height = Math.max(1, Math.floor(height * .8)); quality = .76; }
      }
      throw new Error("This image could not be reduced below 2 MiB. Choose a smaller photo.");
    } finally {
      raw.fill(0);
      if (image) { image.onload = null; image.onerror = null; image.src = ""; }
      if (url) URL.revokeObjectURL(url);
      if (canvas) { canvas.width = 0; canvas.height = 0; }
      if (signal?.aborted && output) output.fill(0);
    }
  }
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  function renderGallery(host, photos, {collectionId, entryId, signal} = {}) {
    if (!host || typeof host.append !== "function") throw new TypeError("An article gallery host is required.");
    checkAbort(signal);
    const prefix = folderFor(collectionId) + "/images/posts/";
    if (photos !== undefined && !Array.isArray(photos)) throw new Error("An article can include up to six photos.");
    if (!photos?.length) { if (entryId !== undefined) entryFor(entryId); return () => {}; }
    const inferred = typeof photos[0]?.src === "string" && photos[0].src.startsWith(prefix)
      ? photos[0].src.slice(prefix.length).split("/")[0] : null;
    const items = normalize(photos, collectionId, entryId ?? inferred);
    const controller = new AbortController();
    const gallery = node("div", "article-photos");
    gallery.setAttribute("aria-label", "Article photos");
    items.forEach(photo => {
      const figure = node("figure", "article-photos__figure");
      const image = node("img", "article-photos__image");
      image.src = photo.src; image.alt = photo.alt; image.loading = "lazy"; image.decoding = "async";
      image.addEventListener("error", () => {
        image.hidden = true;
        figure.prepend(node("p", "article-photos__unavailable", "Photo unavailable."));
      }, {once: true, signal: controller.signal});
      figure.append(image);
      if (photo.caption) figure.append(node("figcaption", "article-photos__caption", photo.caption));
      gallery.append(figure);
    });
    host.append(gallery);
    const dispose = () => { controller.abort(); gallery.remove(); signal?.removeEventListener("abort", dispose); };
    signal?.addEventListener("abort", dispose, {once: true});
    return dispose;
  }
  function createPicker({host, collectionId, signal, onChange} = {}) {
    folderFor(collectionId);
    if (!host || typeof host.append !== "function") throw new TypeError("A photo picker host is required.");
    checkAbort(signal);
    const batchId = Array.from(crypto.getRandomValues(new Uint8Array(12)), byte => byte.toString(16).padStart(2, "0")).join("");
    const controller = new AbortController();
    let rowController = new AbortController();
    let active = true;
    let preparing = false;
    let disabled = false;
    let items = [];
    const section = node("section", "article-photo-picker");
    section.setAttribute("aria-label", "Article photos");
    const label = node("label", "article-photo-picker__choose", "Add photos (optional)");
    const input = node("input", "article-photo-picker__input");
    input.type = "file"; input.multiple = true; input.accept = "image/jpeg,image/png,image/webp";
    label.append(input);
    const help = node("p", "article-photo-picker__help", "Up to 6 photos. JPEG, PNG or WebP, up to 10 MiB each. Photos become public with the article; location metadata is removed.");
    const status = node("p", "article-photo-picker__status", "");
    status.setAttribute("role", "status");
    const list = node("div", "article-photo-picker__list");
    section.append(node("h4", "", "Photos"), help, label, status, list);
    host.append(section);
    const notify = () => { if (active && typeof onChange === "function") onChange({count: items.length, preparing, totalBytes: items.reduce((sum, item) => sum + item.bytes.length, 0)}); };
    function updateControls() {
      section.querySelectorAll("input,textarea,button").forEach(control => { control.disabled = disabled || preparing; });
      input.disabled = disabled || preparing || items.length >= MAX_PHOTOS;
      list.querySelectorAll(".article-photo-picker__item").forEach((row, index) => {
        row.querySelector(".article-photo-picker__up").disabled = disabled || preparing || index === 0;
        row.querySelector(".article-photo-picker__down").disabled = disabled || preparing || index === items.length - 1;
      });
    }
    function release(item) {
      URL.revokeObjectURL(item.url);
      item.bytes.fill(0);
      item.blob = null;
    }
    function focusAction(index, action) {
      const row = list.querySelectorAll(".article-photo-picker__item")[index];
      const preferred = row?.querySelector(action);
      const target = preferred && !preferred.disabled ? preferred : row?.querySelector(".article-photo-picker__remove");
      (target || input).focus({preventScroll: true});
    }
    function renderRows() {
      rowController.abort(); rowController = new AbortController();
      list.replaceChildren();
      if (!items.length) list.append(node("p", "article-photo-picker__empty", "No photos selected."));
      items.forEach((item, index) => {
        const row = node("article", "article-photo-picker__item");
        const preview = node("img", "article-photo-picker__preview");
        preview.src = item.url; preview.alt = item.alt.trim() || "Selected photo preview";
        preview.width = item.width; preview.height = item.height;
        const fields = node("div", "article-photo-picker__fields");
        fields.append(node("h5", "", "Photo " + (index + 1)));
        function field(name, text, multiline, maxLength, value) {
          const label = node("label", "article-photo-picker__field", text);
          const element = node(multiline ? "textarea" : "input", "");
          if (!multiline) element.type = "text";
          else element.rows = 2;
          element.name = name; element.maxLength = maxLength; element.value = value;
          element.required = !multiline;
          element.addEventListener("input", () => {
            if (multiline) item.caption = element.value;
            else { item.alt = element.value; preview.alt = element.value.trim() || "Selected photo preview"; }
            notify();
          }, {signal: rowController.signal});
          label.append(element); fields.append(label);
        }
        field("photo-alt", "Alternative text (English, required)", false, 300, item.alt);
        field("photo-caption", "Caption (English, optional)", true, 600, item.caption);
        const actions = node("div", "article-photo-picker__actions");
        function action(text, className, accessible, callback) {
          const button = node("button", "article-photo-picker__button " + className, text);
          button.type = "button"; button.setAttribute("aria-label", accessible);
          button.addEventListener("click", callback, {signal: rowController.signal});
          actions.append(button);
        }
        action("Move up", "article-photo-picker__up", "Move photo " + (index + 1) + " up", () => {
          if (disabled || preparing || index === 0) return;
          [items[index - 1], items[index]] = [items[index], items[index - 1]]; renderRows(); focusAction(index - 1, ".article-photo-picker__up"); notify();
        });
        action("Move down", "article-photo-picker__down", "Move photo " + (index + 1) + " down", () => {
          if (disabled || preparing || index === items.length - 1) return;
          [items[index], items[index + 1]] = [items[index + 1], items[index]]; renderRows(); focusAction(index + 1, ".article-photo-picker__down"); notify();
        });
        action("Remove photo", "article-photo-picker__remove", "Remove photo " + (index + 1), () => {
          if (disabled || preparing) return;
          release(items.splice(index, 1)[0]); renderRows(); focusAction(Math.min(index, items.length - 1), ".article-photo-picker__remove"); notify();
        });
        fields.append(actions); row.append(preview, fields); list.append(row);
      });
      updateControls();
    }
    input.addEventListener("change", async () => {
      const files = Array.from(input.files || []);
      input.value = "";
      if (!active || disabled || preparing || !files.length) return;
      if (items.length + files.length > MAX_PHOTOS) { status.textContent = "An article can include up to six photos."; return; }
      preparing = true; status.textContent = "Processing photos…"; updateControls(); notify();
      const staged = [];
      try {
        let total = items.reduce((sum, item) => sum + item.bytes.length, 0);
        for (const file of files) {
          const prepared = await prepare(file, {signal: controller.signal});
          staged.push({...prepared, alt: "", caption: "", url: URL.createObjectURL(prepared.blob)});
          total += prepared.bytes.length;
          if (total > MAX_TOTAL) throw new Error("The prepared photos must total no more than 8 MiB. Remove a photo or choose smaller images.");
        }
        checkAbort(controller.signal);
        items.push(...staged);
        staged.length = 0;
        status.textContent = "Photos ready. Add alternative text in English for every photo.";
        renderRows();
      } catch (error) {
        if (active && error.name !== "AbortError") status.textContent = error.message;
      } finally {
        staged.forEach(release);
        preparing = false;
        if (active) { updateControls(); notify(); }
      }
    }, {signal: controller.signal});
    function ready() {
      if (!active) throw new Error("The photo picker is no longer active.");
      if (preparing) throw new Error("Wait for the photos to finish processing.");
    }
    function getPhotos(entryId) {
      ready();
      return normalize(items.map((item, index) => ({src: pathFor(collectionId, entryId, batchId, index + 1), alt: item.alt, caption: item.caption})), collectionId, entryId);
    }
    function dispose() {
      if (!active) return;
      active = false; controller.abort(); rowController.abort();
      input.value = "";
      section.querySelectorAll("input,textarea").forEach(field => { field.value = ""; });
      items.forEach(release); items = [];
      section.remove(); signal?.removeEventListener("abort", dispose);
    }
    signal?.addEventListener("abort", dispose, {once: true});
    renderRows();
    return {getPhotos, getFiles(entryId) { return getPhotos(entryId).map((photo, index) => ({path: photo.src, bytes: items[index].bytes})); },
      dispose, isPreparing() { return active && preparing; }, setDisabled(value) { disabled = Boolean(value); if (active) updateControls(); }};
  }
  const crcTable = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    crcTable[index] = value >>> 0;
  }
  function crc32(bytes) {
    let value = 0xffffffff;
    for (const byte of bytes) value = (value >>> 8) ^ crcTable[(value ^ byte) & 255];
    return (value ^ 0xffffffff) >>> 0;
  }
  function downloadBundle(files, name) {
    if (!Array.isArray(files) || !files.length || files.length > 100) throw new Error("A download bundle needs valid files.");
    if (typeof name !== "string" || !/^[a-z0-9][a-z0-9._-]{0,150}\.zip$/i.test(name)) throw new Error("Choose a valid ZIP filename.");
    const local = [], central = [], names = new Set();
    let offset = 0, centralSize = 0, total = 0;
    for (const file of files) {
      if (!file || typeof file.path !== "string" || file.path.length > 512 || !/^[A-Za-z0-9_-][A-Za-z0-9._/-]*$/.test(file.path)
        || file.path.split("/").some(part => !part || part.startsWith(".")) || names.has(file.path)
        || !(file.bytes instanceof Uint8Array)) throw new Error("A download file needs a safe relative path and bytes.");
      names.add(file.path); total += file.bytes.length;
      if (total > 16 * 1024 * 1024) throw new Error("The download bundle is too large.");
      const filename = encoder.encode(file.path), checksum = crc32(file.bytes);
      const header = new Uint8Array(30), h = new DataView(header.buffer);
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x800, true);
      h.setUint16(12, 33, true); h.setUint32(14, checksum, true);
      h.setUint32(18, file.bytes.length, true); h.setUint32(22, file.bytes.length, true); h.setUint16(26, filename.length, true);
      local.push(header, filename, file.bytes);
      const directory = new Uint8Array(46), d = new DataView(directory.buffer);
      d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true); d.setUint16(8, 0x800, true);
      d.setUint16(14, 33, true); d.setUint32(16, checksum, true); d.setUint32(20, file.bytes.length, true);
      d.setUint32(24, file.bytes.length, true); d.setUint16(28, filename.length, true); d.setUint32(42, offset, true);
      central.push(directory, filename);
      offset += header.length + filename.length + file.bytes.length; centralSize += directory.length + filename.length;
    }
    const end = new Uint8Array(22), e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, centralSize, true); e.setUint32(16, offset, true);
    const blob = new Blob([...local, ...central, end], {type: "application/zip"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = name; link.hidden = true;
    try { document.body.append(link); link.click(); }
    finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    return blob;
  }
  window.Homepage.articlePhotos = Object.freeze({normalize, prepare, pathFor, renderGallery, createPicker, downloadBundle});
})();
