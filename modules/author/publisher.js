/* 文字与照片发布独立于编辑器；带照片的文章只在完整提交成功后更新 main。 */
(function () {
  "use strict";
  const api = window.Homepage;
  const repo = "/repos/PaulLi07/personal-homepage";
  const contracts = Object.freeze({
    moments: {path: "modules/life/moments/posts.js", registration: "registerBlogPosts"},
    experience: {path: "modules/academic/experience/entries.js", registration: "registerAcademicLogs"}
  });
  const encoder = new TextEncoder();
  const MAX_BYTES = 900000;
  const SHA = /^[0-9a-f]{40}$/;
  function encode(bytes) {
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    return btoa(binary);
  }
  const unexpected = () => new Error("GitHub returned an unexpected response. Check the repository before retrying.");
  function objectSha(value) {
    if (!value || typeof value.sha !== "string" || !SHA.test(value.sha)) throw unexpected();
    return value.sha;
  }
  api.createAuthorPublisher = function (collection) {
    const contract = contracts[collection?.id];
    if (!contract || collection.path !== contract.path || collection.registration !== contract.registration
      || typeof collection.normalize !== "function" || typeof collection.getRecords !== "function") {
      throw new TypeError("An allowed author collection is required.");
    }
    const fileApi = repo + "/contents/" + contract.path;
    const session = api.authorSession;
    function parseRecords(file) {
      if (file?.type !== "file" || file.encoding !== "base64" || typeof file.sha !== "string" || !file.sha
        || typeof file.content !== "string" || typeof file.size !== "number" || file.size < 0 || file.size > MAX_BYTES
        || file.content.length > 1300000) throw new Error("The remote data needs maintenance. No changes were published.");
      try {
        const source = new TextDecoder("utf-8", {fatal: true}).decode(
          Uint8Array.from(atob(file.content.replace(/\s/g, "")), character => character.charCodeAt(0)));
        if (encoder.encode(source).length > MAX_BYTES) throw new Error("Oversized data.");
        const pattern = new RegExp("^\\s*(?:/\\*[\\s\\S]*?\\*/\\s*)?window\\.Homepage\\."
          + contract.registration + "\\(\\s*([\\s\\S]*)\\s*\\);?\\s*$");
        const match = source.match(pattern);
        if (!match) throw new Error("Invalid data.");
        return collection.normalize(JSON.parse(match[1]));
      } catch (_) { throw new Error("The remote data needs maintenance. No changes were published."); }
    }
    function sourceFor(records) {
      const source = "/* 公开英文内容；仅包含作者已经确认发布的记录。 */\nwindow.Homepage."
        + contract.registration + "(" + JSON.stringify(collection.normalize(records), null, 2) + ");\n";
      if (encoder.encode(source).length > MAX_BYTES) throw new Error("This collection is too large. Contact the maintainer before adding more entries.");
      return source;
    }
    function merge(records, entry) {
      if (records.some(item => item.id === entry.id)) throw new Error("This address is already in use. Choose a different address.");
      return collection.normalize([...records, entry]);
    }
    function photoFiles(entry, files) {
      const photos = api.articlePhotos.normalize(entry.photos, collection.id, entry.id);
      if (!Array.isArray(files) || files.length !== photos.length || files.length > 6) throw new Error("The selected photos are not ready to publish.");
      let total = 0;
      for (let index = 0; index < files.length; index += 1) {
        const item = files[index];
        if (item?.path !== photos[index].src || !(item.bytes instanceof Uint8Array) || item.bytes.length < 4
          || item.bytes.length > 2 * 1024 * 1024 || item.bytes[0] !== 255 || item.bytes[1] !== 216
          || item.bytes[item.bytes.length - 2] !== 255 || item.bytes[item.bytes.length - 1] !== 217) {
          throw new Error("The selected photos are not ready to publish.");
        }
        total += item.bytes.length;
      }
      if (total > 8 * 1024 * 1024) throw new Error("The prepared photos exceed the 8 MB total limit.");
      return files;
    }
    async function publish(entry, {files = [], signal, onProgress = () => {}} = {}) {
      entry = collection.normalize([entry])[0];
      const uploads = photoFiles(entry, files);
      const message = "feat: publish " + collection.label + " " + collection.noun + " " + entry.id;
      if (!uploads.length) {
        const file = await session.request(fileApi + "?ref=main", {signal});
        const records = merge(parseRecords(file), entry);
        const result = await session.request(fileApi, {method: "PUT", signal,
          body: {message, branch: "main", sha: file.sha, content: encode(encoder.encode(sourceFor(records)))}});
        if (!result?.commit?.sha) throw unexpected();
        return records;
      }
      onProgress("Preparing the article and photos for publication…");
      const ref = await session.request(repo + "/git/ref/heads/main", {signal});
      if (ref?.ref !== "refs/heads/main" || ref.object?.type !== "commit") throw unexpected();
      const head = objectSha(ref.object);
      const parent = await session.request(repo + "/git/commits/" + head, {signal});
      if (objectSha(parent) !== head) throw unexpected();
      const baseTree = objectSha(parent.tree);
      const remote = await session.request(fileApi + "?ref=" + head, {signal});
      const records = merge(parseRecords(remote), entry);
      const source = sourceFor(records);
      const tree = [];
      for (let index = 0; index < uploads.length; index += 1) {
        onProgress("Uploading photo " + (index + 1) + " of " + uploads.length + "…");
        const blob = await session.request(repo + "/git/blobs", {method: "POST", signal,
          body: {encoding: "base64", content: encode(uploads[index].bytes)}});
        tree.push({path: uploads[index].path, mode: "100644", type: "blob", sha: objectSha(blob)});
      }
      const data = await session.request(repo + "/git/blobs", {method: "POST", signal,
        body: {encoding: "base64", content: encode(encoder.encode(source))}});
      tree.push({path: contract.path, mode: "100644", type: "blob", sha: objectSha(data)});
      const createdTree = await session.request(repo + "/git/trees", {method: "POST", signal,
        body: {base_tree: baseTree, tree}});
      const commit = await session.request(repo + "/git/commits", {method: "POST", signal,
        body: {message, tree: objectSha(createdTree), parents: [head]}});
      const commitSha = objectSha(commit);
      onProgress("Publishing the article and photos together…");
      const result = await session.request(repo + "/git/refs/heads/main", {method: "PATCH", signal,
        body: {sha: commitSha, force: false}});
      if (result?.ref !== "refs/heads/main" || result.object?.type !== "commit" || objectSha(result.object) !== commitSha) throw unexpected();
      return records;
    }
    return Object.freeze({sourceFor, merge, publish});
  };
})();
