import os
import random
import hashlib
import secrets
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from utils.database import get_db

auth_bp = Blueprint("auth", __name__)

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.environ.get("AEGIS_DB_PATH") or (
    "/tmp/aegis_predictions.db"
    if os.environ.get("VERCEL")
    else os.path.abspath(os.path.join(BACKEND_DIR, "../traffic-monitor/predictions.db"))
)

SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "AEGIS SOC <onboarding@resend.dev>")

SESSION_DAYS = 14


def hash_password(password):
    return generate_password_hash(password, method="pbkdf2:sha256", salt_length=16)


def verify_password(stored_hash, password):
    if not stored_hash:
        return False

    # Legacy accounts used a raw SHA-256 digest. Keep them working and
    # transparently upgrade the hash after the next successful sign-in.
    if len(stored_hash) == 64 and all(ch in "0123456789abcdef" for ch in stored_hash.lower()):
        return secrets.compare_digest(
            stored_hash.lower(),
            hashlib.sha256(password.encode("utf-8")).hexdigest(),
        )

    try:
        return check_password_hash(stored_hash, password)
    except Exception:
        return False


def generate_otp_code():
    return f"{random.randint(100000, 999999)}"


def create_session(conn, user_id):
    token = secrets.token_urlsafe(48)
    now = datetime.utcnow()
    expires = now + timedelta(days=SESSION_DAYS)
    conn.execute(
        "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
        (token, int(user_id), now.isoformat(), expires.isoformat()),
    )
    conn.commit()
    return token


def _read_bearer_token():
    header = request.headers.get("Authorization", "").strip()
    if header.lower().startswith("bearer "):
        return header[7:].strip()
    return None


def get_authenticated_user():
    token = _read_bearer_token()
    if not token:
        return None

    conn = get_db()
    row = conn.execute("""
        SELECT u.*
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ? AND s.expires_at > ?
        LIMIT 1
    """, (token, datetime.utcnow().isoformat())).fetchone()
    conn.close()
    return row


def require_authenticated_user():
    user = get_authenticated_user()
    if not user:
        return None, (jsonify({"success": False, "error": "Authentication required."}), 401)
    return user, None


def send_email_via_resend(recipient_email, subject, text_body, html_body):
    if not RESEND_API_KEY:
        return False

    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": EMAIL_FROM,
                "to": [recipient_email],
                "subject": subject,
                "text": text_body,
                "html": html_body,
            },
            timeout=15,
        )
        if response.ok:
            return True

        print(f"[AEGIS] Resend API error {response.status_code}: {response.text}")
        return False
    except Exception as exc:
        print(f"[AEGIS] Resend request error: {exc}")
        return False


def send_verification_email(recipient_email, recipient_name, otp_code):
    subject = f"AEGIS SOC - Your Email Verification Code: {otp_code}"
    text_body = (
        f"Hello {recipient_name},\n\n"
        f"Your AEGIS SOC verification code is: {otp_code}\n\n"
        "This code will expire in 10 minutes."
    )
    html_body = f"""
        <!doctype html>
        <html>
          <body style="font-family:Segoe UI,Arial,sans-serif;background:#020617;color:#f8fafc;padding:24px">
            <div style="max-width:520px;margin:auto;background:#0f172a;border:1px solid #1e293b;border-radius:18px;padding:32px">
              <div style="font-size:20px;font-weight:900;color:#38bdf8">AEGIS SOC</div>
              <p style="color:#cbd5e1">Hello <strong>{recipient_name}</strong>,</p>
              <p style="color:#cbd5e1">Use the verification code below to activate your security console.</p>
              <div style="margin:24px 0;padding:18px;text-align:center;background:#020617;border:1px solid #38bdf8;border-radius:12px;font-size:30px;font-weight:900;letter-spacing:8px;color:#38bdf8">{otp_code}</div>
              <p style="font-size:12px;color:#94a3b8">If you did not create this account, you can ignore this message.</p>
            </div>
          </body>
        </html>
        """

    if send_email_via_resend(recipient_email, subject, text_body, html_body):
        return True

    if not SMTP_USER or not SMTP_PASS:
        print(f"[AEGIS] No email provider configured for verification email to {recipient_email}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"AEGIS Enterprise Security <{SMTP_USER}>"
        msg["To"] = recipient_email
        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=8)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [recipient_email], msg.as_string())
        server.quit()
        return True
    except Exception as exc:
        print(f"[AEGIS] SMTP error: {exc}")
        return False



