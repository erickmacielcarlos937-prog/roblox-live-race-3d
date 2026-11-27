const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const players = new Map();
let racing = false;
let startedAt = 0;

app.use(express.static("public"));
app.get("/health", (_req, res) => res.json({ ok: true, players: players.size }));

function broadcast() {
  const payload = JSON.stringify({
    type: "state",
    racing,
    players: [...players.values()].sort((a,b) => b.progress - a.progress)
  });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

wss.on("connection", socket => {
  socket.send(JSON.stringify({ type: "state", racing, players: [...players.values()] }));
  socket.on("message", raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === "join") {
      const name = String(msg.name || "").trim().replace(/[<>]/g, "").slice(0, 20);
      if (!name) return;
      const id = Math.random().toString(36).slice(2, 9);
      players.set(id, { id, name, progress: 0, finished: false });
      socket.playerId = id;
      broadcast();
    }
    if (msg.type === "progress" && socket.playerId && racing) {
      const p = players.get(socket.playerId);
      if (p && !p.finished) {
        p.progress = Math.min(100, Math.max(p.progress, Number(msg.value) || 0));
        if (p.progress >= 100) p.finished = true;
        broadcast();
      }
    }
    if (msg.type === "start") {
      racing = true; startedAt = Date.now();
      for (const p of players.values()) { p.progress = 0; p.finished = false; }
      broadcast();
    }
    if (msg.type === "reset") {
      racing = false;
      for (const p of players.values()) { p.progress = 0; p.finished = false; }
      broadcast();
    }
  });
  socket.on("close", () => {
    if (socket.playerId) { players.delete(socket.playerId); broadcast(); }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`ROBLOX LIVE RACE 3D rodando na porta ${port}`));
