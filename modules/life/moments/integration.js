/* Moments 自己连接读者页面与作者工作台；共享弹窗只提供容器和生命周期。 */
(function () {
  "use strict";
  const api = window.Homepage;
  api.registerDetailView("life", "moments", {
    render({host, route, signal, navigate}) {
      if (route === "author") {
        return api.createAuthorEditor({
          collection: {
            id: "moments", label: "Moments", eyebrow: "Life · Author workspace",
            editorTitle: "Write a new post", noun: "post", registration: "registerBlogPosts",
            path: "modules/life/moments/posts.js", getRecords: api.getBlogPosts,
            normalize: api.normalizeBlogPosts, fields: []
          },
          onPublished(post, posts) {
            api.registerBlogPosts(posts);
            api.registerData("moments.lastPublished", post.id);
            navigate(post.id);
          },
          onCancel() { navigate(null); }
        }).render({host, signal});
      }
      const dispose = api.createBlogView({
        posts: api.getBlogPosts,
        onNavigate: navigate,
        onAuthorRequested() { navigate("author"); }
      }).render({host, route, signal});
      if (route && route === api.getData("moments.lastPublished")) {
        const notice = document.createElement("p");
        notice.className = "author-status";
        notice.setAttribute("role", "status");
        notice.textContent = "Published to GitHub. The live website may take a moment to update.";
        host.prepend(notice);
      }
      return dispose;
    }
  });
})();
