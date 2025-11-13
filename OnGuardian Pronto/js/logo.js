document.addEventListener("DOMContentLoaded", () => {
  const logo = document.getElementById("logo");
  const conteudo1 = document.getElementById("conteudo1");
  const conteudo2 = document.getElementById("conteudo2");
  const conteudo3 = document.getElementById("conteudo3");

  if (!logo || !conteudo1 || !conteudo2 || !conteudo3) return;

  // Define o display correto de cada um
  conteudo1.style.display = "flex";  // tela inicial centralizada
  conteudo1.style.opacity = 1;

  conteudo2.style.display = "none";  // loader escondido
  conteudo2.style.opacity = 0;

  conteudo3.style.display = "none";  // conteúdo final escondido
  conteudo3.style.opacity = 0;

  logo.addEventListener("click", () => {
    // Sai o conteúdo 1
    conteudo1.style.transition = "opacity 0.6s ease";
    conteudo1.style.opacity = 0;

    setTimeout(() => {
      conteudo1.style.display = "none";

      // Mostra o loader
      conteudo2.style.display = "flex";
      conteudo2.style.opacity = 0;
      conteudo2.style.transition = "opacity 0.8s ease";
      setTimeout(() => (conteudo2.style.opacity = 1), 50);

      // Depois de 5 segundos, troca para o conteúdo 3
      setTimeout(() => {
        conteudo2.style.transition = "opacity 0.8s ease";
        conteudo2.style.opacity = 0;

        setTimeout(() => {
          conteudo2.style.display = "none";
          conteudo3.style.display = "flex";
          conteudo3.style.opacity = 0;
          conteudo3.style.transition = "opacity 0.8s ease";
          setTimeout(() => (conteudo3.style.opacity = 1), 50);
        }, 800);
      }, 5000);
    }, 600);
  });
});
