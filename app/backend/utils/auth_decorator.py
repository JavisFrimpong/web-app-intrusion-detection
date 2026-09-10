from functools import wraps
from flask import session, jsonify


def login_required(view_func):
    """
    Guards a route so it only responds to requests carrying a valid,
    logged-in session cookie. Apply this to every route that reads or
    changes real data (history, stats, monitor start/stop, clearing the
    database) — without it, anyone who can reach the API could do those
    things with no login at all.
    """
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if not session.get("user_email"):
            return jsonify({"success": False, "error": "Authentication required."}), 401
        return view_func(*args, **kwargs)
    return wrapped
