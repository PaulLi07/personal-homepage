/* 博客数据契约归属于 Moments；共享注册器不解释文章内容。 */
(function () {
  "use strict";
  const api = window.Homepage;
  const key = "moments.posts";
  const nonempty = value => typeof value === "string" && value.trim().length > 0;
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
    }
    return posts;
  };
  api.normalizeBlogPosts = posts => {
    api.validateBlogPosts(posts);
    // 严格保存允许的字段，避免未知远端字段参与呈现或下一次发布。
    return posts.map(({id, title, date, excerpt, body, author}) => ({id, title, date, excerpt, body, author}));
  };
  api.registerBlogPosts = posts => api.registerData(key, api.normalizeBlogPosts(posts));
  api.getBlogPosts = () => api.getData(key) || [];
})();
