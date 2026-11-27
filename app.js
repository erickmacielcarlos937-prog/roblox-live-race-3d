const statusEl = document.getElementById("status");
const ranking = document.getElementById("ranking");
const runners = document.getElementById("runners");
const socketUrl = (location.protocol === "https:" ? "wss://" : "ws://") + location.host;
const ws = new WebSocket(socketUrl);
let myProgress = 0;
let racing = false;

ws.onopen = () => statusEl.textContent = "Conectado";
ws.onclose = () => statusEl.textContent = "Desconectado";
ws.onerror = () => statusEl.textContent = "Erro de conexão";
ws.onmessage = event => {
  const data = JSON.parse(event.data);
  if (data.type !== "state") return;
  racing = data.racing;
  ranking.innerHTML = "";
  runners.innerHTML = "";
  if (!data.players.length) ranking.innerHTML = "<li>Aguardando jogadores...</li>";
  data.players.forEach((p, i) => {
    const li = document.createElement("li");
    li.textContent = `${i+1}º ${p.name} — ${Math.round(p.progress)}%${p.finished ? " 🏁" : ""}`;
    ranking.appendChild(li);
    const el = document.createElement("div");
    el.className = "runner";
    el.style.left = `${12 + p.progress * .72}%`;
    el.style.bottom = `${13 + (i%4)*8}%`;
    el.innerHTML = '<div class="avatar"></div><div class="body"></div>';
    const name = document.createElement("span"); name.textContent = p.name; el.appendChild(name);
    runners.appendChild(el);
  });
};
document.getElementById("joinForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("playerName").value.trim();
  if (name && ws.readyState === 1) ws.send(JSON.stringify({type:"join", name}));
});
document.getElementById("start").onclick = () => {
  myProgress = 0;
  if (ws.readyState === 1) ws.send(JSON.stringify({type:"start"}));
  // Demonstração local: o primeiro jogador progride automaticamente.
  const timer = setInterval(() => {
    if (!racing || myProgress >= 100) { clearInterval(timer); return; }
    myProgress += 5;
    if (ws.readyState === 1) ws.send(JSON.stringify({type:"progress", value:myProgress}));
  }, 700);
};
document.getElementById("reset").onclick = () => {
  myProgress = 0;
  if (ws.readyState === 1) ws.send(JSON.stringify({type:"reset"}));
};
