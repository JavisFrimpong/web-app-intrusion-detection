import time
from datetime import datetime
from collections import defaultdict

from scapy.all import sniff, IP, TCP

from feature_extractor import extract_features
from predictor import predict_flow
from prediction_store import update_prediction


# ============================================================
# CONFIGURATION
# ============================================================

# Total monitoring duration
TOTAL_DURATION = 30

# Capture/prediction interval
INTERVAL = 10

# Your external network interface
INTERFACE = r"\Device\NPF_{4A00996A-D968-49BF-9076-5F7993E80B13}"

# Capture TCP traffic from the network interface
CAPTURE_FILTER = "tcp"


# ============================================================
# PROCESS A FLOW
# ============================================================

def process_flow(packets):

    if not packets:
        return

    print("\n" + "=" * 60)
    print("TCP FLOW COMPLETED")
    print("=" * 60)

    print("Total packets:", len(packets))

    try:

        # ----------------------------------------------------
        # Extract 78 features
        # ----------------------------------------------------

        features = extract_features(packets)

        print(
            "Features extracted:",
            len(features)
        )

        if len(features) != 78:

            print(
                "ERROR: Expected 78 features, "
                f"but received {len(features)}"
            )

            return

        print("SUCCESS: 78 features extracted.")

        # ----------------------------------------------------
        # Machine Learning prediction
        # ----------------------------------------------------

        result = predict_flow(features)

        # ----------------------------------------------------
        # Get flow information
        # ----------------------------------------------------

        first_packet = packets[0]

        source_ip = first_packet[IP].src
        destination_ip = first_packet[IP].dst

        source_port = first_packet[TCP].sport
        destination_port = first_packet[TCP].dport

        # ----------------------------------------------------
        # Timestamp
        # ----------------------------------------------------

        timestamp = datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

        # ----------------------------------------------------
        # Display prediction
        # ----------------------------------------------------

        print("\n" + "=" * 60)
        print("PREDICTION RESULT")
        print("=" * 60)

        print("Time:", timestamp)

        print(
            "Source:",
            f"{source_ip}:{source_port}"
        )

        print(
            "Destination:",
            f"{destination_ip}:{destination_port}"
        )

        print(
            "Prediction:",
            result["attack_type"]
        )

        print(
            "Confidence:",
            f'{result["confidence"]}%'
        )

        print(
            "Encoded label:",
            result["prediction"]
        )

        print("=" * 60)

        # ----------------------------------------------------
        # Store prediction
        # ----------------------------------------------------

        update_prediction(
            prediction=result["prediction"],
            attack_type=result["attack_type"],
            confidence=result["confidence"],
            source_ip=source_ip,
            source_port=source_port,
            destination_ip=destination_ip,
            destination_port=destination_port,
            packet_count=len(packets)
        )

        print("Prediction saved to database.")

    except Exception as error:

        print("\n" + "=" * 60)
        print("FLOW PROCESSING ERROR")
        print("=" * 60)

        print(
            type(error).__name__,
            ":",
            error
        )

        print("=" * 60)


# ============================================================
# CAPTURE ONE 10-SECOND WINDOW
# ============================================================

def capture_window(window_number):

    flows = defaultdict(list)

    print("\n" + "#" * 60)
    print(
        f"STARTING CAPTURE WINDOW {window_number}/"
        f"{TOTAL_DURATION // INTERVAL}"
    )
    print("#" * 60)

    start_time = time.time()

    print(
        "Start time:",
        datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    )

    # --------------------------------------------------------
    # Collect packets
    # --------------------------------------------------------

    def collect_packet(packet):

        if not packet.haslayer(IP):
            return

        if not packet.haslayer(TCP):
            return

        ip = packet[IP]
        tcp = packet[TCP]

        source = (
            ip.src,
            tcp.sport
        )

        destination = (
            ip.dst,
            tcp.dport
        )

        # ----------------------------------------------------
        # Normalize both directions into one flow
        # ----------------------------------------------------

        flow_key = tuple(
            sorted(
                [source, destination]
            )
        )

        flows[flow_key].append(packet)

    # --------------------------------------------------------
    # Capture for 10 seconds
    # --------------------------------------------------------

    sniff(
        iface=INTERFACE,
        filter=CAPTURE_FILTER,
        prn=collect_packet,
        store=False,
        timeout=INTERVAL
    )

    elapsed = time.time() - start_time

    # --------------------------------------------------------
    # Window summary
    # --------------------------------------------------------

    total_packets = sum(
        len(packets)
        for packets in flows.values()
    )

    print("\n" + "#" * 60)
    print(
        f"CAPTURE WINDOW {window_number} COMPLETED"
    )
    print("#" * 60)

    print(
        "Duration:",
        round(elapsed, 2),
        "seconds"
    )

    print(
        "Flows captured:",
        len(flows)
    )

    print(
        "Total packets:",
        total_packets
    )

    # --------------------------------------------------------
    # Analyze every flow
    # --------------------------------------------------------

    if not flows:

        print(
            "\nNo TCP flows detected during this window."
        )

    else:

        print(
            "\nAnalyzing",
            len(flows),
            "flow(s)..."
        )

        for packets in flows.values():

            process_flow(packets)

    print("\nWindow processing complete.")

    return {
        "flows": len(flows),
        "packets": total_packets,
        "duration": elapsed
    }


