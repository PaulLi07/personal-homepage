/* SVG骨架只渲染姿态；随机调度、地面位移和生命周期由外部导演负责。 */
(function () {
  "use strict";
  const character = window.Homepage.academicExploration.character;
  const namespace = "http://www.w3.org/2000/svg";
  function node(name, attributes = {}) {
    const element = document.createElementNS(namespace, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  character.createFigure = function () {
    const svg = node("svg", {
      class: "academic-walker-art academic-character", viewBox: "-20 -46 40 46",
      width: "40", height: "46", "aria-hidden": "true", focusable: "false",
      fill: "none", stroke: "currentColor", "stroke-width": "1.65",
      "stroke-linecap": "round", "stroke-linejoin": "round"
    });
    const backArm = node("path", { opacity: ".5", "data-character-part": "back-arm" });
    const backLeg = node("path", { opacity: ".5", "data-character-part": "back-leg" });
    const torso = node("path", { "data-character-part": "torso" });
    const head = node("circle", { r: "3.3", "data-character-part": "head" });
    const eye = node("circle", { r: ".38", fill: "currentColor", stroke: "none" });
    const nose = node("path", { "stroke-width": "1.05" });
    const frontArm = node("path", { "data-character-part": "front-arm" });
    const frontLeg = node("path", { "data-character-part": "front-leg" });
    [backArm, backLeg, torso, head, eye, nose, frontArm, frontLeg].forEach(child => svg.appendChild(child));
    let destroyed = false;

    function render(frame = {}) {
      if (destroyed) return;
      const pose = frame.pose || character.neutralPose;
      const facing = Number.isFinite(frame.facing) ? Math.min(1, Math.max(-1, frame.facing)) : 1;
      function point(key) {
        const value = pose[key];
        const fallback = character.neutralPose[key];
        return [Number.isFinite(value?.[0]) ? Math.min(16, Math.max(-16, value[0])) * facing : fallback[0] * facing,
          Number.isFinite(value?.[1]) ? Math.min(0, Math.max(-44, value[1])) : fallback[1]];
      }
      const path = keys => keys.map((key, index) => (index ? "L" : "M") + point(key).join(" ")).join(" ");
      function leg(element, knee, foot) {
        // 短鞋尖跟随腿部翻面，所有轮廓保持相同笔画粗细。
        element.setAttribute("d", path(["hip", knee, foot]) + " l" + (2.2 * facing) + " 0");
      }
      backArm.setAttribute("d", path(["shoulder", "elbowBack", "handBack"]));
      leg(backLeg, "kneeBack", "footBack");
      const headPoint = point("head"), shoulder = point("shoulder");
      const neck = [headPoint[0] * .3 + shoulder[0] * .7, headPoint[1] + 3.3];
      torso.setAttribute("d", "M" + neck.join(" ") + " L" + shoulder.join(" ") + " L" + point("hip").join(" "));
      head.setAttribute("cx", headPoint[0]);
      head.setAttribute("cy", headPoint[1]);
      eye.setAttribute("cx", headPoint[0] + 1.45 * facing);
      eye.setAttribute("cy", headPoint[1] - .5);
      nose.setAttribute("d", "M" + (headPoint[0] + 2.8 * facing) + " " + (headPoint[1] + .05)
        + " l" + (1.15 * facing) + " .65 l" + (-1.15 * facing) + " .2");
      frontArm.setAttribute("d", path(["shoulder", "elbowFront", "handFront"]));
      leg(frontLeg, "kneeFront", "footFront");
    }
    render();
    return {
      element: svg, render,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        svg.remove();
      }
    };
  };
})();
