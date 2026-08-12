from scapy.all import sniff, IP, TCP
from collections import defaultdict
import time


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

    # Normalize the flow so both directions belong to the same flow
    endpoint1 = (src_ip, src_port)
    endpoint2 = (dst_ip, dst_port)

    flow_key = tuple(sorted([endpoint1, endpoint2]))

    flows[flow_key].append(packet)

    print(
        f"Flow: {src_ip}:{src_port} -> "
        f"{dst_ip}:{dst_port} | "
        f"Packets: {len(flows[flow_key])}"
    )


print("Starting TCP flow capture on port 8000...")
print("Press CTRL+C to stop.")

sniff(
    iface=r"\Device\NPF_Loopback",
    filter="tcp port 8000",
    prn=process_packet,
    store=False
)