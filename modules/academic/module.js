/* Academic 入口只接线；场景行为及精选论文各自独立。 */
window.Homepage.registerSection({
  id: "academic",
  detailGroup: { id: "academic", label: "Academic sections", descriptionTitle: "Overview", aliases: { research: "experience" } },
  init({ root, details, reducedMotion }) {
    const scene = root.querySelector("[data-academic-scene]");
    const api = window.Homepage.academicExploration;
    const cleanup = scene ? api.mountScene({ root: scene, details, reducedMotion }) : () => {};
    api.mountFeaturedPublication({ root, details });
    // 往返缓存保留运行实例；真正离开页面才清理事件、定时器与观察器。
    window.addEventListener("pagehide", event => { if (!event.persisted) cleanup(); });
  }
});
