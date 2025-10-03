async function loadIndex() {
  const res = await fetch("/index.json", { cache: "no-store" });
  return await res.json();
}

function normalized(str) { return (str || "").toLowerCase(); }

function match(entry, q) {
  const n = normalized(q);
  return (
    normalized(entry.title).includes(n) ||
    normalized(entry.summary).includes(n) ||
    (entry.tags || []).some(t => normalized(t).includes(n)) ||
    (entry.series || []).some(s => normalized(s).includes(n))
  );
}

function render(results) {
  const list = document.getElementById("results");
  const meta = document.getElementById("searchMeta");
  list.innerHTML = "";
  meta.textContent = results.length ? `${results.length} result(s)` : "No results.";
  results.forEach(r => {
    const li = document.createElement("li");
    li.className = "search-item";
    li.innerHTML = `
      <a href="${r.url}">${r.title}</a>
      <div class="search-item-meta">
        <span>${r.date}</span>
        ${r.tags?.length ? ` · <span>${r.tags.map(t=>`#${t}`).join(" ")}</span>` : ""}
      </div>
      <p>${r.summary || ""}</p>
    `;
    list.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const input = document.getElementById("searchBox");
  if (!input) return;
  const data = await loadIndex();
  const meta = document.getElementById("searchMeta");
  meta.textContent = "Type to search…";
  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (!q) {
      document.getElementById("results").innerHTML = "";
      meta.textContent = "Type to search…";
      return;
    }
    render(data.filter(d => match(d, q)));
  });
});
