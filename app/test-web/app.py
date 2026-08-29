import time
from datetime import datetime

from flask import Flask, jsonify, request

app = Flask(__name__)


# ============================================================
# REQUEST LOGGING
# ============================================================
# Logs every incoming request with a timestamp so you can
# line these up against the IDS's own prediction timestamps
# when reviewing results.
# ============================================================

@app.before_request
def log_request():
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    print(f"[{timestamp}] {request.method} {request.path} from {request.remote_addr}")


# ============================================================
# ROUTES
# ============================================================

@app.route("/")
def home():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>IDS Test Web Application</title>
    </head>
    <body>
        <h1>IDS Test Web Application</h1>
        <p>This application is used for controlled intrusion-detection testing.</p>

        <h2>Available Test Endpoints</h2>

        <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/login">Login</a></li>
            <li><a href="/products">Products</a></li>
            <li><a href="/api/data">API Data</a></li>
            <li><a href="/search?q=test">Search</a></li>
            <li><a href="/slow">Slow endpoint</a></li>
        </ul>
    </body>
    </html>
    """


@app.route("/login", methods=["GET", "POST"])
def login():
    return jsonify({
        "page": "login",
        "status": "available"
    })


@app.route("/products")
def products():
    return jsonify({
        "products": [
            "Product A",
            "Product B",
            "Product C"
        ]
    })


@app.route("/api/data")
def api_data():
    return jsonify({
        "status": "success",
        "message": "Test API endpoint"
    })


@app.route("/search")
def search():
    query = request.args.get("q", "")
    return jsonify({
        "query": query,
        "results": []
    })


@app.route("/slow")
def slow():
    """
    Deliberately delayed endpoint — useful for generating
    longer-lived flows to see how the IDS handles active
    connections that stay open for a while, as opposed to
    the quick request/response cycles of the other routes.
    """
    time.sleep(3)
    return jsonify({
        "status": "done",
        "delayed_seconds": 3
    })


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=8000,
        debug=False,
        # Threaded so the server can handle multiple concurrent
        # connections at once. Without this, a flood/burst test
        # (e.g. hping3, many rapid curl requests) will just queue
        # up one at a time on the dev server, which doesn't
        # produce realistic flow patterns for the IDS to observe.
        threaded=True
    )