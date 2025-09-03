// Menu hambúrguer no mobile
(function () {
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("mobileMenu");
  if (!btn || !menu) return;

  const toggle = () => {
    const show = menu.style.display === "block";
    menu.style.display = show ? "none" : "block";
  };

  btn.addEventListener("click", toggle);
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    menu.style.display = "none";
  }));

  // Fecha ao clicar fora
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && e.target !== btn) menu.style.display = "none";
  });
})();
