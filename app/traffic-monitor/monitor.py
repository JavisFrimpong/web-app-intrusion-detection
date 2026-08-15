import requests
import time


TARGET = "http://127.0.0.1:8000"


def generate_normal_traffic():
    endpoints = [
        "/",
        "/login",
        "/products",
        "/api/data"
    ]

    print("\nGenerating normal traffic...\n")

    for endpoint in endpoints:
        url = TARGET + endpoint

        try:
            response = requests.get(url, timeout=5)

            print(
                f"GET {endpoint:<15} "
                f"Status: {response.status_code} "
                f"Size: {len(response.content)} bytes"
            )

        except requests.RequestException as error:
            print(f"Request failed: {error}")

        time.sleep(1)


if __name__ == "__main__":
    generate_normal_traffic()