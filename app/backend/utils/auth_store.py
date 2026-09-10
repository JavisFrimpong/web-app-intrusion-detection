import os
import sqlite3
import secrets
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "auth.db"))
OTP_TTL_MINUTES = 10


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = _get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_verified INTEGER NOT NULL DEFAULT 0,
            otp_code TEXT,
            otp_expires_at TEXT,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def _new_otp():
    return f"{secrets.randbelow(1000000):06d}"


def create_pending_user(email, password):
    """
    Creates a new unverified user, or refreshes the code for an existing
    unverified one (so re-submitting signup with the same email just
    resends a fresh code instead of erroring). Returns the OTP code, or
    None if that email already belongs to a verified account.
    """
    conn = _get_conn()
    existing = conn.execute("SELECT id, is_verified FROM users WHERE email = ?", (email,)).fetchone()

    if existing and existing["is_verified"]:
        conn.close()
        return None

    otp_code = _new_otp()
    expires_at = (datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES)).isoformat()
    password_hash = generate_password_hash(password)

    if existing:
        conn.execute(
            "UPDATE users SET password_hash = ?, otp_code = ?, otp_expires_at = ? WHERE email = ?",
            (password_hash, otp_code, expires_at, email),
        )
    else:
        conn.execute(
            "INSERT INTO users (email, password_hash, is_verified, otp_code, otp_expires_at, created_at) "
            "VALUES (?, ?, 0, ?, ?, ?)",
            (email, password_hash, otp_code, expires_at, datetime.utcnow().isoformat()),
        )
    conn.commit()
    conn.close()
    return otp_code


def regenerate_otp(email):
    """Issues a fresh code for an existing, still-unverified signup."""
    conn = _get_conn()
    row = conn.execute("SELECT is_verified FROM users WHERE email = ?", (email,)).fetchone()
    if not row or row["is_verified"]:
        conn.close()
        return None

    otp_code = _new_otp()
    expires_at = (datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES)).isoformat()
    conn.execute("UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE email = ?", (otp_code, expires_at, email))
    conn.commit()
    conn.close()
    return otp_code


def verify_otp(email, code):
    conn = _get_conn()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

    if not row:
        conn.close()
        return False, "No signup found for that email."
    if row["is_verified"]:
        conn.close()
        return True, "Already verified."
    if not row["otp_code"] or row["otp_code"] != code:
        conn.close()
        return False, "Incorrect code."
    if datetime.fromisoformat(row["otp_expires_at"]) < datetime.utcnow():
        conn.close()
        return False, "That code expired. Request a new one."

    conn.execute("UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE email = ?", (email,))
    conn.commit()
    conn.close()
    return True, "Verified."


def get_user_by_email(email):
    conn = _get_conn()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    return row


def check_login(email, password):
    row = get_user_by_email(email)
    if not row or not row["is_verified"]:
        return None
    if not check_password_hash(row["password_hash"], password):
        return None
    return row
