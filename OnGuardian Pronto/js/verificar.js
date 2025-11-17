// verificar-fallback-fetch.js
// Versão com fallback automático para proxy CORS (api.allorigins.win)
// Mantém: detector de fonte confiável, radar de evidências, sensor de emoção
// Mostra uma frase por vez e gera "motivos" detalhados (audit trail).

const verifyBtn = document.getElementById("verifyBtn");
const resultBox = document.getElementById("resultBox");
const resultText = document.getElementById("resultText");

// ---- listas de exemplo (adicione/edite conforme quiser) ----
const trustedSources = ["bbc.com","cnn.com","reuters.com","g1.globo.com","nytimes.com","folha.uol.com.br","estadao.com.br"];
const blacklistedSources = ["theonion.com","clickhole.com","worldnewsdailyreport.com","huzlers.com"];
const nonNewsSites = ["youtube.com","tiktok.com","instagram.com","facebook.com","github.com","mercadolivre.com"];

// palavras / padrões
const suspiciousWords = { "você não vai acreditar":5,"urgente":4,"bomba":3,"milagre":4,"fim do mundo":5,"cura":4,"alerta":3 };
const evidenceKeywords = ["estudo","pesquisa","relatório","dados","documento","fonte oficial","foto","imagem","vídeo","tabela","gráfico"];
const journalismPatterns = ["segundo","de acordo com","estudo mostra","relatório diz","apurou que","confirmou que"];

// utilitários
function pause(ms){ return new Promise(r=>setTimeout(r,ms)); }
function extractDomain(url){
  try { return (new URL(url.startsWith("http")?url:`https://${url}`)).hostname.replace(/^www\./,"").toLowerCase(); }
  catch { return url.split("/")[0].replace(/^www\./,"").toLowerCase(); }
}
function limit(score){ return Math.max(0,Math.min(100,Math.round(score))); }
function getVerdict(score){
  if(score>=85) return ["Fonte extremamente confiável!","lightgreen","🟢"];
  if(score>=70) return ["Provável notícia verdadeira.","gold","🟡"];
  if(score>=45) return ["Conteúdo duvidoso.","orange","🟠"];
  return ["Alta chance de FAKE NEWS!","red","🔴"];
}
function showSimple(msg,color){
  resultBox.style.display="block";
  resultText.innerHTML=`<p style="color:${color}">${msg}</p>`;
}