def send_password_reset_email(recipient_email, recipient_name, reset_code):
    subject = f"AEGIS SOC - Password Reset Code: {reset_code}"
    text_body = (
        f"Hello {recipient_name},\n\n"
        f"Your AEGIS SOC password reset code is: {reset_code}\n\n"
        "This code expires in 10 minutes. If you did not request a password reset, ignore this email."
    )
    html_body = f"""
        <!doctype html>
        <html>
          <body style="font-family:Segoe UI,Arial,sans-serif;background:#020617;color:#f8fafc;padding:24px">
            <div style="max-width:520px;margin:auto;background:#0f172a;border:1px solid #1e293b;border-radius:18px;padding:32px">
              <div style="font-size:20px;font-weight:900;color:#38bdf8">AEGIS SOC</div>
              <p style="color:#cbd5e1">Hello <strong>{recipient_name}</strong>,</p>
              <p style="color:#cbd5e1">Use this code to reset your AEGIS password.</p>
              <div style="margin:24px 0;padding:18px;text-align:center;background:#020617;border:1px solid #38bdf8;border-radius:12px;font-size:30px;font-weight:900;letter-spacing:8px;color:#38bdf8">{reset_code}</div>
              <p style="font-size:12px;color:#94a3b8">This code expires in 10 minutes. If you did not request this, no action is required.</p>
            </div>
          </body>
        </html>
        """

    if send_email_via_resend(recipient_email, subject, text_body, html_body):
        return True

    if not SMTP_USER or not SMTP_PASS:
        print(f"[AEGIS] No email provider configured for password reset email to {recipient_email}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"AEGIS Enterprise Security <{SMTP_USER}>"
        msg["To"] = recipient_email
        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=8)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [recipient_email], msg.as_string())
        server.quit()
        return True
    except Exception as exc:
        print(f"[AEGIS] Password reset SMTP error: {exc}")
        return False


