window.Homepage.registerSection({
  id: "contact",
  init({ root }) {
    root.querySelector("#current-year").textContent = new Date().getFullYear();
  }
});
