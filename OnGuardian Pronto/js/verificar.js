const verifyBtn = document.getElementById("verifyBtn");
const resultBox = document.getElementById("resultBox");
const resultText = document.getElementById("resultText");

// ======== BASES DE FONTES =========
const trustedSources = [
  "bbc.com", "cnn.com", "reuters.com", "g1.globo.com", "nytimes.com",
  "folha.uol.com.br", "uol.com.br", "estadao.com.br", "theguardian.com",
  "apnews.com", "npr.org", "elpais.com", "dw.com", "cnnbrasil.com.br",
  "washingtonpost.com", "r7.com", "oglobo.globo.com", "bbcbrasil.com",
  "forbes.com", "time.com", "wired.com", "nationalgeographic.com"
];

const blacklistedSources = [
  "huzlers.com", "worldnewsdailyreport.com", "theonion.com", "clickhole.com",
  "24horasnews.net", "saudeemfoco.club", "diariodobrasil.org",
  "noticiasonline.club", "newsner.com", "sensacionalista.com.br",
  "revistaplaneta.club", "metropolesfake.com", "folhadiario.club"
];

const suspiciousWords = {
  "chocante": 2, "urgente": 2, "você não vai acreditar": 3, "exclusivo": 1,
  "revelado": 1, "bomba": 2, "escândalo": 2, "milagre": 3, "absurdo": 2,
  "polêmica": 1, "explosivo": 2, "inacreditável": 3, "proibido": 1,
  "cientistas confirmam": 2, "cura": 3, "alerta": 2, "vazou": 2,
  "fim do mundo": 3, "segredo": 2, "descubra": 2, "verdade oculta": 3
};

// ======== FUNÇÕES DE ANÁLISE =========
function emotionSensor(text) {
  const alarm = ["urgente", "alerta", "bomba", "choque", "escândalo"];
  let score = 0, emotion = "neutro";
  for (const w of alarm) if (text.includes(w)) score -= 10;
  if (score < -5) emotion = "alarmista";
  return { score, emotion };
}

function evidenceRadar(text) {
  const evid = ["foto", "imagem", "vídeo", "documento", "pesquisa", "dados", "estudo", "relatório", "fonte"];
  let found = evid.filter(w => text.includes(w));
  let score = found.length > 0 ? found.length * 3 : -8;
  return { found, score };
}

// ======== EVENTO PRINCIPAL =========
verifyBtn.addEventListener("click", async () => {
  const link = document.getElementById("newsLink").value.trim();
  if (!link) return showResult("⚠️ Por favor, insira um link.", "orange");

  const domain = extractDomain(link);
  if (!domain) return showResult("❌ Link inválido.", "red");

  resultBox.style.display = "block";
  resultText.innerHTML = `
  <div class="scan-line"></div>
  <p class="scan-text">🔍 Iniciando análise da notícia...</p>`;

  const pause = (ms) => new Promise(r => setTimeout(r, ms));
  let score = 50;
  const lowered = link.toLowerCase();

  // ========= ETAPA 1: FONTE =========
  await pause(1000);
  addStep("🕵️ Analisando a fonte...");
  await pause(800);
  if (trustedSources.some(s => domain.includes(s))) {
    score += 35;
    addStep("✅ Fonte confiável detectada: <b>" + domain + "</b>");
  } else if (blacklistedSources.some(s => domain.includes(s))) {
    score -= 45;
    addStep("🚫 Fonte suspeita detectada: <b>" + domain + "</b>");
  } else {
    addStep("❓ Fonte desconhecida: <b>" + domain + "</b>");
  }

  // ========= ETAPA 2: EVIDÊNCIAS =========
  await pause(800);
  addStep("📡 Buscando evidências no conteúdo...");
  const evidence = evidenceRadar(lowered);
  await pause(800);
  if (evidence.found.length) addStep("🧾 Evidências encontradas: " + evidence.found.join(", "));
  else addStep("⚠️ Nenhuma evidência clara encontrada.");
  score += evidence.score;

  // ========= ETAPA 3: EMOÇÃO =========
  await pause(800);
  addStep("💬 Avaliando o tom emocional...");
  const emotion = emotionSensor(lowered);
  await pause(800);
  addStep("🧠 Tom detectado: <b>" + emotion.emotion + "</b>");
  score += emotion.score;

  // ========= ETAPA 4: PALAVRAS =========
  await pause(800);
  addStep("🚨 Verificando termos sensacionalistas...");
  const detected = [];
  for (const [word, weight] of Object.entries(suspiciousWords)) {
    if (lowered.includes(word)) {
      detected.push(word);
      score -= weight * 4.5;
    }
  }
  await pause(600);
  if (detected.length) addStep("⚠️ Palavras suspeitas: " + detected.join(", "));
  else addStep("✅ Nenhum termo suspeito detectado.");

  // ========= AJUSTES =========
  if (!link.startsWith("https://")) score -= 10;
  if (domain.includes("-news") || domain.includes("viral")) score -= 8;
  score = Math.max(0, Math.min(100, Math.round(score)));

  // ========= RESULTADO FINAL =========
  await pause(1200);
  const [msg, color, emoji] = getVerdict(score);
  resultText.innerHTML += `
    <hr class="divider">
    <p class="final-result">${emoji} ${msg}</p>
    <p class="final-domain">🌐 Domínio: <b>${domain}</b></p>
    <p class="final-score">📊 Confiabilidade: <b style="color:${color}">${score}%</b></p>
  `;
});

// ======== FUNÇÕES AUXILIARES =========
function addStep(text) {
  const p = document.createElement("p");
  p.classList.add("scan-text");
  p.innerHTML = text;
  resultText.appendChild(p);
}

function extractDomain(url) {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.split("/")[0].replace(/^www\./, "");
  }
}

function getVerdict(score) {
  if (score >= 85) return ["Fonte extremamente confiável!", "lightgreen", "✅"];
  if (score >= 70) return ["Provável notícia verdadeira.", "gold", "🟡"];
  if (score >= 45) return ["Conteúdo duvidoso.", "orange", "⚠️"];
  return ["Alta chance de FAKE NEWS!", "red", "🚨"];
}

function showResult(msg, color) {
  resultBox.style.di
}