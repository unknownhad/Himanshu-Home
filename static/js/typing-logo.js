document.addEventListener("DOMContentLoaded", () => {
  const el = document.querySelector(".logo a, .logo");
  if (!el) return;
  const full = el.textContent.trim();
  if (el.dataset.typed === "1") return;
  el.dataset.typed = "1";
  el.textContent = "";
  let i = 0;
  const tick = () => {
    if (i <= full.length) {
      el.textContent = full.slice(0, i);
      i++;
      setTimeout(tick, 45);
    }
  };
  tick();
});
