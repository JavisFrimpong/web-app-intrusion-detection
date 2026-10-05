import os
import sqlite3
import threading

_DATABASE_URL = (os.environ.get("DATABASE_URL") or "").strip()
_SQLITE_PATH = os.environ.get("AEGIS_DB_PATH") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../traffic-monitor/predictions.db")
)
_init_lock = threading.Lock()
_initialized = False


class Database:
    def __init__(self, connection, postgres=False):
        self.connection = connection
        self.postgres = postgres

    def _sql(self, statement):
        return statement.replace("?", "%s") if self.postgres else statement

    def cursor(self):
        if self.postgres:
            from psycopg2.extras import RealDictCursor
            return Cursor(self.connection.cursor(cursor_factory=RealDictCursor), True)
        return Cursor(self.connection.cursor(), False)

    def execute(self, statement, params=()):
        cur = self.cursor()
        cur.execute(statement, params)
        return cur

    def commit(self):
        self.connection.commit()

    def rollback(self):
        self.connection.rollback()

    def close(self):
        self.connection.close()


class Cursor:
    def __init__(self, cursor, postgres=False):
        self.cursor_obj = cursor
        self.postgres = postgres

    def _sql(self, statement):
        return statement.replace("?", "%s") if self.postgres else statement

    def execute(self, statement, params=()):
        self.cursor_obj.execute(self._sql(statement), params)
        return self

    def executemany(self, statement, params):
        self.cursor_obj.executemany(self._sql(statement), params)
        return self

    def fetchone(self):
        return self.cursor_obj.fetchone()

    def fetchall(self):
        return self.cursor_obj.fetchall()

    @property
    def rowcount(self):
        return self.cursor_obj.rowcount


def _connect_raw():
    if _DATABASE_URL:
        import psycopg2
        conn = psycopg2.connect(_DATABASE_URL, connect_timeout=10)
        return Database(conn, postgres=True)

    os.makedirs(os.path.dirname(_SQLITE_PATH), exist_ok=True)
    conn = sqlite3.connect(_SQLITE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return Database(conn, postgres=False)


def _sqlite_column_names(db, table):
    return {row[1] for row in db.execute(f"PRAGMA table_info({table})").fetchall()}


def initialize_database(db=None):
    global _initialized
    if _initialized:
        return

    with _init_lock:
        if _initialized:
            return

        owns = db is None
        db = db or _connect_raw()

        if db.postgres:
            db.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    company TEXT,
                    verification_code TEXT,
                    verification_expires_at TEXT,
                    password_reset_code TEXT,
                    password_reset_expires_at TEXT,
                    sensor_token TEXT UNIQUE,
                    is_verified INTEGER DEFAULT 0,
                    created_at TEXT
                )
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL
                )
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    prediction INTEGER,
                    attack_type TEXT,
                    confidence DOUBLE PRECISION,
                    timestamp TEXT,
                    source_ip TEXT,
                    source_port INTEGER,
                    destination_ip TEXT,
                    destination_port INTEGER,
                    packet_count INTEGER
                )
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS heuristic_alerts (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    alert_type TEXT,
                    message TEXT,
                    timestamp TEXT,
                    source_ip TEXT
                )
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS monitored_websites (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    domain TEXT NOT NULL,
                    label TEXT,
                    status TEXT NOT NULL DEFAULT 'pending',
                    http_status INTEGER,
                    last_checked_at TEXT,
                    site_key TEXT UNIQUE,
                    last_event_at TEXT,
                    created_at TEXT NOT NULL,
                    UNIQUE(user_id, domain)
                )
            """)
            db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires_at TEXT")
            db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_code TEXT")
            db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires_at TEXT")
            db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS sensor_token TEXT")
            db.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_sensor_token ON users(sensor_token)")
            db.execute("ALTER TABLE predictions ADD COLUMN IF NOT EXISTS user_id INTEGER")
            db.execute("ALTER TABLE heuristic_alerts ADD COLUMN IF NOT EXISTS user_id INTEGER")
            db.execute("ALTER TABLE monitored_websites ADD COLUMN IF NOT EXISTS site_key TEXT")
            db.execute("ALTER TABLE monitored_websites ADD COLUMN IF NOT EXISTS last_event_at TEXT")
            db.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_websites_site_key ON monitored_websites(site_key)")
        else:
            db.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
                    password_hash TEXT NOT NULL,
                    company TEXT,
                    verification_code TEXT,
                    verification_expires_at TEXT,
                    sensor_token TEXT UNIQUE,
                    is_verified INTEGER DEFAULT 0,
                    created_at TEXT
                )
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    prediction INTEGER,
                    attack_type TEXT,
                    confidence REAL,
                    timestamp TEXT,
                    source_ip TEXT,
                    source_port INTEGER,
                    destination_ip TEXT,
                    destination_port INTEGER,
                    packet_count INTEGER,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS heuristic_alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    alert_type TEXT,
                    message TEXT,
                    timestamp TEXT,
                    source_ip TEXT,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS monitored_websites (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    domain TEXT NOT NULL,
                    label TEXT,
                    status TEXT NOT NULL DEFAULT 'pending',
                    http_status INTEGER,
                    last_checked_at TEXT,
                    site_key TEXT UNIQUE,
                    last_event_at TEXT,
                    created_at TEXT NOT NULL,
                    UNIQUE(user_id, domain),
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)

            if "verification_expires_at" not in _sqlite_column_names(db, "users"):
                db.execute("ALTER TABLE users ADD COLUMN verification_expires_at TEXT")
            if "password_reset_code" not in _sqlite_column_names(db, "users"):
                db.execute("ALTER TABLE users ADD COLUMN password_reset_code TEXT")
            if "password_reset_expires_at" not in _sqlite_column_names(db, "users"):
                db.execute("ALTER TABLE users ADD COLUMN password_reset_expires_at TEXT")
            if "sensor_token" not in _sqlite_column_names(db, "users"):
                db.execute("ALTER TABLE users ADD COLUMN sensor_token TEXT")
            db.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_sensor_token ON users(sensor_token)")
            if "user_id" not in _sqlite_column_names(db, "predictions"):
                db.execute("ALTER TABLE predictions ADD COLUMN user_id INTEGER")
            if "user_id" not in _sqlite_column_names(db, "heuristic_alerts"):
                db.execute("ALTER TABLE heuristic_alerts ADD COLUMN user_id INTEGER")
            if "site_key" not in _sqlite_column_names(db, "monitored_websites"):
                db.execute("ALTER TABLE monitored_websites ADD COLUMN site_key TEXT")
            if "last_event_at" not in _sqlite_column_names(db, "monitored_websites"):
                db.execute("ALTER TABLE monitored_websites ADD COLUMN last_event_at TEXT")
            db.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_websites_site_key ON monitored_websites(site_key)")

        db.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON heuristic_alerts(user_id)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_websites_user_id ON monitored_websites(user_id)")
        db.commit()
        _initialized = True

        if owns:
            db.close()


def get_db():
    db = _connect_raw()
    initialize_database(db)
    return db


def using_postgres():
    return bool(_DATABASE_URL)
