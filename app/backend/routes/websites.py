import re
from datetime import datetime
import requests
from flask import Blueprint, jsonify, request

from routes.auth import require_authenticated_user
from utils.database import get_db

websites_bp = Blueprint("websites", __name__)


def _normalize_domain(value):
    value = (value or "").strip()
    value = re.sub(r"^https?://", "", value, flags=re.I)
    value = value.split("/")[0].strip().lower()
    return value


def _serialize(row):
    return {
        "id": row["id"],
        "domain": row["domain"],
        "label": row["label"] or row["domain"],
        "status": row["status"],
        "http_status": row["http_status"],
        "last_checked_at": row["last_checked_at"],
        "created_at": row["created_at"],
        "monitoring_state": "awaiting_gateway" if row["status"] == "verified" else "not_connected",
    }


@websites_bp.route("/websites", methods=["GET", "POST", "OPTIONS"])
def websites():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    user, error = require_authenticated_user()
    if error:
        return error

    db = get_db()
    try:
        if request.method == "GET":
            rows = db.execute(
                "SELECT * FROM monitored_websites WHERE user_id = ? ORDER BY id DESC",
                (user["id"],),
            ).fetchall()
            return jsonify({"success": True, "websites": [_serialize(r) for r in rows]})

        data = request.json or {}
        domain = _normalize_domain(data.get("domain"))
        label = (data.get("label") or "").strip()

        if not domain or "." not in domain and domain not in {"localhost"}:
            return jsonify({"success": False, "error": "Enter a valid website domain."}), 400

        created = datetime.utcnow().isoformat()
        try:
            db.execute(
                """
                INSERT INTO monitored_websites (user_id, domain, label, status, created_at)
                VALUES (?, ?, ?, 'pending', ?)
                """,
                (user["id"], domain, label or domain, created),
            )
            db.commit()
        except Exception as exc:
            db.rollback()
            if "unique" in str(exc).lower() or "duplicate" in str(exc).lower():
                return jsonify({"success": False, "error": "This website is already in your workspace."}), 409
            raise

        row = db.execute(
            "SELECT * FROM monitored_websites WHERE user_id = ? AND domain = ?",
            (user["id"], domain),
        ).fetchone()
        return jsonify({"success": True, "website": _serialize(row)}), 201
    finally:
        db.close()


@websites_bp.route("/websites/<int:website_id>/connect", methods=["POST", "OPTIONS"])
def connect_website(website_id):
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    user, error = require_authenticated_user()
    if error:
        return error

    db = get_db()
    try:
        row = db.execute(
            "SELECT * FROM monitored_websites WHERE id = ? AND user_id = ?",
            (website_id, user["id"]),
        ).fetchone()
        if not row:
            return jsonify({"success": False, "error": "Website not found."}), 404

        domain = row["domain"]
        checked_at = datetime.utcnow().isoformat()
        last_error = None
        response = None

        candidates = [f"https://{domain}", f"http://{domain}"]
        if domain.startswith("localhost"):
            candidates = [f"http://{domain}"]

        for url in candidates:
            try:
                response = requests.get(
                    url,
                    timeout=10,
                    allow_redirects=True,
                    headers={"User-Agent": "AEGIS-Monitor/1.0"},
                )
                break
            except Exception as exc:
                last_error = str(exc)

        if response is None:
            db.execute(
                "UPDATE monitored_websites SET status = 'unreachable', http_status = NULL, last_checked_at = ? WHERE id = ?",
                (checked_at, website_id),
            )
            db.commit()
            return jsonify({
                "success": False,
                "error": "AEGIS could not reach this website from the hosted monitoring service.",
                "details": last_error,
            }), 422

        db.execute(
            "UPDATE monitored_websites SET status = 'verified', http_status = ?, last_checked_at = ? WHERE id = ?",
            (int(response.status_code), checked_at, website_id),
        )
        db.commit()

        updated = db.execute(
            "SELECT * FROM monitored_websites WHERE id = ? AND user_id = ?",
            (website_id, user["id"]),
        ).fetchone()

        return jsonify({
            "success": True,
            "website": _serialize(updated),
            "reachable": True,
            "message": "Website verified and reachable from AEGIS.",
            "next_step": "Traffic monitoring requires the AEGIS gateway/integration to be configured for this site.",
        })
    finally:
        db.close()


@websites_bp.route("/websites/<int:website_id>", methods=["DELETE", "OPTIONS"])
def delete_website(website_id):
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    user, error = require_authenticated_user()
    if error:
        return error

    db = get_db()
    try:
        cur = db.execute(
            "DELETE FROM monitored_websites WHERE id = ? AND user_id = ?",
            (website_id, user["id"]),
        )
        db.commit()
        if cur.rowcount == 0:
            return jsonify({"success": False, "error": "Website not found."}), 404
        return jsonify({"success": True})
    finally:
        db.close()
