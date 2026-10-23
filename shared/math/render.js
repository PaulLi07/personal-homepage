/* 按调用者显式提供的行内 LaTeX 排版，不扫描页面或解释普通文章 HTML。 */
(function () {
  "use strict";
  const api = window.Homepage;
  const limit = 2400;
  const unsafe = /\\(?:href|url|includegraphics|html[A-Za-z]*)(?![A-Za-z])/;

  function partsOf(source) {
    const parts = [];
    let cursor = 0;
    while (cursor < source.length) {
      const start = source.indexOf("\\(", cursor);
      if (start === -1) {
        parts.push({text: source.slice(cursor)});
        break;
      }
      if (start > cursor) parts.push({text: source.slice(cursor, start)});
      const end = source.indexOf("\\)", start + 2);
      if (end === -1) return null;
      const tex = source.slice(start + 2, end).trim();
      if (!tex || tex.includes("\\(") || unsafe.test(tex)) return null;
      parts.push({tex});
      cursor = end + 2;
    }
    return parts;
  }

  function renderText(host, source, {fallback = source} = {}) {
    if (!host || typeof host.replaceChildren !== "function") throw new TypeError("A math text host is required.");
    const plain = typeof fallback === "string" ? fallback : "";
    const reset = () => {
      host.textContent = plain;
      host.removeAttribute("data-math-rendered");
      return false;
    };
    if (typeof source !== "string" || source.length > limit) return reset();
    const parts = partsOf(source);
    const document = host.ownerDocument;
    if (!parts || !document || typeof window.katex?.render !== "function") return reset();
    const fragment = document.createDocumentFragment();
    let formulas = 0;
    try {
      for (const part of parts) {
        if (part.text !== undefined) fragment.append(document.createTextNode(part.text));
        else {
          const math = document.createElement("span");
          math.className = "math-inline";
          window.katex.render(part.tex, math, {
            displayMode: false,
            output: "htmlAndMathml",
            throwOnError: true,
            strict: "error",
            trust: false,
            maxSize: 8,
            maxExpand: 200,
            macros: Object.create(null)
          });
          fragment.append(math);
          formulas += 1;
        }
      }
      host.replaceChildren(fragment);
      if (formulas) host.setAttribute("data-math-rendered", "true");
      else host.removeAttribute("data-math-rendered");
      return Boolean(formulas);
    } catch (_) { return reset(); }
  }

  api.math = Object.freeze({renderText});
})();
