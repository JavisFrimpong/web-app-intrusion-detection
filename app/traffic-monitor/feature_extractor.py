import numpy as np
import pandas as pd
from scapy.all import IP, TCP


def calculate_iat_values(packets):
    """Calculate inter-arrival times in microseconds."""

    if len(packets) < 2:
        return []

    timestamps = [
        float(packet.time)
        for packet in packets
        if hasattr(packet, "time")
    ]

    return [
        (timestamps[i] - timestamps[i - 1]) * 1_000_000
        for i in range(1, len(timestamps))
    ]


def safe_mean(values):
    return float(np.mean(values)) if values else 0.0


def safe_std(values):
    return float(np.std(values)) if len(values) > 1 else 0.0


def safe_max(values):
    return float(max(values)) if values else 0.0


def safe_min(values):
    return float(min(values)) if values else 0.0


def extract_features(packets):

    # --------------------------------------------------------
    # Separate forward and backward packets
    # --------------------------------------------------------

    ip_tcp_packets = [
        p for p in packets
        if p.haslayer(IP) and p.haslayer(TCP)
    ]

    if not ip_tcp_packets:
        raise ValueError("No TCP/IP packets found.")

    first_packet = ip_tcp_packets[0]

    forward_ip = first_packet[IP].src
    forward_port = first_packet[TCP].sport

    forward_packets = [
        p for p in ip_tcp_packets
        if p[IP].src == forward_ip
        and p[TCP].sport == forward_port
    ]

    backward_packets = [
        p for p in ip_tcp_packets
        if not (
            p[IP].src == forward_ip
            and p[TCP].sport == forward_port
        )
    ]

    # --------------------------------------------------------
    # Packet lengths
    # --------------------------------------------------------

    all_lengths = [len(p) for p in ip_tcp_packets]

    fwd_lengths = [len(p) for p in forward_packets]
    bwd_lengths = [len(p) for p in backward_packets]

    # --------------------------------------------------------
    # Flow duration
    # --------------------------------------------------------

    timestamps = [
        float(p.time)
        for p in ip_tcp_packets
        if hasattr(p, "time")
    ]

    if len(timestamps) >= 2:
        flow_duration = (
            max(timestamps) - min(timestamps)
        ) * 1_000_000
    else:
        flow_duration = 0.0

    flow_duration_seconds = flow_duration / 1_000_000

    # --------------------------------------------------------
    # IAT
    # --------------------------------------------------------

    flow_iats = calculate_iat_values(ip_tcp_packets)
    fwd_iats = calculate_iat_values(forward_packets)
    bwd_iats = calculate_iat_values(backward_packets)

    # --------------------------------------------------------
    # Flow statistics
    # --------------------------------------------------------

    total_fwd_packets = len(forward_packets)
    total_bwd_packets = len(backward_packets)

    total_fwd_bytes = sum(fwd_lengths)
    total_bwd_bytes = sum(bwd_lengths)

    total_packets = len(ip_tcp_packets)
    total_bytes = sum(all_lengths)

    # --------------------------------------------------------
    # Rates
    # --------------------------------------------------------

    if flow_duration_seconds > 0:

        flow_bytes_per_sec = (
            total_bytes / flow_duration_seconds
        )

        flow_packets_per_sec = (
            total_packets / flow_duration_seconds
        )

        fwd_packets_per_sec = (
            total_fwd_packets / flow_duration_seconds
        )

        bwd_packets_per_sec = (
            total_bwd_packets / flow_duration_seconds
        )

    else:

        flow_bytes_per_sec = 0.0
        flow_packets_per_sec = 0.0
        fwd_packets_per_sec = 0.0
        bwd_packets_per_sec = 0.0

    # --------------------------------------------------------
    # TCP flags
    # --------------------------------------------------------

    fin_flag_count = sum(
        1 for p in ip_tcp_packets
        if p[TCP].flags & 0x01
    )

    syn_flag_count = sum(
        1 for p in ip_tcp_packets
        if p[TCP].flags & 0x02
    )

    rst_flag_count = sum(
        1 for p in ip_tcp_packets
        if p[TCP].flags & 0x04
    )

    psh_flag_count = sum(
        1 for p in ip_tcp_packets
        if p[TCP].flags & 0x08
    )

    ack_flag_count = sum(
        1 for p in ip_tcp_packets
        if p[TCP].flags & 0x10
    )

    urg_flag_count = sum(
        1 for p in ip_tcp_packets
        if p[TCP].flags & 0x20
    )

    ece_flag_count = sum(
        1 for p in ip_tcp_packets
        if p[TCP].flags & 0x40
    )

    cwe_flag_count = sum(
        1 for p in ip_tcp_packets
        if p[TCP].flags & 0x80
    )

    # --------------------------------------------------------
    # Header lengths
    # --------------------------------------------------------

    fwd_header_length = sum(
        (
            p[TCP].dataofs * 4
            if p[TCP].dataofs is not None
            else 20
        )
        for p in forward_packets
    )

    bwd_header_length = sum(
        (
            p[TCP].dataofs * 4
            if p[TCP].dataofs is not None
            else 20
        )
        for p in backward_packets
    )

    # --------------------------------------------------------
    # Packet statistics
    # --------------------------------------------------------

    min_packet_length = safe_min(all_lengths)
    max_packet_length = safe_max(all_lengths)
    packet_length_mean = safe_mean(all_lengths)
    packet_length_std = safe_std(all_lengths)

    packet_length_variance = (
        float(np.var(all_lengths))
        if all_lengths
        else 0.0
    )

    # --------------------------------------------------------
    # Forward packet statistics
    # --------------------------------------------------------

    fwd_packet_length_max = safe_max(fwd_lengths)
    fwd_packet_length_min = safe_min(fwd_lengths)
    fwd_packet_length_mean = safe_mean(fwd_lengths)
    fwd_packet_length_std = safe_std(fwd_lengths)

    # --------------------------------------------------------
    # Backward packet statistics
    # --------------------------------------------------------

    bwd_packet_length_max = safe_max(bwd_lengths)
    bwd_packet_length_min = safe_min(bwd_lengths)
    bwd_packet_length_mean = safe_mean(bwd_lengths)
    bwd_packet_length_std = safe_std(bwd_lengths)

    # --------------------------------------------------------
    # Flow IAT statistics
    # --------------------------------------------------------

    flow_iat_mean = safe_mean(flow_iats)
    flow_iat_std = safe_std(flow_iats)
    flow_iat_max = safe_max(flow_iats)
    flow_iat_min = safe_min(flow_iats)

    # --------------------------------------------------------
    # Forward IAT statistics
    # --------------------------------------------------------

    fwd_iat_total = sum(fwd_iats)
    fwd_iat_mean = safe_mean(fwd_iats)
    fwd_iat_std = safe_std(fwd_iats)
    fwd_iat_max = safe_max(fwd_iats)
    fwd_iat_min = safe_min(fwd_iats)

    # --------------------------------------------------------
    # Backward IAT statistics
    # --------------------------------------------------------

    bwd_iat_total = sum(bwd_iats)
    bwd_iat_mean = safe_mean(bwd_iats)
    bwd_iat_std = safe_std(bwd_iats)
    bwd_iat_max = safe_max(bwd_iats)
    bwd_iat_min = safe_min(bwd_iats)

    # --------------------------------------------------------
    # Create feature dictionary
    # --------------------------------------------------------

    features = {

        "Destination Port": first_packet[TCP].dport,

        "Flow Duration": flow_duration,

        "Total Fwd Packets": total_fwd_packets,
        "Total Backward Packets": total_bwd_packets,

        "Total Length of Fwd Packets": total_fwd_bytes,
        "Total Length of Bwd Packets": total_bwd_bytes,

        "Fwd Packet Length Max": fwd_packet_length_max,
        "Fwd Packet Length Min": fwd_packet_length_min,
        "Fwd Packet Length Mean": fwd_packet_length_mean,
        "Fwd Packet Length Std": fwd_packet_length_std,

        "Bwd Packet Length Max": bwd_packet_length_max,
        "Bwd Packet Length Min": bwd_packet_length_min,
        "Bwd Packet Length Mean": bwd_packet_length_mean,
        "Bwd Packet Length Std": bwd_packet_length_std,

        "Flow Bytes/s": flow_bytes_per_sec,
        "Flow Packets/s": flow_packets_per_sec,

        "Flow IAT Mean": flow_iat_mean,
        "Flow IAT Std": flow_iat_std,
        "Flow IAT Max": flow_iat_max,
        "Flow IAT Min": flow_iat_min,

        "Fwd IAT Total": fwd_iat_total,
        "Fwd IAT Mean": fwd_iat_mean,
        "Fwd IAT Std": fwd_iat_std,
        "Fwd IAT Max": fwd_iat_max,
        "Fwd IAT Min": fwd_iat_min,

        "Bwd IAT Total": bwd_iat_total,
        "Bwd IAT Mean": bwd_iat_mean,
        "Bwd IAT Std": bwd_iat_std,
        "Bwd IAT Max": bwd_iat_max,
        "Bwd IAT Min": bwd_iat_min,

        "Fwd PSH Flags": sum(
            1 for p in forward_packets
            if p[TCP].flags & 0x08
        ),

        "Bwd PSH Flags": sum(
            1 for p in backward_packets
            if p[TCP].flags & 0x08
        ),

        "Fwd URG Flags": sum(
            1 for p in forward_packets
            if p[TCP].flags & 0x20
        ),

        "Bwd URG Flags": sum(
            1 for p in backward_packets
            if p[TCP].flags & 0x20
        ),

        "Fwd Header Length": fwd_header_length,
        "Bwd Header Length": bwd_header_length,

        "Fwd Packets/s": fwd_packets_per_sec,
        "Bwd Packets/s": bwd_packets_per_sec,

        "Min Packet Length": min_packet_length,
        "Max Packet Length": max_packet_length,
        "Packet Length Mean": packet_length_mean,
        "Packet Length Std": packet_length_std,
        "Packet Length Variance": packet_length_variance,

        "FIN Flag Count": fin_flag_count,
        "SYN Flag Count": syn_flag_count,
        "RST Flag Count": rst_flag_count,
        "PSH Flag Count": psh_flag_count,
        "ACK Flag Count": ack_flag_count,
        "URG Flag Count": urg_flag_count,
        "CWE Flag Count": cwe_flag_count,
        "ECE Flag Count": ece_flag_count,

        "Down/Up Ratio": (
            total_bwd_packets / total_fwd_packets
            if total_fwd_packets > 0
            else 0
        ),

        "Average Packet Size": packet_length_mean,

        "Avg Fwd Segment Size": fwd_packet_length_mean,

        "Avg Bwd Segment Size": bwd_packet_length_mean,

        "Fwd Header Length.1": fwd_header_length,

        "Fwd Avg Bytes/Bulk": 0,
        "Fwd Avg Packets/Bulk": 0,
        "Fwd Avg Bulk Rate": 0,

        "Bwd Avg Bytes/Bulk": 0,
        "Bwd Avg Packets/Bulk": 0,
        "Bwd Avg Bulk Rate": 0,

        "Subflow Fwd Packets": total_fwd_packets,
        "Subflow Fwd Bytes": total_fwd_bytes,

        "Subflow Bwd Packets": total_bwd_packets,
        "Subflow Bwd Bytes": total_bwd_bytes,

        "Init_Win_bytes_forward": (
            int(forward_packets[0][TCP].window)
            if forward_packets
            else 0
        ),

        "Init_Win_bytes_backward": (
            int(backward_packets[0][TCP].window)
            if backward_packets
            else 0
        ),

        "act_data_pkt_fwd": sum(
            1
            for p in forward_packets
            if len(p[TCP].payload) > 0
        ),

        "min_seg_size_forward": (
            min(fwd_lengths)
            if fwd_lengths
            else 0
        ),

        "Active Mean": flow_iat_mean,
        "Active Std": flow_iat_std,
        "Active Max": flow_iat_max,
        "Active Min": flow_iat_min,

        "Idle Mean": 0,
        "Idle Std": 0,
        "Idle Max": 0,
        "Idle Min": 0,
    }

    return features