# ============================================================
# 30-SECOND MONITORING SESSION
# ============================================================

def start_monitoring():

    print("\n" + "=" * 60)
    print("MACHINE LEARNING INTRUSION DETECTION SYSTEM")
    print("=" * 60)

    print(
        "Interface:",
        INTERFACE
    )

    print(
        "Filter:",
        CAPTURE_FILTER
    )

    print(
        "Total monitoring duration:",
        TOTAL_DURATION,
        "seconds"
    )

    print(
        "Capture interval:",
        INTERVAL,
        "seconds"
    )

    print(
        "Number of capture windows:",
        TOTAL_DURATION // INTERVAL
    )

    print("\nMonitoring is ACTIVE.")

    print(
        "The system will capture for 30 seconds "
        "in three 10-second windows."
    )

    print(
        "Press CTRL+C to stop the IDS."
    )

    print("=" * 60)

    total_packets = 0
    total_flows = 0

    monitoring_start = datetime.now()

    session_start = time.time()

    window_number = 1

    try:

        # ----------------------------------------------------
        # Run exactly three 10-second windows
        # ----------------------------------------------------

        while (
            window_number <= TOTAL_DURATION // INTERVAL
            and (time.time() - session_start) < TOTAL_DURATION
        ):

            print("\n\n")
            print("=" * 60)

            print(
                "MONITORING WINDOW",
                f"{window_number}/"
                f"{TOTAL_DURATION // INTERVAL}"
            )

            print("=" * 60)

            result = capture_window(window_number)

            total_packets += result["packets"]
            total_flows += result["flows"]

            print("\n" + "-" * 60)
            print("MONITORING STATISTICS")
            print("-" * 60)

            print(
                "Windows processed:",
                window_number
            )

            print(
                "Total flows:",
                total_flows
            )

            print(
                "Total packets:",
                total_packets
            )

            print(
                "Monitoring since:",
                monitoring_start.strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
            )

            print("-" * 60)

            window_number += 1

        # ----------------------------------------------------
        # Session completed
        # ----------------------------------------------------

        monitoring_end = datetime.now()

        total_duration = (
            monitoring_end -
            monitoring_start
        )

        print("\n\n")
        print("=" * 60)
        print("30-SECOND MONITORING SESSION COMPLETED")
        print("=" * 60)

        print(
            "Started:",
            monitoring_start.strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        )

        print(
            "Completed:",
            monitoring_end.strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        )

        print(
            "Total duration:",
            total_duration
        )

        print(
            "Windows processed:",
            window_number - 1
        )

        print(
            "Total flows:",
            total_flows
        )

        print(
            "Total packets:",
            total_packets
        )

        print("=" * 60)

        print(
            "\nAll predictions have been stored "
            "in the prediction database."
        )

        print(
            "Monitoring session complete."
        )

    except KeyboardInterrupt:

        monitoring_end = datetime.now()

        duration = (
            monitoring_end -
            monitoring_start
        )

        print("\n\n")
        print("=" * 60)
        print("IDS MONITORING INTERRUPTED")
        print("=" * 60)

        print(
            "Started:",
            monitoring_start.strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        )

        print(
            "Stopped:",
            monitoring_end.strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        )

        print(
            "Monitoring duration:",
            duration
        )

        print(
            "Windows processed:",
            window_number - 1
        )

        print(
            "Total flows:",
            total_flows
        )

        print(
            "Total packets:",
            total_packets
        )

        print("\nIDS shutdown complete.")


# ============================================================
# PROGRAM ENTRY POINT
# ============================================================

if __name__ == "__main__":

    start_monitoring()