/* 博客数据契约归属于 Moments；共享注册器不解释文章内容。 */
(function () {
  "use strict";
  const api = window.Homepage;
  const key = "moments.posts";
  const nonempty = value => typeof value === "string" && value.trim().length > 0;
  function photosFor(post) {
    if (post.photos === undefined) return undefined;
    try {
      if (!Array.isArray(post.photos)) throw new Error("Invalid photos.");
      return api.articlePhotos.normalize(post.photos, "moments", post.id);
    } catch (_) { throw new Error("Invalid post photos."); }
  }
  api.validateBlogPosts = function (posts) {
    if (!Array.isArray(posts) || posts.length > 500) throw new Error("Invalid blog data.");
    const ids = new Set();
    for (const post of posts) {
      if (!post || typeof post !== "object" || typeof post.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.id)
        || post.id === "author" || ids.has(post.id)) throw new Error("Invalid or duplicate post address.");
      ids.add(post.id);
      if (typeof post.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(post.date)
        || !Number.isFinite(Date.parse(post.date))
        || new Date(post.date).toISOString().slice(0, 10) !== post.date) throw new Error("Invalid publication date.");
      for (const field of ["title", "excerpt", "body"]) {
        if (!nonempty(post[field])) throw new Error("A post needs a title, excerpt and body.");
      }
      if (post.title.length > 160 || post.excerpt.length > 600 || post.body.length > 50000
        || post.id.length > 80 || post.author !== "Yuhong Li") throw new Error("Invalid post content or author.");
      photosFor(post);
    }
    return posts;
  };
  api.normalizeBlogPosts = posts => {
    api.validateBlogPosts(posts);
    // 严格保存允许的字段，避免未知远端字段参与呈现或下一次发布。
    return posts.map(post => ({id: post.id, title: post.title, date: post.date, excerpt: post.excerpt,
      body: post.body, author: post.author, ...(post.photos === undefined ? {} : {photos: photosFor(post)})}));
  };
  api.registerBlogPosts = posts => api.registerData(key, api.normalizeBlogPosts(posts));
  api.getBlogPosts = () => api.getData(key) || [];
})();
