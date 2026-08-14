from scapy.all import sniff, IP, TCP
from collections import defaultdict

from feature_extractor import extract_features
from predictor import predict_flow


flows = defaultdict(list)


def process_packet(packet):

    if not packet.haslayer(IP) or not packet.haslayer(TCP):
        return

    ip = packet[IP]
    tcp = packet[TCP]

    src_ip = ip.src
    dst_ip = ip.dst
    src_port = tcp.sport
    dst_port = tcp.dport

    # --------------------------------------------------------
    # Normalize the flow
    # --------------------------------------------------------

    endpoint1 = (src_ip, src_port)
    endpoint2 = (dst_ip, dst_port)

    flow_key = tuple(sorted([endpoint1, endpoint2]))

    flows[flow_key].append(packet)

    packet_count = len(flows[flow_key])

    print(
        f"Flow: {src_ip}:{src_port} -> "
        f"{dst_ip}:{dst_port} | "
        f"Packets: {packet_count}"
    )

    # --------------------------------------------------------
    # Process completed TCP flow
    # --------------------------------------------------------

    if tcp.flags & 0x01 or tcp.flags & 0x04:

        completed_flow = flows.pop(flow_key)

        print("\n" + "=" * 60)
        print("TCP FLOW COMPLETED")
        print("=" * 60)

        print(
            "Total packets:",
            len(completed_flow)
        )

        try:

            # ------------------------------------------------
            # Extract 78 features
            # ------------------------------------------------

            features = extract_features(
                completed_flow
            )

            print(
                "Features extracted:",
                len(features)
            )

            if len(features) != 78:

                print(
                    "ERROR: Expected 78 features, "
                    f"but got {len(features)}"
                )

                return

            print(
                "SUCCESS: 78 features extracted."
            )

            # ------------------------------------------------
            # Run machine-learning prediction
            # ------------------------------------------------

            result = predict_flow(features)

            # ------------------------------------------------
            # Display prediction
            # ------------------------------------------------

            print("\n" + "=" * 60)
            print("PREDICTION RESULT")
            print("=" * 60)

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

        except Exception as error:

            print("\n" + "=" * 60)
            print("PREDICTION ERROR")
            print("=" * 60)

            print(
                type(error).__name__,
                ":",
                error
            )

            print("=" * 60)

        print()

# ------------------------------------------------------------
# Start packet capture
# ------------------------------------------------------------

print(
    "Starting TCP flow capture on port 8000..."
)

print(
    "Press CTRL+C to stop."
)


sniff(
    iface=r"\Device\NPF_Loopback",
    filter="tcp port 8000",
    prn=process_packet,
    store=False
)