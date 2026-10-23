/* About入口只挂接本模块相册；照片、交互与生命周期由gallery独立维护。 */
window.Homepage.registerSection({
  id: "about",
  init({ root, reducedMotion }) {
    const gallery = root.querySelector("[data-about-gallery]");
    if (gallery) window.Homepage.aboutGallery?.mount({ root: gallery, reducedMotion });
  }
});
