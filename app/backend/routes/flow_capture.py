import os
import signal
import time
from collections import defaultdict, deque
from datetime import datetime

import psutil

from scapy.all import (
    sniff,
    IP,
    TCP,
    get_if_list,
    get_if_addr
)

from feature_extractor import extract_features
from predictor import predict_flow
from prediction_store import update_prediction, insert_heuristic_alert


# ============================================================
# CONFIGURATION
# ============================================================

LOOPBACK_INTERFACE = r"\Device\NPF_Loopback"
CAPTURE_FILTER = "tcp"

# How long to sniff in each short burst before checking for
# expired flows. This is NOT a flow window — it's just how
# often we come up for air to check timeouts. Flows persist
# across many of these bursts.
POLL_INTERVAL = 2

# CICFlowMeter defaults: a flow is closed when idle for this
# long (no packets seen), or when it has been active this long
# even if still ongoing (forces long-lived flows to be
# evaluated instead of waiting forever).
IDLE_TIMEOUT = 120
ACTIVE_TIMEOUT_MAX = 120

# Allow single-packet flows because SYN-based PortScan traffic
# may contain very few packets.
MIN_FLOW_PACKETS = 1

# Runs until explicitly stopped (Ctrl+C locally, or the Stop
# button in the web dashboard, which sends CTRL_BREAK_EVENT ->
# SIGBREAK -> KeyboardInterrupt on Windows, see handler below).
TOTAL_DURATION = float("inf")


# ============================================================
# GRACEFUL STOP HANDLING (Windows)
# ============================================================
# CTRL_BREAK_EVENT does NOT raise KeyboardInterrupt by default on
# Windows (unlike CTRL_C_EVENT) — it just kills the process outright,
# skipping the flow-flushing cleanup below. Registering this handler
# makes it behave like Ctrl+C, so the existing `except KeyboardInterrupt`
# block in start_monitoring() still runs and any open flows get
# evaluated before exit. This is what lets the web dashboard's Stop
# button shut this down cleanly instead of hard-killing it.
# ============================================================

def _handle_stop_signal(signum, frame):
    raise KeyboardInterrupt

if os.name == "nt":
    signal.signal(signal.SIGBREAK, _handle_stop_signal)


# ============================================================
# TCP FLAG MASKS
# ============================================================

FIN = 0x01
SYN = 0x02
RST = 0x04
TCP_ACK_FLAG = 0x10


def has_flag(packet, flag):
    try:
        return bool(packet[TCP].flags & flag)
    except Exception:
        return False


# ============================================================
# FIND ACTIVE NETWORK INTERFACE
# ============================================================

def get_active_interface():

    active_ips = set()

    for interface_name, addresses in psutil.net_if_addrs().items():
        for address in addresses:
            if address.family.name != "AF_INET":
                continue
            ip = address.address
            if ip.startswith("127.") or ip.startswith("169.254."):
                continue
            active_ips.add(ip)

    for npcap_interface in get_if_list():

        if "NPF_Loopback" in npcap_interface:
            continue

        try:
            interface_ip = get_if_addr(npcap_interface)

            if interface_ip in active_ips:
                print("Active network interface detected:")
                print("  Npcap:", npcap_interface)
                print("  IPv4:", interface_ip)
                return npcap_interface

        except Exception:
            continue

    return None


def get_capture_interfaces():

    interfaces = [LOOPBACK_INTERFACE]
    print("Loopback interface:", LOOPBACK_INTERFACE)

    network_interface = get_active_interface()

    if network_interface:
        interfaces.append(network_interface)
    else:
        print("WARNING: Could not automatically detect an active network interface.")

    return list(dict.fromkeys(interfaces))


# ============================================================
# FLOW KEY
# ============================================================

def get_flow_key(packet):

    if not packet.haslayer(IP) or not packet.haslayer(TCP):
        return None

    src_ip = packet[IP].src
    dst_ip = packet[IP].dst
    src_port = int(packet[TCP].sport)
    dst_port = int(packet[TCP].dport)
    protocol = int(packet[IP].proto)

    endpoint_a = (src_ip, src_port)
    endpoint_b = (dst_ip, dst_port)

    if endpoint_a <= endpoint_b:
        first_endpoint, second_endpoint = endpoint_a, endpoint_b
    else:
        first_endpoint, second_endpoint = endpoint_b, endpoint_a

    return (first_endpoint, second_endpoint, protocol)


