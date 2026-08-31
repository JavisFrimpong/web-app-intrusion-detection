"""
Controlled flood test for local IDS validation.

Sends a high volume of rapid concurrent requests to a LOCAL
target you control, to generate DDoS-style flow patterns
(high packets/sec, many short-lived connections, abnormal
SYN ratios) for your IDS to observe.

ONLY use this against systems you own or have explicit
permission to test (e.g. your own localhost Flask app).
"""

import argparse
import threading
import time

import requests


def flood_worker(target_url, stop_time, stats, lock):

    # Deliberately NOT using a shared requests.Session() here.
    # A session reuses one persistent TCP connection (HTTP
    # keep-alive) across all its requests — great for normal
    # traffic, but it means a flood of requests doesn't
    # translate into a flood of new connections, which is what
    # an IDS's flow-based/connection-based detection actually
    # needs to see. Forcing "Connection: close" makes every
    # request open (and close) its own TCP flow.

    headers = {"Connection": "close"}

    while time.time() < stop_time:

        try:
            requests.get(target_url, headers=headers, timeout=1)

            with lock:
                stats["success"] += 1

        except Exception:

            with lock:
                stats["failed"] += 1


def run_flood(target_url, duration_seconds, num_threads):

    print("=" * 70)
    print("CONTROLLED FLOOD TEST")
    print("=" * 70)
    print("Target:", target_url)
    print("Duration:", duration_seconds, "seconds")
    print("Concurrent threads:", num_threads)
    print("=" * 70)
    print()
    print("Starting in 3 seconds — make sure flow_capture.py is running...")
    time.sleep(3)

    stats = {"success": 0, "failed": 0}
    lock = threading.Lock()

    stop_time = time.time() + duration_seconds

    threads = []

    for _ in range(num_threads):
        thread = threading.Thread(
            target=flood_worker,
            args=(target_url, stop_time, stats, lock)
        )
        thread.start()
        threads.append(thread)

    start = time.time()

    try:
        while time.time() < stop_time:
            elapsed = time.time() - start
            with lock:
                print(
                    f"\rElapsed: {elapsed:5.1f}s | "
                    f"Success: {stats['success']:6d} | "
                    f"Failed: {stats['failed']:6d} | "
                    f"Req/sec: {stats['success'] / max(elapsed, 0.01):7.1f}",
                    end=""
                )
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nStopped early by user.")

    for thread in threads:
        thread.join(timeout=2)

    print()
    print()
    print("=" * 70)
    print("FLOOD TEST COMPLETE")
    print("=" * 70)
    print("Total successful requests:", stats["success"])
    print("Total failed requests:", stats["failed"])
    print("Actual duration:", round(time.time() - start, 2), "seconds")
    print("Average req/sec:", round(stats["success"] / (time.time() - start), 1))


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description="Controlled flood test for local IDS validation."
    )

    parser.add_argument(
        "--target",
        default="http://127.0.0.1:8000/",
        help="Target URL (default: http://127.0.0.1:8000/)"
    )

    parser.add_argument(
        "--duration",
        type=int,
        default=15,
        help="Duration in seconds (default: 15)"
    )

    parser.add_argument(
        "--threads",
        type=int,
        default=50,
        help="Number of concurrent threads (default: 50)"
    )

    args = parser.parse_args()

    run_flood(args.target, args.duration, args.threads)
