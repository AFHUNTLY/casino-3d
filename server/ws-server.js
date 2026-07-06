/**
 * Diamond Casino — WebSocket Multiplayer Server
 * Deploy on VPS 65.109.181.34
 *
 * Handles:
 * - Player position sync (10Hz)
 * - Chat messages (global + proximity)
 * - Player join/leave events
 * - Simple room management
 */

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 8080;

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    players: players.size,
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// ===== PLAYER STATE =====
const players = new Map(); // ws -> { id, name, address, x, y, z, rot, color, lastUpdate }

let playerIdCounter = 1;

const PLAYER_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
  '#6c5ce7', '#a29bfe', '#fd79a8', '#00cec9',
  '#fdcb6e', '#e17055', '#00b894', '#0984e3',
];

function broadcast(message, excludeWs = null) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function broadcastPlayerList() {
  const list = Array.from(players.values()).map(p => ({
    id: p.id,
    name: p.name,
    address: p.address,
    color: p.color,
  }));
  broadcast({ type: 'players', list });
}

wss.on('connection', (ws) => {
  const playerId = playerIdCounter++;
  const color = PLAYER_COLORS[playerId % PLAYER_COLORS.length];

  console.log(`[CASINO] Player ${playerId} connected`);

  // Send init message
  ws.send(JSON.stringify({
    type: 'init',
    id: playerId,
    color: color,
    playerCount: players.size + 1,
  }));

  // Register player with defaults
  players.set(ws, {
    id: playerId,
    name: 'Guest ' + playerId,
    address: null,
    x: 0,
    y: 1.7,
    z: 25,
    rot: 0,
    color: color,
    lastUpdate: Date.now(),
  });

  // Broadcast new player joined
  broadcast({
    type: 'join',
    id: playerId,
    name: 'Guest ' + playerId,
    color: color,
  });

  broadcastPlayerList();

  // Send existing players to new player
  const existingPlayers = Array.from(players.values())
    .filter(p => p.id !== playerId)
    .map(p => ({
      id: p.id, name: p.name, address: p.address,
      x: p.x, y: p.y, z: p.z, rot: p.rot, color: p.color,
    }));
  ws.send(JSON.stringify({ type: 'existing', players: existingPlayers }));

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (e) {
      return;
    }

    const player = players.get(ws);
    if (!player) return;

    switch (msg.type) {
      case 'name':
        player.name = msg.name || player.name;
        broadcastPlayerList();
        broadcast({ type: 'name', id: player.id, name: player.name });
        break;

      case 'wallet':
        player.address = msg.address;
        broadcastPlayerList();
        break;

      case 'move':
        player.x = msg.x;
        player.y = msg.y;
        player.z = msg.z;
        player.rot = msg.rot;
        player.lastUpdate = Date.now();
        // Broadcast to others (no echo to sender)
        broadcast({
          type: 'move',
          id: player.id,
          x: player.x, y: player.y, z: player.z, rot: player.rot,
        }, ws);
        break;

      case 'chat':
        // Global chat
        broadcast({
          type: 'chat',
          id: player.id,
          name: player.name,
          message: msg.message,
          color: player.color,
          timestamp: Date.now(),
        });
        break;

      case 'emote':
        broadcast({
          type: 'emote',
          id: player.id,
          emote: msg.emote,
        });
        break;

      default:
        break;
    }
  });

  ws.on('close', () => {
    const player = players.get(ws);
    if (player) {
      console.log(`[CASINO] Player ${player.id} (${player.name}) disconnected`);
      broadcast({ type: 'leave', id: player.id });
    }
    players.delete(ws);
    broadcastPlayerList();
  });

  ws.on('error', (err) => {
    console.error(`[CASINO] WS error for player ${playerId}:`, err.message);
  });
});

// Clean up stale players (no update in 60s)
setInterval(() => {
  const now = Date.now();
  for (const [ws, player] of players) {
    if (now - player.lastUpdate > 60000) {
      console.log(`[CASINO] Cleaning up stale player ${player.id}`);
      ws.terminate();
      players.delete(ws);
      broadcast({ type: 'leave', id: player.id });
    }
  }
}, 30000);

server.listen(PORT, () => {
  console.log(`[CASINO] WebSocket server running on port ${PORT}`);
  console.log(`[CASINO] Health check: http://localhost:${PORT}/health`);
});
