import Database from 'better-sqlite3';
import * as fs from 'fs';

class DbThing {
  private dbPath: string;
  private db: Database.Database | null = null;

  constructor(dbPath: string = 'fakekong.db') {
    this.dbPath = dbPath;
  }

  getConn(): Database.Database {
    if (!this.db) {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
    }
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  initTables(): void {
    const db = this.getConn();

    db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        key_hash TEXT NOT NULL UNIQUE,
        key_prefix TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        expires_at TEXT,
        created_at TEXT NOT NULL,
        revoked_at TEXT,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS rate_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        endpoint_pattern TEXT,
        max_requests INTEGER NOT NULL,
        window_seconds INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        api_key_id INTEGER NOT NULL,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        status_code INTEGER NOT NULL,
        latency_ms REAL NOT NULL,
        timestamp TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS bucket_state (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        endpoint TEXT NOT NULL,
        tokens REAL NOT NULL,
        last_refill TEXT NOT NULL,
        UNIQUE(client_id, endpoint),
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `);

    console.log('✓ Database tables initialized');
  }

  resetDb(): void {
    if (this.db) {
      this.db.close();
    }
    if (fs.existsSync(this.dbPath)) {
      fs.unlinkSync(this.dbPath);
    }
    this.db = null;
    this.initTables();
  }
}

const dbThing = new DbThing();
export default dbThing;
