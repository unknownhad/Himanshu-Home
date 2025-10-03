document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("pre > code").forEach(code => {
    const wrapper = code.parentElement;
    const btn = document.createElement("button");
    btn.textContent = "Copy";
    btn.style.position = "absolute";
    btn.style.right = "10px";
    btn.style.top = "8px";
    btn.style.padding = "2px 6px";
    btn.style.fontSize = "0.8rem";
    btn.style.background = "#2e2e2e";
    btn.style.border = "1px solid #444";
    btn.style.borderRadius = "4px";
    btn.style.color = "#fff";
    btn.style.cursor = "pointer";
    btn.onclick = async () => {
      await navigator.clipboard.writeText(code.innerText);
      btn.textContent = "Copied!";
      setTimeout(() => btn.textContent = "Copy", 1200);
    };
    wrapper.style.position = "relative";
    wrapper.appendChild(btn);
  });
});