def get_flow_endpoints(packets):
    """
    Identify the true client (initiator) and server side of a
    flow using the SYN flag, not just packet arrival order.
    Returns (src_ip, src_port, dst_ip, dst_port, direction_confirmed).

    direction_confirmed is False when no pure SYN packet was
    captured for this flow (e.g. it started before capture began,
    or a packet was dropped during a busy processing window) —
    callers should treat the port values as best-effort only in
    that case, and should NOT feed them into port-based
    heuristics, since a guessed direction can misrepresent which
    side is the "destination port."
    """

    if not packets:
        return ("UNKNOWN", 0, "UNKNOWN", 0, False)

    packets = sorted(packets, key=lambda p: float(p.time) if hasattr(p, "time") else 0.0)

    for packet in packets:
        if has_flag(packet, SYN) and not has_flag(packet, TCP_ACK_FLAG):
            return (
                packet[IP].src,
                int(packet[TCP].sport),
                packet[IP].dst,
                int(packet[TCP].dport),
                True
            )

    first_packet = packets[0]

    return (
        first_packet[IP].src,
        int(first_packet[TCP].sport),
        first_packet[IP].dst,
        int(first_packet[TCP].dport),
        False
    )


# ============================================================
# CONFIDENCE / RARE-CLASS HANDLING
# ============================================================

# Minimum confidence before we trust a prediction outright.
# Below this, the model is essentially guessing between
# classes rather than recognizing a clear pattern.
CONFIDENCE_THRESHOLD = 70.0

# Classes with very few training samples are unreliable and
# can act as a "catch-all" for unfamiliar traffic. Flag them
# for extra scrutiny instead of reporting them at face value.
# Adjust this set based on your own training data's class
# support counts.
LOW_SUPPORT_CLASSES = {8, 13}


# ============================================================
# RATE-BASED HEURISTICS (catch what per-flow ML misses)
# ============================================================
# A single flow's own features can look completely normal
# even when it's part of a scan or flood — the giveaway is
# in the AGGREGATE pattern across many flows from the same
# source, which per-flow CICFlowMeter-style features can't
# capture on their own. These heuristics track that pattern
# and flag it independently of what the ML model decides.
# ============================================================

RATE_WINDOW_SECONDS = 5

# PortScan heuristic: many distinct destination ports from one
# source in a short window.
PORTSCAN_DISTINCT_PORT_THRESHOLD = 15

# DDoS heuristic: many completed flows from one source in a
# short window, regardless of how "clean" each one looks.
# Calibrated against this pipeline's own observed throughput
# (synchronous per-flow ML inference caps flow-closure rate
# well below raw request rate) rather than an idealized number —
# tune upward if you speed up the processing loop.
DDOS_FLOW_COUNT_THRESHOLD = 20

# source_ip -> deque of (timestamp, destination_ip, destination_port)
_source_activity = defaultdict(deque)


def record_flow_for_heuristics(source_ip, destination_ip, destination_port, timestamp):
    """
    Track recent flow activity per source IP so we can spot
    scan/flood patterns that span multiple flows. Old entries
    outside the rolling window are dropped automatically.
    """

    activity = _source_activity[source_ip]
    activity.append((timestamp, destination_ip, destination_port))

    cutoff = timestamp - RATE_WINDOW_SECONDS

    while activity and activity[0][0] < cutoff:
        activity.popleft()

    return activity


def check_rate_based_heuristics(source_ip, activity, direction_confirmed):
    """
    Inspect recent activity from this source and return a list
    of heuristic alerts triggered, if any. This runs alongside
    the ML model, not instead of it.
    """

    alerts = []

    # Port-scan detection needs a reliable destination port per
    # entry — skip it entirely for this call if the current
    # flow's direction wasn't confirmed, since one unreliable
    # entry already sitting in the window is enough noise; we
    # still evaluate using whatever confirmed entries exist.
    distinct_ports = {
        entry[2] for entry in activity if entry[2] is not None
    }
    if len(distinct_ports) >= PORTSCAN_DISTINCT_PORT_THRESHOLD:
        alerts.append({
            "type": "PORTSCAN",
            "message": (
                f"POSSIBLE PORTSCAN: {source_ip} touched "
                f"{len(distinct_ports)} distinct ports in the last "
                f"{RATE_WINDOW_SECONDS}s"
            )
        })

    if len(activity) >= DDOS_FLOW_COUNT_THRESHOLD:
        alerts.append({
            "type": "DDOS",
            "message": (
                f"POSSIBLE DDoS/FLOOD: {source_ip} generated "
                f"{len(activity)} flows in the last "
                f"{RATE_WINDOW_SECONDS}s"
            )
        })

    return alerts


