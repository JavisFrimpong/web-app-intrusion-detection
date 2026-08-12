from flask import Flask, jsonify

app = Flask(__name__)


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
        </ul>
    </body>
    </html>
    """


@app.route("/login")
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


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=8000,
        debug=False
    )