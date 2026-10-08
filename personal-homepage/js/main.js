(function () {
  "use strict";
  window.HomepageTransitions.start();
  document.getElementById("current-year").textContent = new Date().getFullYear();
  const navbar = document.querySelector(".navbar");
  let lastScroll = window.scrollY;
  let scheduled = false;
  let anchorUntil = 0;
  const links = Array.from(document.querySelectorAll('.navlinks a[href^="#"]'));
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const life = document.getElementById("life");
  const photographs = Array.from(life.querySelectorAll(".movable"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function onScroll() {
    const current = window.scrollY;
    navbar.classList.toggle("is-scrolled", current > 50);
    if (current < 140 || Date.now() < anchorUntil) navbar.classList.remove("is-hidden");
    else if (Math.abs(current - lastScroll) > 5) {
      navbar.classList.toggle("is-hidden", current > lastScroll);
    }
    lastScroll = current;
    let active = "home";
    for (const section of sections) {
      if (section.getBoundingClientRect().top < window.innerHeight * .38) active = section.id;
    }
    links.forEach(link => {
      if (link.getAttribute("href") === "#" + active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    if (!reducedMotion.matches) {
      const bounds = life.getBoundingClientRect();
      if (bounds.bottom > 0 && bounds.top < window.innerHeight) {
        const distance = bounds.top + bounds.height / 2 - window.innerHeight / 2;
        photographs.forEach((photo, index) => {
          const drift = Math.max(-28, Math.min(28, -distance * (.045 + index * .014)));
          photo.style.setProperty("--drift", drift.toFixed(1) + "px");
        });
      }
    }
    scheduled = false;
  }

  window.addEventListener("scroll", () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", () => {
      anchorUntil = Date.now() + 1400;
      navbar.classList.remove("is-hidden");
    });
  });
  onScroll();

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    document.querySelectorAll("[data-reveal]").forEach(element => revealObserver.observe(element));
  } else {
    document.querySelectorAll("[data-reveal]").forEach(element => element.classList.add("is-visible"));
  }
})();