# ============================================================
# HEURISTIC ALERT LOGGING
# ============================================================
# Stored in the same SQLite database as ML predictions
# (predictions.db, table: heuristic_alerts) — see
# prediction_store.py for the schema.
# ============================================================

def log_heuristic_alert(alert, source_ip, timestamp):

    try:
        insert_heuristic_alert(
            alert_type=alert["type"],
            message=alert["message"],
            source_ip=source_ip
        )
    except Exception as error:
        print("Heuristic alert logging failed:", f"{type(error).__name__}: {error}")


# ============================================================
# COMBINED VERDICT
# ============================================================
# Merges the per-flow ML result with any heuristic alerts that
# fired for this flow's source into a single final call. A
# heuristic alert takes priority over an uncertain/low-confidence
# ML result, since it reflects a pattern across many flows rather
# than one connection's features in isolation — exactly the
# "series of events" signal a single flow's ML classification
# cannot see on its own.
# ============================================================

def compute_combined_verdict(ml_result, ml_status, heuristic_alerts):

    if heuristic_alerts:
        alert_types = ", ".join(sorted({a["type"] for a in heuristic_alerts}))
        return f"{alert_types} (heuristic-confirmed pattern across multiple flows)"

    if ml_status == "CONFIDENT":
        return ml_result["attack_type"]

    return f"Uncertain (per-flow ML guess: {ml_result['attack_type']}, low confidence)"


def interpret_prediction(result):
    """
    Wrap a raw model prediction with a trust label based on
    confidence and known low-support classes, without
    discarding the underlying prediction.
    """

    prediction = result["prediction"]
    confidence = result["confidence"]
    attack_type = result["attack_type"]

    if confidence < CONFIDENCE_THRESHOLD:
        status = "UNCERTAIN"
    elif prediction in LOW_SUPPORT_CLASSES:
        status = "LOW-SUPPORT CLASS (verify manually)"
    else:
        status = "CONFIDENT"

    return status


# ============================================================
# PROCESS AND CLOSE A SINGLE FLOW
# ============================================================

def close_flow(flow_key, flow_state, reason):

    packets = flow_state["packets"]

    if len(packets) < MIN_FLOW_PACKETS:
        return False

    source_ip, source_port, destination_ip, destination_port, direction_confirmed = get_flow_endpoints(packets)

    print()
    print("-" * 70)
    print(f"FLOW CLOSED ({reason})")
    print("-" * 70)
    print("Packets:", len(packets))
    print("Source:", f"{source_ip}:{source_port}")
    print("Destination:", f"{destination_ip}:{destination_port}")

    try:
        features = extract_features(packets)
    except Exception as error:
        print("Feature extraction failed:", f"{type(error).__name__}: {error}")
        return False

    if len(features) != 78:
        print("ERROR: Expected 78 features but received", len(features))
        return False

    try:
        result = predict_flow(features)
    except Exception as error:
        print("Prediction failed:", f"{type(error).__name__}: {error}")
        return False

    status = interpret_prediction(result)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print()
    print("Prediction:", result["attack_type"])
    print("Confidence:", f'{result["confidence"]}%')
    print("Trust status:", status)
    print("Timestamp:", timestamp)

    # ----------------------------------------------------
    # Rate-based heuristics (catches scan/flood patterns
    # that no single flow's features can reveal on its own)
    # ----------------------------------------------------
    # Only feed confirmed-direction flows into the port-scan
    # heuristic — an unconfirmed direction can misrepresent
    # which side is the "destination port," which would corrupt
    # the distinct-port count with guesses. The DDoS/flood
    # heuristic only cares about flow COUNT, not which side is
    # which, so it's safe to include every flow there regardless.

    if direction_confirmed:
        activity = record_flow_for_heuristics(
            source_ip, destination_ip, destination_port, time.time()
        )
    else:
        # Still count this flow toward the flood heuristic using
        # a neutral, already-tracked key, without touching the
        # (unreliable) destination port.
        activity = record_flow_for_heuristics(
            source_ip, destination_ip, None, time.time()
        )

    heuristic_alerts = check_rate_based_heuristics(
        source_ip, activity, direction_confirmed
    )

    for alert in heuristic_alerts:
        print("HEURISTIC ALERT:", alert["message"])
        log_heuristic_alert(alert, source_ip, timestamp)

    # ----------------------------------------------------
    # Combined verdict — merges ML's per-flow read with any
    # heuristic pattern detected across recent flows from this
    # source into one final call.
    # ----------------------------------------------------

    final_verdict = compute_combined_verdict(result, status, heuristic_alerts)
    print("FINAL VERDICT:", final_verdict)

    try:
        update_prediction(
            prediction=result["prediction"],
            attack_type=final_verdict,
            confidence=result["confidence"],
            source_ip=source_ip,
            source_port=source_port,
            destination_ip=destination_ip,
            destination_port=destination_port,
            packet_count=len(packets)
        )
        print("Prediction saved to database.")
    except Exception as error:
        print("Database storage failed:", f"{type(error).__name__}: {error}")
        return False

    return True