// --- fetchArticle com fallback automático para proxy public (AllOrigins)
// retorna: { ok:true, text, title, metaDate, metaAuthor, viaProxy:bool } ou { ok:false, error }
async function fetchArticleWithProxyFallback(url, timeout = 6000) {
  const tryFetch = async (targetUrl, opts={}) => {
    const controller = new AbortController();
    const id = setTimeout(()=>controller.abort(), timeout);
    try {
      const resp = await fetch(targetUrl, { signal: controller.signal, ...opts });
      clearTimeout(id);
      if(!resp.ok) return { ok:false, error: `HTTP ${resp.status}` };
      const html = await resp.text();
      const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [null,""])[1] || "";
      const text = html.replace(/<script[\s\S]*?<\/script>/gi,'')
                       .replace(/<style[\s\S]*?<\/style>/gi,'')
                       .replace(/<\/?[^>]+(>|$)/g,' ')
                       .replace(/\s+/g,' ').trim().toLowerCase();
      const metaDate = (html.match(/<meta[^>]*(property|name)=["'](article:published_time|pubdate|date|publishdate|timestamp)["'][^>]*content=["']([^"']+)["'][^>]*>/i) || [null,null,null,""])[3] || "";
      const metaAuthor = (html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["'][^>]*>/i) || [null,""])[1] || "";
      return { ok:true, html, text, title: title.toLowerCase(), metaDate, metaAuthor };
    } catch (err) {
      clearTimeout(id);
      return { ok:false, error: err && err.name ? err.name : String(err) };
    }
  };

  // 1) tentativa direta (modo CORS padrão) - é a mais limpa
  let res = await tryFetch(url, { mode: 'cors', headers: { 'Accept': 'text/html' }});
  if(res.ok) return { ...res, viaProxy:false };

  // 2) se falhar (TypeError, AbortError, HTTP não-ok), tenta ALLORIGINS proxy
  // AllOrigins raw endpoint: https://api.allorigins.win/raw?url=ENCODED_URL
  try {
    const prox = `https://api.allorigins.win/raw?url=${encodeURIComponent(url.startsWith("http")?url:`https://${url}`)}`;
    const res2 = await tryFetch(prox);
    if(res2.ok) return { ...res2, viaProxy:true };
    // se proxy retornar não-ok, devolve erro do proxy
    return { ok:false, error: res2.error || res.error || "fetch_failed" };
  } catch(e){
    return { ok:false, error: e && e.name ? e.name : String(e) };
  }
}

// --- Sensores ---

function sourceDetector(domain) {
  const reasons = []; let adj = 0;
  if(trustedSources.some(s => domain.includes(s))){ adj += 40; reasons.push("Domínio corresponde a fonte altamente confiável."); }
  else if(blacklistedSources.some(s => domain.includes(s))){ adj -= 60; reasons.push("Domínio conhecido por sátira/fake (blacklist)."); }
  else reasons.push("Domínio não está nas listas (desconhecido).");
  // heurística: se contém 'news' ou 'noticia'
  if(domain.includes("news")||domain.includes("noticia")){ adj += 6; reasons.push("URL contém termo típico de notícia (heurística)."); }
  return { adj, reasons };
}

function evidenceRadar(text) {
  const reasons = []; let adj = 0;
  if(!text || text.length < 40){ adj -= 12; reasons.push("Conteúdo não disponível ou texto muito curto para analisar evidências."); return { adj, reasons, found: [] }; }
  const found = evidenceKeywords.filter(k => text.includes(k));
  if(found.length){ adj += found.length * 6; reasons.push(`Evidências encontradas: ${found.join(", ")}.`); }
  else { adj -= 12; reasons.push("Nenhuma evidência (foto/estudo/documento/dados) encontrada no conteúdo."); }
  const externalLinks = (text.match(/https?:\/\/[^\s'"]+/g) || []).slice(0,6);
  if(externalLinks.length){ adj += Math.min(10, externalLinks.length * 2); reasons.push(`Links externos detectados (${externalLinks.length}).`); }
  return { adj, reasons, found };
}

function emotionSensor(text) {
  const reasons = []; let adj = 0;
  if(!text) return { adj:0, reasons, level:"neutro", matches: [] };
  const matches = [];
  Object.entries(suspiciousWords).forEach(([w, weight]) => { if(text.includes(w)) { matches.push(w); adj -= weight * 4; }});
  const excl = (text.match(/!+/g) || []).length; if(excl){ adj -= Math.min(12, excl * 3); reasons.push(`${excl} exclamação(ões) detectada(s).`); }
  const capsSeq = (text.match(/\b[A-ZÀ-Ú]{3,}\b/g) || []).length; if(capsSeq){ adj -= Math.min(12, capsSeq * 2); reasons.push(`${capsSeq} palavra(s) em CAPS detectada(s).`); }
  if(matches.length) reasons.push(`Termos sensacionalistas detectados: ${matches.join(", ")}.`);
  let level = "neutro"; if(adj <= -30) level = "extremamente alarmista"; else if(adj <= -12) level = "alarmista";
  return { adj, reasons, level, matches };
}

function journalismCheck(text){
  const reasons=[]; let adj=0;
  const found = journalismPatterns.filter(p => text.includes(p));
  if(found.length){ adj += found.length * 5; reasons.push(`Padrões jornalísticos detectados: ${found.join(", ")}.`); }
  else reasons.push("Nenhum padrão jornalístico detectado.");
  return { adj, reasons, found };
}

function crossCheckSimulation(domain){
  if(trustedSources.some(s => domain.includes(s))) return 20;
  if(blacklistedSources.some(s => domain.includes(s))) return -40;
  return 0;
}

// ---------------------- pipeline principal ----------------------
verifyBtn.addEventListener("click", async () => {
  const linkInput = document.getElementById("newsLink").value.trim();
  if(!linkInput) return showSimple("⚠️ Insira um link válido.", "orange");

  const domain = extractDomain(linkInput);
  resultBox.style.display = "block";

  // bloqueio imediato para redes/serviços não jornalísticos
  if(nonNewsSites.some(d => domain.includes(d))){
    return showSimple("❌ Este link não é de um site de notícias (plataforma/serviço). Insira uma reportagem.", "red");
  }

  async function phase(msg, ms=900){ resultText.innerHTML = `<p class="scan-text">${msg}</p>`; await pause(ms); }

  // auditoria para explicar ao final
  const audit = [];
  let score = 50;

  // 1) Fonte
  await phase("🌐 Analisando quem publicou a informação...");
  const src = sourceDetector(domain);
  score += src.adj;
  audit.push({ step:"Fonte", reasons: src.reasons, adj: src.adj });

  // 2) Tenta buscar conteúdo: direto -> proxy
  await phase("🔎 Tentando carregar conteúdo da página (fetch com fallback)...");
  const fetchRes = await fetchArticleWithProxyFallback(linkInput, 6000);
  let textForAnalysis = "";
  if(fetchRes.ok){
    textForAnalysis = (fetchRes.title || "") + " " + (fetchRes.text || "");
    audit.push({ step:"Fetch", ok:true, viaProxy: !!fetchRes.viaProxy, metaDate: fetchRes.metaDate, metaAuthor: fetchRes.metaAuthor });
    // se foi viaProxy, anote
    if(fetchRes.viaProxy) audit.push({ step:"FetchProxy", reason:"Conteúdo obtido via proxy CORS (api.allorigins.win)." });
  } else {
    audit.push({ step:"Fetch", ok:false, reason: fetchRes.error });
    // fallback: apenas usa link + domain para análise heurística
    textForAnalysis = linkInput.toLowerCase() + " " + domain;
    // se site altamente confiável, aplica ajuste parcial compensatório (evita perder totalmente o benefício)
    if(trustedSources.some(s => domain.includes(s))){
      const partialBoost = 15; score += partialBoost;
      audit.push({ step:"FetchFallback", reason: `Fetch direto/proxy falhou (${String(fetchRes.error)}). Aplicado boost parcial de +${partialBoost} por ser fonte confiável.` });
    } else {
      audit.push({ step:"FetchFallback", reason: `Fetch falhou (${String(fetchRes.error)}). Usando heurísticas de URL.` });
    }
  }

  // 3) Evidências
  await phase("📡 Radar de evidências — procurando provas, dados ou imagens...");
  const ev = evidenceRadar(textForAnalysis);
  score += ev.adj;
  audit.push({ step:"Evidências", reasons: ev.reasons, adj: ev.adj, found: ev.found });

  // 4) Emoção
  await phase("💬 Sensor de emoção — detectando linguagem alarmista...");
  const emo = emotionSensor(textForAnalysis);
  score += emo.adj;
  audit.push({ step:"Emoção", reasons: emo.reasons, adj: emo.adj, level: emo.level, matches: emo.matches });

  // 5) Padrões jornalísticos
  await phase("📄 Procurando padrões jornalísticos (citações, 'segundo', estudo...)...");
  const j = journalismCheck(textForAnalysis);
  score += j.adj;
  audit.push({ step:"Padrões Jornalísticos", reasons: j.reasons, adj: j.adj, found: j.found });

  // 6) Cross-check de reputação
  await phase("🔍 Cruzando reputação da fonte...");
  const cross = crossCheckSimulation(domain);
  score += cross;
  audit.push({ step:"Cross-check", reasons:[`Cross-check adjustment: ${cross}`], adj: cross });

  // final
  score = limit(score);
  const [msg, color, emoji] = getVerdict(score);

  // monta motivos legíveis
  const reasonsFlat = [];
  for(const a of audit){
    if(a.reasons && a.reasons.length) reasonsFlat.push(`${a.step}: ${a.reasons.join(" / ")}`);
    else if(a.reason) reasonsFlat.push(`${a.step}: ${a.reason}`);
    else reasonsFlat.push(`${a.step}: (ajuste ${a.adj || 0})`);
  }

  resultText.innerHTML = `
    <hr class="divider">
    <p class="final-result">${emoji} ${msg}</p>
    <p class="final-domain">🌐 Domínio: <b>${domain}</b></p>
    <p class="final-score">📊 Confiabilidade: <b style="color:${color}">${score}%</b></p>
    <details style="margin-top:8px;color:#ddd;">
      <summary style="cursor:pointer;color:#cfcfe0">Ver motivos da pontuação (clique para abrir)</summary>
      <div style="text-align:left;padding:8px;font-size:13px;line-height:1.5;">
        ${reasonsFlat.map(r => `<div>• ${escapeHtml(r)}</div>`).join("")}
      </div>
    </details>
  `;

  console.group("Verificador - Auditoria");
  console.log("Link:", linkInput);
  console.log("Domain:", domain);
  console.log("Score final:", score);
  console.log("Audit trace:", audit);
  console.groupEnd();
});

// helpers finais
function escapeHtml(str){ return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
// botão de limpar o link
document.getElementById("clearBtn").addEventListener("click", () => {
  const input = document.getElementById("newsLink");
  input.value = "";
  input.focus();

  // limpa também a caixa de resultado (opcional)
  // basta deletar esta parte se não quiser limpar o resultado
  resultBox.style.display = "none";
  resultText.innerHTML = "";
});
