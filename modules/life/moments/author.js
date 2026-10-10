/* 发布由 GitHub 校验仓库权限；凭据仅保存在当前作者视图的闭包内。 */
(function () {
  "use strict";
  const OWNER = "PaulLi07";
  const REPO = "personal-homepage";
  const FILE = "modules/life/moments/posts.js";
  const REPOSITORY = "/repos/" + OWNER + "/" + REPO;
  const FILE_API = REPOSITORY + "/contents/" + FILE;
  const api = window.Homepage;
  const encode = text => {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  };
  const decode = value => new TextDecoder("utf-8", {fatal: true})
    .decode(Uint8Array.from(atob(value.replace(/\s/g, "")), character => character.charCodeAt(0)));
  function parsePosts(source) {
    const match = source.match(/^\s*(?:\/\*[\s\S]*?\*\/\s*)?window\.Homepage\.registerBlogPosts\(\s*([\s\S]*)\s*\);?\s*$/);
    if (!match) throw new Error("The remote blog data needs maintenance. No changes were published.");
    const posts = JSON.parse(match[1]);
    return api.normalizeBlogPosts(posts);
  }
  function sourceFor(posts) {
    return "/* 公开博客数据；仅存已经发布的英文文章。 */\nwindow.Homepage.registerBlogPosts(" + JSON.stringify(posts, null, 2) + ");\n";
  }
  api.createBlogAuthor = function ({onPublished, onCancel}) {
    return {
      render({host, signal}) {
        let token = "";
        let active = !signal.aborted;
        let busy = false;
        let verified = false;
        const controller = new AbortController();
        const section = document.createElement("section");
        section.className = "moments-author";
        section.setAttribute("aria-label", "Blog author workspace");
        const node = (tag, text, className) => {
          const element = document.createElement(tag);
          if (text) element.textContent = text;
          if (className) element.className = className;
          return element;
        };
        const listen = (element, action, callback) => element.addEventListener(action, callback, {signal: controller.signal});
        const button = (text, action) => {
          const element = node("button", text, "moments-blog__button");
          element.type = "button";
          listen(element, "click", action);
          return element;
        };
        const status = node("p", "", "moments-author__status");
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        function dispose() {
          active = false;
          verified = false;
          token = "";
          controller.abort();
          section.querySelectorAll("input, textarea").forEach(input => { input.value = ""; });
          section.replaceChildren();
          section.remove();
          signal.removeEventListener("abort", dispose);
        }
        signal.addEventListener("abort", dispose, {once: true});
        if (!active) return dispose;
        host.replaceChildren(section);

        async function request(path, {method = "GET", body} = {}) {
          let response;
          try {
            response = await fetch("https://api.github.com" + path, {
              method, credentials: "omit", cache: "no-store", redirect: "error", signal: controller.signal,
              headers: {Accept: "application/vnd.github+json", Authorization: "Bearer " + token,
                "X-GitHub-Api-Version": "2026-03-10", ...(body ? {"Content-Type": "application/json"} : {})},
              ...(body ? {body: JSON.stringify(body)} : {})
            });
          } catch (error) {
            if (error.name === "AbortError") throw error;
            throw new Error("Could not reach GitHub. Check the repository before retrying a publication.");
          }
          if (!response.ok) {
            const messages = {
              401: "GitHub did not accept this token. Sign out and use a valid token.",
              403: "GitHub denied access. Check token permissions or try again later.",
              404: "The blog file was not found on main. Upload this website version before publishing.",
              409: "The blog changed during publication. Nothing was overwritten. Please try again.",
              422: "GitHub could not accept this change. Check the branch and token permissions."
            };
            throw new Error(messages[response.status] || "GitHub could not complete this request. Check the repository before retrying.");
          }
          return response.json();
        }
        async function remotePosts() {
          const file = await request(FILE_API + "?ref=main");
          if (file.type !== "file" || file.encoding !== "base64" || typeof file.sha !== "string"
            || typeof file.content !== "string" || file.size > 900000) {
            throw new Error("The remote blog data needs maintenance. No changes were published.");
          }
          return {sha: file.sha, posts: parsePosts(decode(file.content))};
        }
        function header(title) {
          section.replaceChildren();
          const heading = node("h3", title);
          heading.tabIndex = -1;
          heading.setAttribute("data-view-heading", "");
          section.append(node("p", "Moments · Author workspace", "moments-blog__eyebrow"), heading,
            button("← All posts", onCancel));
          status.textContent = "";
          if (document.getElementById("detail-dialog")?.open) heading.focus({preventScroll: true});
        }
        function field(form, name, title, {type = "text", maxLength, value = "", multiline = false} = {}) {
          const label = node("label", title, "moments-author__field");
          const input = document.createElement(multiline ? "textarea" : "input");
          if (!multiline) input.type = type;
          input.name = name;
          input.required = true;
          if (maxLength) input.maxLength = maxLength;
          input.value = value;
          if (multiline) input.rows = name === "body" ? 12 : 3;
          label.append(input);
          form.append(label);
          return input;
        }
        function signIn() {
          token = "";
          verified = false;
          header("Author sign in");
          section.append(node("p", "Only PaulLi07 can use this publishing workspace. Use a fine-grained GitHub token for personal-homepage with Contents read and write permission. Your token stays in memory until you leave this view."));
          const help = node("a", "Create a repository token ↗");
          help.href = "https://github.com/settings/personal-access-tokens/new";
          help.target = "_blank";
          help.rel = "noopener noreferrer";
          section.append(help);
          const form = document.createElement("form");
          form.noValidate = true;
          const input = field(form, "token", "GitHub token", {type: "password", maxLength: 500});
          input.autocomplete = "off";
          input.spellcheck = false;
          const submit = node("button", "Verify author", "moments-blog__button");
          submit.type = "submit";
          form.append(submit);
          section.append(form, status);
          listen(form, "submit", async event => {
            event.preventDefault();
            if (busy) return;
            token = input.value.trim();
            input.value = "";
            if (!token) { status.textContent = "Enter your GitHub token to continue."; input.focus(); return; }
            busy = true;
            submit.disabled = true;
            status.textContent = "Verifying your GitHub account…";
            try {
              const user = await request("/user");
              if (user.login?.toLowerCase() !== OWNER.toLowerCase()) throw new Error("This account is not the blog author. Access is limited to PaulLi07.");
              const repository = await request(REPOSITORY);
              if (repository.owner?.login?.toLowerCase() !== OWNER.toLowerCase() || !repository.permissions?.push) {
                throw new Error("This token cannot publish to the author's repository.");
              }
              await remotePosts();
              if (!active) return;
              verified = true;
              editor();
            } catch (error) {
              token = "";
              if (active) status.textContent = error.message;
            } finally {
              busy = false;
              submit.disabled = false;
            }
          });
        }
        function editor() {
          header("Write a new post");
          const signOut = button("Sign out", signIn);
          section.append(node("p", "Signed in as PaulLi07. Publishing adds an English article to the public blog. Keep private stories in the password-protected Relationship section."), signOut);
          const form = document.createElement("form");
          form.noValidate = true;
          const today = new Date();
          const dateValue = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
          const title = field(form, "title", "Title", {maxLength: 160});
          const slug = field(form, "id", "Post address", {maxLength: 80});
          slug.pattern = "[a-z0-9]+(-[a-z0-9]+)*";
          slug.setAttribute("aria-describedby", "blog-slug-help");
          const help = node("p", "Use lowercase letters, numbers and hyphens. Each post needs a unique address.");
          help.id = "blog-slug-help";
          form.append(help);
          listen(title, "input", () => {
            if (!slug.dataset.edited) slug.value = title.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80).replace(/-$/, "");
          });
          listen(slug, "input", () => { slug.dataset.edited = "true"; });
          field(form, "date", "Publication date", {type: "date", value: dateValue});
          field(form, "excerpt", "Short introduction", {maxLength: 600, multiline: true});
          field(form, "body", "Article", {maxLength: 50000, multiline: true});
          form.append(node("p", "Write in plain text. Line breaks are preserved; HTML is displayed as text."));
          const submit = node("button", "Publish to GitHub", "moments-blog__button");
          submit.type = "submit";
          form.append(submit);
          section.append(form, status);
          listen(form, "submit", async event => {
            event.preventDefault();
            if (!verified || busy || !token) return;
            const post = Object.fromEntries(new FormData(form));
            for (const key of Object.keys(post)) post[key] = post[key].trim();
            post.author = "Yuhong Li";
            try { api.validateBlogPosts([post]); }
            catch (error) { status.textContent = error.message; return; }
            busy = true;
            submit.disabled = true;
            signOut.disabled = true;
            status.textContent = "Publishing to GitHub…";
            try {
              const remote = await remotePosts();
              if (remote.posts.some(item => item.id === post.id)) throw new Error("This post address is already in use. Choose a different address.");
              const posts = [...remote.posts, post];
              api.validateBlogPosts(posts);
              const source = sourceFor(posts);
              if (new TextEncoder().encode(source).length > 900000) throw new Error("The blog file is too large. Contact the maintainer before adding more posts.");
              const result = await request(FILE_API, {method: "PUT", body: {
                message: "feat: publish Moments post " + post.id,
                branch: "main", sha: remote.sha, content: encode(source)
              }});
              if (!result.commit?.sha) throw new Error("GitHub returned an unexpected response. Check the repository before retrying.");
              if (active) {
                token = "";
                verified = false;
                onPublished(post, posts);
              }
            } catch (error) { if (active) status.textContent = error.message; }
            finally { busy = false; submit.disabled = false; signOut.disabled = false; }
          });
        }
        signIn();
        return dispose;
      }
    };
  };
})();
