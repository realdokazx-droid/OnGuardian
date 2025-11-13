// Inicialização do background e possíveis animações
document.addEventListener("DOMContentLoaded", () => {
  // Aqui você pode iniciar animações do fundo, partículas, etc.
  const body = document.body;

  // Exemplo: adicionar classe de fundo animado
  body.classList.add("og-bg");
  body.classList.add("og-bg2");
  

  // Se houver partículas
  const particles = document.createElement("div");
  particles.classList.add("og-particles");
  body.appendChild(particles);
});
