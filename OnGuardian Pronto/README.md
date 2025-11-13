OnGuardian/
│
├── 📁 assets/                            # Tudo que o site carrega (imagens, fontes, ícones)
│   ├── 📁 img/                           # Logos, backgrounds, ilustrações
│   │   ├── logo.svg
│   │   └── background.jpg
│   ├── 📁 icons/                         # Ícones SVG ou PNG
│   └── 📁 fonts/                         # Fontes personalizadas (ex: Poppins, Inter)
│
├── 📁 css/                               # Camada de estilo (bem organizada e modular)
│   ├── reset.css                         # Reset e normalização (remove estilos padrão do navegador)
│   ├── variables.css                     # Paleta de cores e variáveis globais
│   ├── animations.css                    # Animações de entrada, fade, transições, etc.
│   ├── loader.css                        # Loader estilo Universe.io
│   ├── intro.css                         # Tela inicial (logo + clique + fade)
│   ├── main.css                          # Estilo do conteúdo principal
│   └── responsive.css                    # Ajustes para celular/tablet
│
├── 📁 js/                                # Toda a lógica e interações do site
│   ├── intro.js                          # Controle da tela inicial (logo, clique e transição)
│   ├── loader.js                         # Efeito e controle do loader (Universe.io-style)
│   ├── main.js                           # Interações do conteúdo principal (detector fake news)
│   ├── fade.js                           # Funções genéricas de fade-in/out e delays
│   └── utils.js                          # Funções auxiliares (timers, seletores, etc.)
│
├── 📁 components/                        # Partes HTML separadas (modular)
│   ├── header.html                       # Cabeçalho com logo e menu
│   ├── loader.html                       # Estrutura do loader animado
│   ├── intro.html                        # Tela inicial com a logo clicável
│   ├── detector.html                     # Seção principal do site (detector de fake news)
│   └── footer.html                       # Rodapé
│
├── index.html                            # Página inicial (monta tudo dinamicamente)
│
└── README.md                             # Explicação do projeto, instruções e créditos