# ============================================================
# MAIN MONITORING LOOP
# ============================================================

def start_monitoring(target_ip=None):

    print()
    print("=" * 70)
    print("MACHINE LEARNING INTRUSION DETECTION SYSTEM")
    print("(continuous flow tracking mode)")
    print("=" * 70)

    interfaces = get_capture_interfaces()

    if not interfaces:
        print("ERROR: No capture interfaces available.")
        return

    # Scope capture to a single target if one was given (from the web
    # dashboard's "website address" field) — otherwise fall back to
    # watching everything on the detected interfaces, same as before.
    effective_filter = CAPTURE_FILTER
    if target_ip:
        effective_filter = f"tcp and host {target_ip}"
        print()
        print(f"Monitoring scoped to target: {target_ip}")
    else:
        print()
        print("No target set — monitoring ALL TCP traffic on the detected interfaces.")

    print()
    print("Idle timeout:", IDLE_TIMEOUT, "seconds")
    print("Max active duration before forced evaluation:", ACTIVE_TIMEOUT_MAX, "seconds")
    print("Total monitoring duration: until stopped (Ctrl+C / dashboard Stop button)")
    print()
    print("Press CTRL+C to stop early (any still-open flows will be evaluated on exit).")
    print("=" * 70)

    # flow_key -> {"packets": [...], "first_seen": ts, "last_seen": ts, "fin_or_rst": bool}
    active_flows = {}

    total_predictions = 0
    session_start = time.time()

    def collect_packet(packet):

        if not packet.haslayer(IP) or not packet.haslayer(TCP):
            return

        flow_key = get_flow_key(packet)
        if flow_key is None:
            return

        now = float(packet.time) if hasattr(packet, "time") else time.time()

        if flow_key not in active_flows:
            active_flows[flow_key] = {
                "packets": [],
                "first_seen": now,
                "last_seen": now,
                "fin_or_rst": False
            }

        state = active_flows[flow_key]
        state["packets"].append(packet)
        state["last_seen"] = now

        if has_flag(packet, FIN) or has_flag(packet, RST):
            state["fin_or_rst"] = True

    try:

        while (time.time() - session_start) < TOTAL_DURATION:

            sniff(
                iface=interfaces,
                filter=effective_filter,
                prn=collect_packet,
                store=False,
                timeout=POLL_INTERVAL
            )

            now = time.time()
            expired_keys = []

            for flow_key, state in active_flows.items():

                idle_time = now - state["last_seen"]
                active_time = now - state["first_seen"]

                if state["fin_or_rst"]:
                    reason = "FIN/RST observed"
                elif idle_time > IDLE_TIMEOUT:
                    reason = f"idle timeout ({IDLE_TIMEOUT}s)"
                elif active_time > ACTIVE_TIMEOUT_MAX:
                    reason = f"active timeout ({ACTIVE_TIMEOUT_MAX}s)"
                else:
                    continue

                if close_flow(flow_key, state, reason):
                    total_predictions += 1

                expired_keys.append(flow_key)

            for key in expired_keys:
                del active_flows[key]

    except KeyboardInterrupt:
        print()
        print("Interrupted — evaluating remaining open flows before exit...")

    # Flush any flows still open at the end of monitoring
    for flow_key, state in list(active_flows.items()):
        if close_flow(flow_key, state, "session ended"):
            total_predictions += 1

    print()
    print("=" * 70)
    print("MONITORING SESSION COMPLETE")
    print("=" * 70)
    print("Total predictions generated:", total_predictions)
    print("Total duration:", round(time.time() - session_start, 2), "seconds")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="ML-based flow capture and intrusion detection engine")
    parser.add_argument(
        "--target-ip",
        default=None,
        help="If set, only capture traffic to/from this IP address instead of everything on the interface."
    )
    args = parser.parse_args()

    start_monitoring(target_ip=args.target_ip)
