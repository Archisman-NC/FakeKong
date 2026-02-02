import sqlite3
from datetime import datetime
import os

class DbThing:
    """handles db connection stuff"""
    
    def __init__(self, db_path="fakekong.db"):
        self.db_path = db_path
        self.conn = None
        
    def get_conn(self):
        if self.conn is None:
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row
        return self.conn
    
    def close(self):
        if self.conn:
            self.conn.close()
            self.conn = None
    
    def init_tables(self):
        """create all the tables we need"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        # clients table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        
        # api keys table
        cursor.execute("""
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
        """)
        
        # rate limit rules
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rate_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER,
                endpoint_pattern TEXT,
                max_requests INTEGER NOT NULL,
                window_seconds INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (client_id) REFERENCES clients(id)
            )
        """)
        
        # usage logs
        cursor.execute("""
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
        """)
        
        # token bucket state (for rate limiting)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bucket_state (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL,
                endpoint TEXT NOT NULL,
                tokens REAL NOT NULL,
                last_refill TEXT NOT NULL,
                UNIQUE(client_id, endpoint),
                FOREIGN KEY (client_id) REFERENCES clients(id)
            )
        """)
        
        conn.commit()
        
    def reset_db(self):
        """drop everything and start fresh - useful for testing"""
        if os.path.exists(self.db_path):
            os.remove(self.db_path)
        self.conn = None
        self.init_tables()


# global instance
db = DbThing()