@auth_bp.route("/auth/register", methods=["POST", "OPTIONS"])
@auth_bp.route("/auth/signup", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    try:
        data = request.json or {}
        name = (data.get("name") or data.get("username") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        company = (data.get("company") or "").strip() or "Enterprise Operations"

        if not email or not password:
            return jsonify({"success": False, "error": "Email and password are required."}), 400
        if len(password) < 8:
            return jsonify({"success": False, "error": "Password must be at least 8 characters."}), 400
        if not name:
            name = email.split("@")[0].capitalize()

        conn = get_db()
        existing = conn.execute(
            "SELECT id, is_verified FROM users WHERE lower(email) = lower(?) LIMIT 1",
            (email,),
        ).fetchone()

        if existing:
            conn.close()
            if int(existing["is_verified"] or 0) == 1:
                return jsonify({
                    "success": False,
                    "error": "An account with this email already exists. Please sign in instead."
                }), 409
            return jsonify({
                "success": False,
                "error": "This email already has an account awaiting verification. Enter the code previously sent or request a new one.",
                "requires_verification": True,
                "email": email,
            }), 409

        otp = generate_otp_code()
        expires_at = (datetime.utcnow() + timedelta(minutes=10)).isoformat()

        conn.execute("""
            INSERT INTO users (
                name, email, password_hash, company, verification_code,
                verification_expires_at, sensor_token, is_verified, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
        """, (
            name,
            email,
            hash_password(password),
            company,
            otp,
            expires_at,
            secrets.token_urlsafe(32),
            datetime.utcnow().isoformat(),
        ))
        conn.commit()

        email_sent = send_verification_email(email, name, otp)
        if not email_sent:
            # Do not leave a dead, unusable account if delivery is not configured.
            conn.execute("DELETE FROM users WHERE lower(email) = lower(?) AND is_verified = 0", (email,))
            conn.commit()
            conn.close()
            return jsonify({
                "success": False,
                "error": "We could not send the verification email. Please try again shortly."
            }), 503

        conn.close()
        return jsonify({
            "success": True,
            "message": f"A 6-digit verification code was sent to {email}.",
            "email": email,
            "requires_verification": True,
        }), 201
    except Exception as exc:
        message = str(exc).lower()
        if "unique" in message or "duplicate" in message:
            return jsonify({
                "success": False,
                "error": "An account with this email already exists. Please sign in instead."
            }), 409
        return jsonify({"success": False, "error": str(exc)}), 500


@auth_bp.route("/auth/verify-code", methods=["POST", "OPTIONS"])
@auth_bp.route("/auth/verify", methods=["POST", "OPTIONS"])
def verify_code():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    try:
        data = request.json or {}
        email = (data.get("email") or "").strip().lower()
        code = (data.get("code") or "").strip()

        if not email or not code:
            return jsonify({"success": False, "error": "Email and verification code are required."}), 400

        conn = get_db()
        user = conn.execute("SELECT * FROM users WHERE lower(email) = lower(?)", (email,)).fetchone()

        if not user:
            conn.close()
            return jsonify({"success": False, "error": "User account not found."}), 404

        if int(user["is_verified"] or 0) == 1:
            token = create_session(conn, user["id"])
            conn.close()
            return jsonify({"success": True, "token": token, "user": dict(user)})

        if user["verification_code"] != code:
            conn.close()
            return jsonify({"success": False, "error": "Invalid verification code."}), 400

        expires_at = user["verification_expires_at"]
        if not expires_at or datetime.utcnow() > datetime.fromisoformat(expires_at):
            conn.close()
            return jsonify({
                "success": False,
                "error": "This verification code has expired. Request a new code."
            }), 400

        conn.execute(
            "UPDATE users SET is_verified = 1, verification_code = NULL, verification_expires_at = NULL WHERE id = ?",
            (user["id"],),
        )
        token = create_session(conn, user["id"])
        refreshed = conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Email verified successfully.",
            "token": token,
            "user": {
                "id": refreshed["id"],
                "name": refreshed["name"],
                "email": refreshed["email"],
                "company": refreshed["company"],
                "is_verified": True,
            },
        })
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@auth_bp.route("/auth/resend-code", methods=["POST", "OPTIONS"])
def resend_code():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    try:
        data = request.json or {}
        email = (data.get("email") or "").strip().lower()
        if not email:
            return jsonify({"success": False, "error": "Email is required."}), 400

        conn = get_db()
        user = conn.execute("SELECT * FROM users WHERE lower(email) = lower(?)", (email,)).fetchone()
        if not user:
            conn.close()
            return jsonify({"success": False, "error": "No account found with this email."}), 404
        if int(user["is_verified"] or 0) == 1:
            conn.close()
            return jsonify({"success": False, "error": "This account is already verified. Please sign in."}), 409

        otp = generate_otp_code()
        expires_at = (datetime.utcnow() + timedelta(minutes=10)).isoformat()
        conn.execute(
            "UPDATE users SET verification_code = ?, verification_expires_at = ? WHERE id = ?",
            (otp, expires_at, user["id"])
        )
        conn.commit()
        conn.close()

        sent = send_verification_email(email, user["name"], otp)
        response = {"success": True, "message": f"A new verification code has been sent to {email}."}
        if not sent and not os.environ.get("RENDER"):
            response["verification_code"] = otp
        if not sent and os.environ.get("RENDER"):
            return jsonify({"success": False, "error": "Email delivery is not configured on the server."}), 503
        return jsonify(response)
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@auth_bp.route("/auth/forgot-password", methods=["POST", "OPTIONS"])
def forgot_password():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    try:
        data = request.json or {}
        email = (data.get("email") or "").strip().lower()
        if not email:
            return jsonify({"success": False, "error": "Email is required."}), 400

        conn = get_db()
        user = conn.execute(
            "SELECT * FROM users WHERE lower(email) = lower(?) LIMIT 1",
            (email,),
        ).fetchone()

        # Generic response prevents account enumeration.
        generic = {
            "success": True,
            "message": "If an AEGIS account exists for this email, a password reset code has been sent."
        }

        if not user:
            conn.close()
            return jsonify(generic)

        code = generate_otp_code()
        expires_at = (datetime.utcnow() + timedelta(minutes=10)).isoformat()
        conn.execute(
            "UPDATE users SET password_reset_code = ?, password_reset_expires_at = ? WHERE id = ?",
            (code, expires_at, user["id"]),
        )
        conn.commit()

        sent = send_password_reset_email(email, user["name"], code)
        if not sent:
            conn.execute(
                "UPDATE users SET password_reset_code = NULL, password_reset_expires_at = NULL WHERE id = ?",
                (user["id"],),
            )
            conn.commit()
            conn.close()
            return jsonify({
                "success": False,
                "error": "We could not send the password reset email. Please try again shortly."
            }), 503

        conn.close()
        return jsonify(generic)
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@auth_bp.route("/auth/reset-password", methods=["POST", "OPTIONS"])
def reset_password():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    try:
        data = request.json or {}
        email = (data.get("email") or "").strip().lower()
        code = (data.get("code") or "").strip()
        new_password = data.get("new_password") or ""

        if not email or not code or not new_password:
            return jsonify({
                "success": False,
                "error": "Email, reset code, and new password are required."
            }), 400
        if len(new_password) < 8:
            return jsonify({
                "success": False,
                "error": "Password must be at least 8 characters."
            }), 400

        conn = get_db()
        user = conn.execute(
            "SELECT * FROM users WHERE lower(email) = lower(?) LIMIT 1",
            (email,),
        ).fetchone()

        if not user:
            conn.close()
            return jsonify({"success": False, "error": "Invalid or expired reset code."}), 400

        expires_at = user["password_reset_expires_at"]
        if (
            not user["password_reset_code"]
            or not secrets.compare_digest(str(user["password_reset_code"]), code)
            or not expires_at
            or datetime.utcnow() > datetime.fromisoformat(expires_at)
        ):
            conn.close()
            return jsonify({"success": False, "error": "Invalid or expired reset code."}), 400

        conn.execute(
            """
            UPDATE users
            SET password_hash = ?, password_reset_code = NULL, password_reset_expires_at = NULL
            WHERE id = ?
            """,
            (hash_password(new_password), user["id"]),
        )
        # Sign out every existing device/session after a password change.
        conn.execute("DELETE FROM sessions WHERE user_id = ?", (user["id"],))
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Password reset successfully. You can now sign in with your new password."
        })
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@auth_bp.route("/auth/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    try:
        data = request.json or {}
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not email or not password:
            return jsonify({"success": False, "error": "Email and password are required."}), 400

        conn = get_db()
        user = conn.execute("SELECT * FROM users WHERE lower(email) = lower(?)", (email,)).fetchone()

        if not user or not verify_password(user["password_hash"], password):
            conn.close()
            return jsonify({"success": False, "error": "Invalid email or password."}), 401

        if len(user["password_hash"]) == 64:
            conn.execute(
                "UPDATE users SET password_hash = ? WHERE id = ?",
                (hash_password(password), user["id"]),
            )
            conn.commit()

        if not user["sensor_token"]:
            conn.execute(
                "UPDATE users SET sensor_token = ? WHERE id = ?",
                (secrets.token_urlsafe(32), user["id"]),
            )
            conn.commit()
            user = conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()

        if int(user["is_verified"] or 0) != 1:
            conn.close()
            return jsonify({
                "success": False,
                "error": "Please verify your email before signing in.",
                "requires_verification": True,
                "email": email,
            }), 403

        token = create_session(conn, user["id"])
        conn.close()
        return jsonify({
            "success": True,
            "message": "Successfully authenticated.",
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "company": user["company"],
                "is_verified": True,
            },
        })
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@auth_bp.route("/auth/me", methods=["GET", "OPTIONS"])
def me():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    user = get_authenticated_user()
    if not user:
        return jsonify({"success": False, "error": "Not authenticated."}), 401

    return jsonify({
        "success": True,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "company": user["company"],
            "is_verified": bool(user["is_verified"]),
        },
    })


