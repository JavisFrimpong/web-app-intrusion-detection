import re
import secrets
from datetime import datetime
import requests
from flask import Blueprint, jsonify, request, Response
from flask_cors import cross_origin

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
        "last_event_at": row["last_event_at"],
        "site_key": row["site_key"],
        "created_at": row["created_at"],
        "monitoring_state": "active" if row["last_event_at"] else ("ready" if row["status"] == "verified" else "not_connected"),
    }


def _classify_event(path, event_type):
    text = (path or "").lower()

    patterns = [
        ("SQL Injection", [r"union\s+select", r"or\s+1=1", r"sleep\s*\(", r"information_schema", r"drop\s+table"]),
        ("Cross-Site Scripting", [r"<script", r"javascript:", r"onerror\s*=", r"onload\s*="]),
        ("Path Traversal", [r"\.\./", r"%2e%2e", r"/etc/passwd", r"windows/win.ini"]),
        ("Command Injection", [r";\s*(curl|wget|bash|sh)\b", r"\|\s*(curl|wget|bash|sh)\b"]),
        ("Reconnaissance", [r"/\.env", r"/wp-admin", r"/phpmyadmin", r"/\.git", r"/server-status"]),
    ]
    for label, regexes in patterns:
        if any(re.search(rx, text, flags=re.I) for rx in regexes):
            return 1, label, 0.96

    if event_type in {"error", "failed_request"}:
        return 1, "Application Error / Failed Request", 0.78

    return 0, "BENIGN", 0.99


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

        if not domain or ("." not in domain and domain != "localhost"):
            return jsonify({"success": False, "error": "Enter a valid website domain."}), 400

        created = datetime.utcnow().isoformat()
        site_key = secrets.token_urlsafe(24)

        try:
            db.execute(
                """
                INSERT INTO monitored_websites (user_id, domain, label, status, site_key, created_at)
                VALUES (?, ?, ?, 'pending', ?, ?)
                """,
                (user["id"], domain, label or domain, site_key, created),
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

        site_key = row["site_key"] or secrets.token_urlsafe(24)
        db.execute(
            "UPDATE monitored_websites SET status = 'verified', http_status = ?, last_checked_at = ?, site_key = ? WHERE id = ?",
            (int(response.status_code), checked_at, site_key, website_id),
        )
        db.commit()

        updated = db.execute(
            "SELECT * FROM monitored_websites WHERE id = ? AND user_id = ?",
            (website_id, user["id"]),
        ).fetchone()

        script_url = f"https://aegis-ids-api.onrender.com/api/sdk/aegis.js?site={site_key}"
        snippet = f'<script async src="{script_url}"></script>'

        return jsonify({
            "success": True,
            "website": _serialize(updated),
            "reachable": True,
            "message": "Website verified and reachable from AEGIS.",
            "script_url": script_url,
            "snippet": snippet,
            "next_step": "Add the monitoring snippet to the website before </head> or before </body>.",
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


@websites_bp.route("/sdk/aegis.js", methods=["GET", "OPTIONS"])
@cross_origin(origins="*")
def sdk():
    if request.method == "OPTIONS":
        return Response("", status=204)

    site_key = (request.args.get("site") or "").strip()
    domain = _normalize_domain(request.args.get("domain"))

    if not site_key and domain:
        db = get_db()
        try:
            row = db.execute(
                "SELECT * FROM monitored_websites WHERE domain = ? ORDER BY id DESC LIMIT 1",
                (domain,),
            ).fetchone()
            if row:
                site_key = row["site_key"] or secrets.token_urlsafe(24)
                if not row["site_key"]:
                    db.execute(
                        "UPDATE monitored_websites SET site_key = ? WHERE id = ?",
                        (site_key, row["id"]),
                    )
                    db.commit()
        finally:
            db.close()

    if not site_key:
        return Response("console.warn('AEGIS: monitored website not found');", mimetype="application/javascript")

    js = f"""
(function() {{
  if (window.__AEGIS_MONITOR_LOADED__) return;
  window.__AEGIS_MONITOR_LOADED__ = true;

  var ENDPOINT = 'https://aegis-ids-api.onrender.com/api/telemetry/{site_key}';
  var originalFetch = window.fetch ? window.fetch.bind(window) : null;
  var originalOpen = XMLHttpRequest.prototype.open;
  var originalSend = XMLHttpRequest.prototype.send;

  function send(type, details) {{
    try {{
      var payload = {{
        event_type: type,
        path: location.pathname + location.search,
        page_url: location.href,
        referrer: document.referrer || '',
        method: details && details.method || 'GET',
        request_url: details && details.url || location.href,
        status: details && details.status || null,
        duration_ms: details && details.duration_ms || null,
        user_agent: navigator.userAgent,
        ts: new Date().toISOString()
      }};
      if (navigator.sendBeacon) {{
        navigator.sendBeacon(ENDPOINT, new Blob([JSON.stringify(payload)], {{type:'application/json'}}));
      }} else if (originalFetch) {{
        originalFetch(ENDPOINT, {{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify(payload),keepalive:true,mode:'cors'}}).catch(function(){{}});
      }}
    }} catch(e) {{}}
  }}

  send('pageview', {{url: location.href, method: 'GET'}});

  if (originalFetch) {{
    window.fetch = function(input, init) {{
      var start = performance.now();
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var method = (init && init.method) || (input && input.method) || 'GET';
      return originalFetch(input, init).then(function(resp) {{
        if (String(url).indexOf('aegis-ids-api.onrender.com/api/telemetry/') === -1) {{
          send(resp.ok ? 'request' : 'failed_request', {{url:url,method:method,status:resp.status,duration_ms:Math.round(performance.now()-start)}});
        }}
        return resp;
      }}).catch(function(err) {{
        if (String(url).indexOf('aegis-ids-api.onrender.com/api/telemetry/') === -1) {{
          send('failed_request', {{url:url,method:method,status:0,duration_ms:Math.round(performance.now()-start)}});
        }}
        throw err;
      }});
    }};
  }}

  XMLHttpRequest.prototype.open = function(method, url) {{
    this.__aegis_method = method || 'GET';
    this.__aegis_url = url || '';
    return originalOpen.apply(this, arguments);
  }};
  XMLHttpRequest.prototype.send = function() {{
    var xhr = this;
    var start = performance.now();
    var url = String(xhr.__aegis_url || '');
    if (url.indexOf('aegis-ids-api.onrender.com/api/telemetry/') === -1) {{
      xhr.addEventListener('loadend', function() {{
        send(xhr.status >= 400 ? 'failed_request' : 'request', {{url:url,method:xhr.__aegis_method,status:xhr.status,duration_ms:Math.round(performance.now()-start)}});
      }});
    }}
    return originalSend.apply(this, arguments);
  }};

  window.addEventListener('error', function(ev) {{
    send('error', {{url: ev.filename || location.href, method:'JS', status:0}});
  }});

  window.addEventListener('unhandledrejection', function() {{
    send('error', {{url: location.href, method:'PROMISE', status:0}});
  }});

  document.addEventListener('submit', function(ev) {{
    var form = ev.target;
    send('form_submit', {{url: form && form.action || location.href, method: form && form.method || 'POST'}});
  }}, true);

  var push = history.pushState;
  history.pushState = function() {{
    var result = push.apply(this, arguments);
    setTimeout(function() {{ send('pageview', {{url: location.href, method:'GET'}}); }}, 0);
    return result;
  }};
  window.addEventListener('popstate', function() {{ send('pageview', {{url: location.href, method:'GET'}}); }});
}})();
"""
    return Response(js, mimetype="application/javascript", headers={"Cache-Control": "public, max-age=300"})


@websites_bp.route("/telemetry/<site_key>", methods=["POST", "OPTIONS"])
@cross_origin(origins="*")
def telemetry(site_key):
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    db = get_db()
    try:
        site = db.execute(
            "SELECT * FROM monitored_websites WHERE site_key = ? LIMIT 1",
            (site_key,),
        ).fetchone()
        if not site:
            return jsonify({"success": False, "error": "Unknown site key."}), 404

        data = request.get_json(silent=True) or {}
        event_type = (data.get("event_type") or "request")[:64]
        request_url = (data.get("request_url") or data.get("page_url") or data.get("path") or "")[:2000]
        method = (data.get("method") or "GET")[:16]
        status_code = data.get("status")
        duration_ms = data.get("duration_ms")
        now = datetime.utcnow().isoformat()

        pred, attack_type, confidence = _classify_event(request_url, event_type)

        source_ip = (
            request.headers.get("CF-Connecting-IP")
            or request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
            or request.remote_addr
            or "unknown"
        )

        packet_count = 1
        try:
            packet_count = max(1, int(duration_ms or 1))
        except Exception:
            packet_count = 1

        db.execute(
            """
            INSERT INTO predictions (
                user_id, prediction, attack_type, confidence, timestamp,
                source_ip, source_port, destination_ip, destination_port, packet_count
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                site["user_id"], pred, attack_type, confidence, now,
                source_ip, 0, site["domain"], 443, packet_count,
            ),
        )

        if pred != 0:
            message = f"{attack_type} pattern observed on {site['domain']} via {method} {request_url[:220]}"
            db.execute(
                """
                INSERT INTO heuristic_alerts (user_id, alert_type, message, timestamp, source_ip)
                VALUES (?, ?, ?, ?, ?)
                """,
                (site["user_id"], attack_type, message, now, source_ip),
            )

        db.execute(
            "UPDATE monitored_websites SET status = 'monitoring', last_event_at = ? WHERE id = ?",
            (now, site["id"]),
        )
        db.commit()

        return jsonify({"success": True, "classification": attack_type, "suspicious": bool(pred)})
    finally:
        db.close()
