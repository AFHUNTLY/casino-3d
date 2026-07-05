import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import db from './database';
import { generateSeedPair } from './seedManager';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

// ===== REST API =====

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    players: wss.clients.size,
  });
});

// Create session
app.post('/api/session', (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ error: 'walletAddress required' });
  }

  const sessionId = randomUUID();
  db.prepare(
    'INSERT INTO sessions (id, wallet_address) VALUES (?, ?)'
  ).run(sessionId, walletAddress.toLowerCase());

  res.json({ sessionId, walletAddress });
});

// Get leaderboard
app.get('/api/leaderboard', (_req, res) => {
  const rows = db.prepare(
    'SELECT wallet_address, total_wagered, total_won, games_played, biggest_win FROM leaderboard ORDER BY CAST(total_won AS INTEGER) DESC LIMIT 10'
  ).all();
  res.json(rows);
});

// Get seed for commit-reveal
app.post('/api/seed', (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ error: 'walletAddress required' });
  }
  const seed = generateSeedPair(walletAddress);
  res.json(seed);
});

// Record a bet
app.post('/api/bet', (req, res) => {
  const { sessionId, walletAddress, game, betAmount, nonce, commitment } = req.body;

  const stmt = db.prepare(
    `INSERT INTO bets (session_id, wallet_address, game, bet_amount, nonce, commitment)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(sessionId, walletAddress.toLowerCase(), game, betAmount, nonce, commitment);

  res.json({ betId: result.lastInsertRowid, status: 'pending' });
});

// Resolve a bet (after on-chain confirmation)
app.post('/api/bet/resolve', (req, res) => {
  const { betId, result, payout, txHash } = req.body;

  db.prepare(
    `UPDATE bets SET result = ?, payout = ?, tx_hash = ?, status = 'resolved', resolved_at = strftime('%s','now')
     WHERE id = ?`
  ).run(result, payout, txHash, betId);

  // Update leaderboard
  const bet = db.prepare('SELECT wallet_address, bet_amount, game FROM bets WHERE id = ?').get(betId) as any;
  if (bet) {
    db.prepare(
      `INSERT INTO leaderboard (wallet_address, total_wagered, total_won, games_played, biggest_win)
       VALUES (?, ?, ?, 1, ?)
       ON CONFLICT(wallet_address)
       DO UPDATE SET
         total_wagered = CAST(total_wagered AS INTEGER) + ?,
         total_won = CAST(total_won AS INTEGER) + ?,
         games_played = games_played + 1,
         biggest_win = MAX(CAST(biggest_win AS INTEGER), ?)`
    ).run(
      bet.wallet_address,
      bet.bet_amount,
      payout,
      payout,
      bet.bet_amount,
      payout,
      payout
    );
  }

  res.json({ status: 'resolved' });
});

// Get player stats
app.get('/api/player/:address', (req, res) => {
  const addr = req.params.address.toLowerCase();
  const stats = db.prepare(
    'SELECT * FROM leaderboard WHERE wallet_address = ?'
  ).get(addr) as any;

  const recentBets = db.prepare(
    'SELECT * FROM bets WHERE wallet_address = ? ORDER BY created_at DESC LIMIT 20'
  ).all(addr);

  res.json({ stats, recentBets });
});

// ===== WebSocket =====

interface ClientInfo {
  ws: WebSocket;
  sessionId?: string;
  walletAddress?: string;
}

const clients = new Map<WebSocket, ClientInfo>();

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  clients.set(ws, { ws });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const client = clients.get(ws);

      switch (msg.type) {
        case 'join':
          client!.sessionId = msg.sessionId;
          client!.walletAddress = msg.walletAddress;
          ws.send(JSON.stringify({ type: 'joined', sessionId: msg.sessionId }));
          break;

        case 'position':
          // Update player position in DB
          if (client!.sessionId) {
            db.prepare(
              'UPDATE sessions SET position_x = ?, position_z = ?, last_active = strftime(\'s\',\'now\') WHERE id = ?'
            ).run(msg.x, msg.z, client!.sessionId);
          }
          break;

        case 'game_event':
          // Broadcast game events (e.g., big win) to all clients
          broadcast(JSON.stringify({
            type: 'game_event',
            game: msg.game,
            event: msg.event,
            player: client!.walletAddress,
          }));
          break;
      }
    } catch (e) {
      console.error('WS message error:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket client disconnected');
  });

  ws.send(JSON.stringify({ type: 'connected' }));
});

function broadcast(message: string) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// ===== Start Server =====

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎰 Casino server running on port ${PORT}`);
  console.log(`   REST API: http://localhost:${PORT}/api`);
  console.log(`   WebSocket: ws://localhost:${PORT}/ws`);
});