@auth_bp.route("/auth/logout", methods=["POST", "OPTIONS"])
def logout():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    token = _read_bearer_token()
    if token:
        conn = get_db()
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        conn.close()
    return jsonify({"success": True, "message": "Signed out."})


@auth_bp.route("/auth/sensor-config", methods=["GET", "POST", "OPTIONS"])
def sensor_config():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    user, error = require_authenticated_user()
    if error:
        return error

    conn = get_db()
    current = conn.execute("SELECT sensor_token FROM users WHERE id = ?", (user["id"],)).fetchone()
    token = current["sensor_token"] if current else None

    if request.method == "POST" or not token:
        token = secrets.token_urlsafe(32)
        conn.execute("UPDATE users SET sensor_token = ? WHERE id = ?", (token, user["id"]))
        conn.commit()

    conn.close()
    return jsonify({
        "success": True,
        "sensor_token": token,
        "api_url": request.host_url.rstrip("/") + "/api",
    })


@auth_bp.route("/auth/delete-account", methods=["POST", "OPTIONS"])
def delete_account():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    user, error = require_authenticated_user()
    if error:
        return error

    conn = get_db()
    conn.execute("DELETE FROM sessions WHERE user_id = ?", (user["id"],))
    conn.execute("DELETE FROM heuristic_alerts WHERE user_id = ?", (user["id"],))
    conn.execute("DELETE FROM predictions WHERE user_id = ?", (user["id"],))
    conn.execute("DELETE FROM users WHERE id = ?", (user["id"],))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Account deleted."})
