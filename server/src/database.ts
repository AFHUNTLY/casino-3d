import Database from 'better-sqlite3';

const db = new Database(':memory:');

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    last_active INTEGER DEFAULT (strftime('%s', 'now')),
    current_game TEXT,
    position_x REAL DEFAULT 0,
    position_y REAL DEFAULT 1.7,
    position_z REAL DEFAULT 10
  );

  CREATE TABLE IF NOT EXISTS bets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    game TEXT NOT NULL,
    bet_amount TEXT NOT NULL,
    nonce TEXT,
    commitment TEXT,
    tx_hash TEXT,
    result TEXT,
    payout TEXT DEFAULT '0',
    status TEXT DEFAULT 'pending',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    resolved_at INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );

  CREATE TABLE IF NOT EXISTS leaderboard (
    wallet_address TEXT PRIMARY KEY,
    total_wagered TEXT DEFAULT '0',
    total_won TEXT DEFAULT '0',
    games_played INTEGER DEFAULT 0,
    biggest_win TEXT DEFAULT '0'
  );

  CREATE INDEX IF NOT EXISTS idx_bets_wallet ON bets(wallet_address);
  CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
`);

export default db;
