const verifyBtn = document.getElementById("verifyBtn");
const resultBox = document.getElementById("resultBox");
const resultText = document.getElementById("resultText");

// ==============================
// 🔵 BASE DE DADOS
// ==============================
const trustedSources = [
  "bbc.com", "cnn.com", "reuters.com", "g1.globo.com", "nytimes.com",
  "folha.uol.com.br", "uol.com.br", "estadao.com.br", "theguardian.com",
  "apnews.com", "elpais.com", "dw.com", "cnnbrasil.com.br",
  "washingtonpost.com", "r7.com", "oglobo.globo.com", "time.com",
  "wired.com", "npr.org", "forbes.com"
];

const mediumReliableSources = [
  "metropoles.com", "terra.com.br", "yahoo.com", "ig.com.br",
  "msn.com", "record.com.br"
];

const blacklistedSources = [
  "huzlers.com", "worldnewsdailyreport.com", "theonion.com",
  "clickhole.com", "sensacionalista.com.br", "diariodobrasil.org",
  "noticiasonline.club", "24horasnews.net", "saudeemfoco.club",
  "metropolesfake.com", "folhadiario.club"
];

const suspiciousWords = {
  "chocante": 2, "urgente": 3, "você não vai acreditar": 4,
  "exclusivo": 1, "revelado": 1, "bomba": 3, "escândalo": 3,
  "milagre": 4, "absurdo": 2, "polêmica": 1, "explosivo": 2,
  "inacreditável": 3, "proibido": 1, "cientistas confirmam": 3,
  "cura": 4, "alerta": 3, "vazou": 2, "fim do mundo": 5,
  "segredo": 2, "verdade oculta": 4
};

const journalismPatterns = [
  "segundo","de acordo com","investigação aponta",
  "relatório diz","estudo mostra","pesquisadores afirmam",
  "dados oficiais","apurou que","confirmou que"
];

// ==============================
// 🔵 SENSORES
// ==============================
function emotionSensor(text) {
  const alarm = ["urgente","bomba","choque","escândalo","pânico"];
  let score = 0;
  alarm.forEach(w => { if (text.includes(w)) score -= 12; });

  return {
    emotion: score < -10 ? "extremamente alarmista" :
             score < -5 ? "alarmista" : "neutro",
    score
  };
}

function journalismCheck(text) {
  let points = 0;
  journalismPatterns.forEach(p => {
    if (text.includes(p)) points += 5;
  });
  return points;
}

function evidenceRadar(text) {
  const evid = [
    "foto","imagem","vídeo","documento","pesquisa",
    "dados","estudo","relatório","fonte oficial"
  ];
  let found = evid.filter(w => text.includes(w));
  return found.length ? found.length * 4 : -10;
}

function fakeDomainDetector(domain) {
  const patterns = ["-news","viral","alerta","urgente","hoje","24h"];
  return patterns.some(p => domain.includes(p)) ? -15 : 0;
}

function crossCheckSimulation(domain) {
  if (trustedSources.some(s => domain.includes(s))) return +20;
  if (blacklistedSources.some(s => domain.includes(s))) return -30;
  return 0;
}

// ==============================
// 🔵 EVENTO PRINCIPAL
// ==============================
verifyBtn.addEventListener("click", async () => {
  const link = document.getElementById("newsLink").value.trim();
  if (!link) return showSimple("⚠️ Por favor, insira um link.", "orange");

  const domain = extractDomain(link);
  const lowered = link.toLowerCase();
  let score = 50;

  // Limpa e mostra caixa
  resultBox.style.display = "block";
  resultText.innerHTML = `<p class="scan-text">🔎 Iniciando análise...</p>`;

  const pause = ms => new Promise(r => setTimeout(r, ms));

  const animar = async texto => {
    resultText.innerHTML = `<p class="scan-text">${texto}</p>`;
    await pause(900);
  };

  // ==============================
  // 🔵 ANIMAÇÃO — UMA FRASE POR VEZ
  // ==============================
  await animar("🌐 Analisando a fonte...");
  if (trustedSources.some(s => domain.includes(s))) score += 35;
  else if (mediumReliableSources.some(s => domain.includes(s))) score += 10;
  else if (blacklistedSources.some(s => domain.includes(s))) score -= 50;

  score += fakeDomainDetector(domain);

  await animar("📄 Avaliando padrões jornalísticos...");
  score += journalismCheck(lowered);

  await animar("📡 Buscando evidências no conteúdo...");
  score += evidenceRadar(lowered);

  await animar("💬 Verificando tom emocional...");
  score += emotionSensor(lowered).score;

  await animar("🚨 Verificando palavras sensacionalistas...");
  Object.entries(suspiciousWords).forEach(([w, p]) => {
    if (lowered.includes(w)) score -= p * 4;
  });

  await animar("🔍 Cruzando informações...");
  score += crossCheckSimulation(domain);

  // Limita 0–100
  score = Math.max(0, Math.min(100, Math.round(score)));

  const final = getVerdict(score);

  // ==============================
  // 🔵 RESULTADO FINAL
  // ==============================
  resultText.innerHTML = `
    <hr class="divider">
    <p class="final-result">${final[2]} ${final[0]}</p>
    <p class="final-domain">🌐 Domínio: <b>${domain}</b></p>
    <p class="final-score">📊 Confiabilidade: 
      <b style="color:${final[1]}">${score}%</b>
    </p>
  `;
});

// ==============================
// 🔵 AUXILIARES
// ==============================
function extractDomain(url) {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.split("/")[0].replace(/^www\./, "");
  }
}

function getVerdict(score) {
  if (score >= 85) return ["Fonte extremamente confiável!", "lightgreen", "🟢"];
  if (score >= 70) return ["Provável notícia verdadeira.", "gold", "🟡"];
  if (score >= 45) return ["Conteúdo duvidoso.", "orange", "🟠"];
  return ["Alta chance de FAKE NEWS!", "red", "🔴"];
}

function showSimple(msg, color) {
  resultBox.style.display = "block";
  resultText.innerHTML = `<p style="color:${color}">${msg}</p>`;
}
