import os
import platform
import signal
import socket
import subprocess
import sys
import time
import urllib.parse

import psutil
import requests

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CAPTURE_SCRIPT = os.path.join(BASE_DIR, "flow_capture.py")

API_URL = (os.environ.get("AEGIS_API_URL") or "").rstrip("/")
SENSOR_TOKEN = os.environ.get("AEGIS_SENSOR_TOKEN") or ""
SENSOR_ID = os.environ.get("AEGIS_SENSOR_ID") or socket.gethostname()
POLL_SECONDS = 2.0

if not API_URL:
    raise SystemExit(
        "AEGIS_API_URL is required. Example: "
        "set AEGIS_API_URL=https://your-flask-service.onrender.com"
    )


def headers():
    result = {"Content-Type": "application/json"}
    if SENSOR_TOKEN:
        result["X-Aegis-Sensor-Token"] = SENSOR_TOKEN
    return result


def active_interfaces():
    names = []
    for name, stats in psutil.net_if_stats().items():
        if stats.isup:
            names.append(name)
    return names


def clean_target(raw_target):
    target = (raw_target or "").strip()
    if not target:
        return None, None
    if "://" not in target:
        parsed = urllib.parse.urlparse("https://" + target)
    else:
        parsed = urllib.parse.urlparse(target)
    host = parsed.hostname or target
    return host, socket.gethostbyname(host)


def stop_capture(proc):
    if proc is None or proc.poll() is not None:
        return None
    try:
        if os.name == "nt":
            proc.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            proc.send_signal(signal.SIGINT)
        proc.wait(timeout=15)
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass
    return None


def start_capture(target, user_id):
    host, target_ip = clean_target(target)
    if not target_ip:
        raise RuntimeError("A valid monitoring target is required.")

    creationflags = 0
    if os.name == "nt":
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP

    env = dict(os.environ)
    env["AEGIS_API_URL"] = API_URL
    if SENSOR_TOKEN:
        env["AEGIS_SENSOR_TOKEN"] = SENSOR_TOKEN
    env["AEGIS_USER_ID"] = str(user_id)

    proc = subprocess.Popen(
        [sys.executable, CAPTURE_SCRIPT, "--target-ip", target_ip],
        cwd=BASE_DIR,
        env=env,
        creationflags=creationflags,
    )
    return proc, host, target_ip


def heartbeat(proc, target, target_ip, user_id):
    running = proc is not None and proc.poll() is None
    payload = {
        "sensor_id": SENSOR_ID,
        "hostname": socket.gethostname(),
        "platform": platform.platform(),
        "interfaces": active_interfaces(),
        "running": running,
        "target": target if running else None,
        "target_ip": target_ip if running else None,
        "user_id": user_id if running else None,
    }
    response = requests.post(
        f"{API_URL}/api/sensor/heartbeat",
        json=payload,
        headers=headers(),
        timeout=10,
    )
    response.raise_for_status()


def get_command(after):
    response = requests.get(
        f"{API_URL}/api/sensor/command",
        params={"after": after},
        headers=headers(),
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def main():
    print("=" * 68)
    print("AEGIS WINDOWS PACKET SENSOR")
    print("=" * 68)
    print("Sensor ID:", SENSOR_ID)
    print("API:", API_URL)
    print("Run this terminal as Administrator so Npcap can capture packets.")
    print()

    proc = None
    target = None
    target_ip = None
    active_user_id = None
    last_command_id = 0
    last_heartbeat = 0.0

    try:
        while True:
            now = time.time()

            if proc is not None and proc.poll() is not None:
                print("Capture process exited with code", proc.returncode)
                proc = None
                target = None
                target_ip = None

            if now - last_heartbeat >= 4:
                try:
                    heartbeat(proc, target, target_ip, active_user_id)
                    last_heartbeat = now
                except Exception as exc:
                    print("Heartbeat failed:", exc)

            try:
                payload = get_command(last_command_id)
                command_id = int(payload.get("command_id") or last_command_id)
                command = payload.get("command")

                if command and command_id > last_command_id:
                    last_command_id = command_id

                    if command == "start":
                        requested_target = payload.get("target")
                        requested_user_id = payload.get("user_id")
                        if requested_user_id is None:
                            raise RuntimeError("Start command did not include a user account.")
                        proc = stop_capture(proc)
                        print("Starting monitoring for:", requested_target, "account:", requested_user_id)
                        proc, target, target_ip = start_capture(requested_target, requested_user_id)
                        active_user_id = int(requested_user_id)
                        print("Monitoring target IP:", target_ip)

                    elif command == "stop":
                        print("Stopping monitoring...")
                        proc = stop_capture(proc)
                        target = None
                        target_ip = None
                        active_user_id = None
                        print("Monitoring stopped.")

            except Exception as exc:
                print("Command poll failed:", exc)

            time.sleep(POLL_SECONDS)

    except KeyboardInterrupt:
        print("\nStopping AEGIS Sensor...")
    finally:
        stop_capture(proc)
        try:
            heartbeat(None, None, None, None)
        except Exception:
            pass


if __name__ == "__main__":
    main()
