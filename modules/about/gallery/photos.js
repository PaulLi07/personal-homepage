/* 简介相册的独立照片清单；替换文件后同步更新尺寸、英文替代文本和内容散列。 */
(function () {
  "use strict";

  var homepage = window.Homepage = window.Homepage || {};
  var gallery = homepage.aboutGallery = homepage.aboutGallery || {};

  gallery.config = Object.freeze({
    intervalMs: 6000,
    photos: Object.freeze([
      Object.freeze({
        id: "portrait",
        src: "modules/about/gallery/images/portrait-landscape.jpg?v=d691bc4f4de1",
        alt: "A person standing beside a lake, with trees and a tower in the background",
        width: 1920,
        height: 1280,
        position: "50% 50%",
        credit: "Photo provided by site owner",
        placeholder: false
      }),
      Object.freeze({
        id: "misty-lake",
        src: "modules/about/gallery/images/misty-lake.jpg?v=8d99643f647d",
        alt: "Mist drifting above a mountain lake surrounded by evergreen trees and rocky peaks",
        width: 1000,
        height: 667,
        position: "50% 50%",
        credit: "Placeholder · Kalen Emsley / Unsplash",
        placeholder: true
      }),
      Object.freeze({
        id: "coastal-cliffs",
        src: "modules/about/gallery/images/coastal-cliffs.jpg?v=6911ece43399",
        alt: "Ocean waves flowing between rugged coastal cliffs",
        width: 1000,
        height: 1500,
        position: "50% 50%",
        credit: "Placeholder · Benjamin Chambon / Unsplash",
        placeholder: true
      })
    ])
  });
})();
