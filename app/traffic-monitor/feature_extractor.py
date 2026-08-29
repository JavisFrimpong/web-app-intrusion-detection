import numpy as np
from scapy.all import IP, TCP


# ============================================================
# CONFIGURATION
# ============================================================

# CICFlowMeter uses a 1-second threshold to separate
# active periods from idle periods.
ACTIVE_TIMEOUT = 1.0


# ============================================================
# SAFE STATISTICS
# ============================================================

def safe_mean(values):
    return float(np.mean(values)) if len(values) > 0 else 0.0


def safe_std(values):
    return float(np.std(values)) if len(values) > 1 else 0.0


def safe_min(values):
    return float(np.min(values)) if len(values) > 0 else 0.0


def safe_max(values):
    return float(np.max(values)) if len(values) > 0 else 0.0


def safe_sum(values):
    return float(np.sum(values)) if len(values) > 0 else 0.0


# ============================================================
# PACKET TIMESTAMPS
# ============================================================

def get_timestamp(packet):
    """Return packet timestamp in seconds."""

    try:
        return float(packet.time)
    except (AttributeError, TypeError, ValueError):
        return None


def get_timestamps(packets):
    """Return valid packet timestamps in chronological order."""

    timestamps = []

    for packet in packets:
        timestamp = get_timestamp(packet)

        if timestamp is not None:
            timestamps.append(timestamp)

    return timestamps


# ============================================================
# INTER-ARRIVAL TIMES
# ============================================================

def calculate_iat_values(packets):
    """
    Calculate inter-arrival times in microseconds.

    CICIDS2017/CICFlowMeter time-based features are expressed
    in microseconds.
    """

    timestamps = get_timestamps(packets)

    if len(timestamps) < 2:
        return []

    timestamps.sort()

    return [
        (timestamps[i] - timestamps[i - 1]) * 1_000_000
        for i in range(1, len(timestamps))
    ]


# ============================================================
# TCP HEADER LENGTH
# ============================================================

def get_ip_header_length(packet):
    """Return IP header length in bytes."""

    try:
        return int(packet[IP].ihl) * 4
    except (AttributeError, TypeError):
        return 20


def get_tcp_header_length(packet):
    """Return TCP header length in bytes."""

    try:
        data_offset = packet[TCP].dataofs

        if data_offset is not None:
            return int(data_offset) * 4

    except (AttributeError, TypeError):
        pass

    return 20


def get_total_header_length(packet):
    """
    Return IP + TCP header length.

    CICFlowMeter's header-length features represent the
    complete transport/network header contribution.
    """

    return (
        get_ip_header_length(packet)
        + get_tcp_header_length(packet)
    )


# ============================================================
# TCP PAYLOAD
# ============================================================

def get_payload_length(packet):
    """Return TCP payload size in bytes."""

    try:
        return len(packet[TCP].payload)
    except Exception:
        return 0


# ============================================================
# TCP FLAG HELPERS
# ============================================================

def has_flag(packet, flag):
    """Check whether a TCP flag is set."""

    try:
        return bool(packet[TCP].flags & flag)
    except Exception:
        return False


# TCP flag masks
FIN = 0x01
SYN = 0x02
RST = 0x04
PSH = 0x08
ACK = 0x10
URG = 0x20
ECE = 0x40
CWR = 0x80


# ============================================================
# ACTIVE / IDLE STATISTICS
# ============================================================

def calculate_active_idle(packets):
    """
    Calculate CICFlowMeter-style Active and Idle statistics.

    A gap greater than ACTIVE_TIMEOUT separates an active
    period from an idle period.

    Values are returned in microseconds.
    """

    timestamps = get_timestamps(packets)

    if len(timestamps) < 2:
        return {
            "active_mean": 0.0,
            "active_std": 0.0,
            "active_max": 0.0,
            "active_min": 0.0,
            "idle_mean": 0.0,
            "idle_std": 0.0,
            "idle_max": 0.0,
            "idle_min": 0.0,
        }

    timestamps.sort()

    active_periods = []
    idle_periods = []

    active_start = timestamps[0]
    previous_timestamp = timestamps[0]

    for timestamp in timestamps[1:]:

        gap = timestamp - previous_timestamp

        if gap > ACTIVE_TIMEOUT:

            # Finish current active period
            active_duration = (
                previous_timestamp - active_start
            )

            active_periods.append(
                active_duration * 1_000_000
            )

            # Current gap is an idle period
            idle_periods.append(
                gap * 1_000_000
            )

            # New active period starts
            active_start = timestamp

        previous_timestamp = timestamp

    # Finish final active period
    final_active_duration = (
        previous_timestamp - active_start
    )

    active_periods.append(
        final_active_duration * 1_000_000
    )

    return {
        "active_mean": safe_mean(active_periods),
        "active_std": safe_std(active_periods),
        "active_max": safe_max(active_periods),
        "active_min": safe_min(active_periods),

        "idle_mean": safe_mean(idle_periods),
        "idle_std": safe_std(idle_periods),
        "idle_max": safe_max(idle_periods),
        "idle_min": safe_min(idle_periods),
    }


# ============================================================
# BULK STATISTICS
# ============================================================

def calculate_bulk_statistics(packets):
    """
    Calculate directional bulk statistics.

    Bulk traffic is identified from consecutive payload-bearing
    packets occurring within the active timeout.

    For short live-captured flows where no qualifying bulk
    exists, CICFlowMeter-compatible zero values are returned.
    """

    def process_direction(direction_packets):

        if len(direction_packets) < 4:
            return 0.0, 0.0, 0.0

        ordered = sorted(
            direction_packets,
            key=lambda p: get_timestamp(p)
            if get_timestamp(p) is not None
            else 0.0
        )

        bulks = []

        current_packets = []
        current_bytes = 0
        previous_time = None

        for packet in ordered:

            timestamp = get_timestamp(packet)
            payload_length = get_payload_length(packet)

            if timestamp is None or payload_length <= 0:
                continue

            if previous_time is None:
                current_packets = [packet]
                current_bytes = payload_length
                previous_time = timestamp
                continue

            gap = timestamp - previous_time

            if gap <= ACTIVE_TIMEOUT:

                current_packets.append(packet)
                current_bytes += payload_length

            else:

                if len(current_packets) >= 4:
                    duration = (
                        get_timestamp(current_packets[-1])
                        - get_timestamp(current_packets[0])
                    )

                    bulks.append(
                        (
                            len(current_packets),
                            current_bytes,
                            duration
                        )
                    )

                current_packets = [packet]
                current_bytes = payload_length

            previous_time = timestamp

        # Final bulk
        if len(current_packets) >= 4:

            duration = (
                get_timestamp(current_packets[-1])
                - get_timestamp(current_packets[0])
            )

            bulks.append(
                (
                    len(current_packets),
                    current_bytes,
                    duration
                )
            )

        if not bulks:
            return 0.0, 0.0, 0.0

        packet_counts = [
            bulk[0]
            for bulk in bulks
        ]

        byte_counts = [
            bulk[1]
            for bulk in bulks
        ]

        rates = []

        for packets_count, bytes_count, duration in bulks:

            if duration > 0:

                rates.append(
                    bytes_count / duration
                )

            else:
                rates.append(0.0)

        return (
            safe_mean(byte_counts),
            safe_mean(packet_counts),
            safe_mean(rates)
        )

    return process_direction(packets)


# ============================================================
# MAIN FEATURE EXTRACTION
# ============================================================

def extract_features(packets):

    # --------------------------------------------------------
    # Filter valid TCP/IP packets
    # --------------------------------------------------------

    ip_tcp_packets = [
        packet
        for packet in packets
        if packet.haslayer(IP)
        and packet.haslayer(TCP)
        and get_timestamp(packet) is not None
    ]

    if not ip_tcp_packets:
        raise ValueError(
            "No TCP/IP packets with valid timestamps found."
        )

    # Always process packets chronologically
    ip_tcp_packets.sort(
        key=lambda packet: get_timestamp(packet)
    )

    # --------------------------------------------------------
    # Determine flow direction
    # --------------------------------------------------------

    first_packet = ip_tcp_packets[0]

    forward_ip = first_packet[IP].src
    forward_port = int(first_packet[TCP].sport)

    forward_packets = [
        packet
        for packet in ip_tcp_packets
        if packet[IP].src == forward_ip
        and int(packet[TCP].sport) == forward_port
    ]

    backward_packets = [
        packet
        for packet in ip_tcp_packets
        if not (
            packet[IP].src == forward_ip
            and int(packet[TCP].sport) == forward_port
        )
    ]

    # --------------------------------------------------------
    # Packet lengths
    # --------------------------------------------------------

    all_lengths = [
        len(packet)
        for packet in ip_tcp_packets
    ]

    fwd_lengths = [
        len(packet)
        for packet in forward_packets
    ]

    bwd_lengths = [
        len(packet)
        for packet in backward_packets
    ]

    # --------------------------------------------------------
    # Flow duration
    # --------------------------------------------------------

    timestamps = [
        get_timestamp(packet)
        for packet in ip_tcp_packets
    ]

    timestamps = [
        timestamp
        for timestamp in timestamps
        if timestamp is not None
    ]

    if len(timestamps) >= 2:

        flow_duration = (
            max(timestamps) - min(timestamps)
        ) * 1_000_000

    else:
        flow_duration = 0.0

    flow_duration_seconds = flow_duration / 1_000_000

    # --------------------------------------------------------
    # Packet counts
    # --------------------------------------------------------

    total_fwd_packets = len(forward_packets)
    total_bwd_packets = len(backward_packets)

    total_packets = len(ip_tcp_packets)

    # --------------------------------------------------------
    # Bytes
    # --------------------------------------------------------

    total_fwd_bytes = sum(fwd_lengths)
    total_bwd_bytes = sum(bwd_lengths)

    total_bytes = sum(all_lengths)

    # --------------------------------------------------------
    # Rates
    # --------------------------------------------------------

    if flow_duration_seconds > 0:

        flow_bytes_per_sec = (
            total_bytes /
            flow_duration_seconds
        )

        flow_packets_per_sec = (
            total_packets /
            flow_duration_seconds
        )

        fwd_packets_per_sec = (
            total_fwd_packets /
            flow_duration_seconds
        )

        bwd_packets_per_sec = (
            total_bwd_packets /
            flow_duration_seconds
        )

    else:

        flow_bytes_per_sec = 0.0
        flow_packets_per_sec = 0.0
        fwd_packets_per_sec = 0.0
        bwd_packets_per_sec = 0.0

    # --------------------------------------------------------
    # IAT
    # --------------------------------------------------------

    flow_iats = calculate_iat_values(
        ip_tcp_packets
    )

    fwd_iats = calculate_iat_values(
        forward_packets
    )

    bwd_iats = calculate_iat_values(
        backward_packets
    )

    # --------------------------------------------------------
    # Packet length statistics
    # --------------------------------------------------------

    min_packet_length = safe_min(all_lengths)
    max_packet_length = safe_max(all_lengths)
    packet_length_mean = safe_mean(all_lengths)
    packet_length_std = safe_std(all_lengths)

    packet_length_variance = (
        float(np.var(all_lengths))
        if len(all_lengths) > 0
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

    fwd_iat_total = safe_sum(fwd_iats)
    fwd_iat_mean = safe_mean(fwd_iats)
    fwd_iat_std = safe_std(fwd_iats)
    fwd_iat_max = safe_max(fwd_iats)
    fwd_iat_min = safe_min(fwd_iats)

    # --------------------------------------------------------
    # Backward IAT statistics
    # --------------------------------------------------------

    bwd_iat_total = safe_sum(bwd_iats)
    bwd_iat_mean = safe_mean(bwd_iats)
    bwd_iat_std = safe_std(bwd_iats)
    bwd_iat_max = safe_max(bwd_iats)
    bwd_iat_min = safe_min(bwd_iats)

    # --------------------------------------------------------
    # Header lengths
    # --------------------------------------------------------

    fwd_header_length = sum(
        get_total_header_length(packet)
        for packet in forward_packets
    )

    bwd_header_length = sum(
        get_total_header_length(packet)
        for packet in backward_packets
    )

    # --------------------------------------------------------
    # TCP flags
    # --------------------------------------------------------

    fin_flag_count = sum(
        has_flag(packet, FIN)
        for packet in ip_tcp_packets
    )

    syn_flag_count = sum(
        has_flag(packet, SYN)
        for packet in ip_tcp_packets
    )

    rst_flag_count = sum(
        has_flag(packet, RST)
        for packet in ip_tcp_packets
    )

    psh_flag_count = sum(
        has_flag(packet, PSH)
        for packet in ip_tcp_packets
    )

    ack_flag_count = sum(
        has_flag(packet, ACK)
        for packet in ip_tcp_packets
    )

    urg_flag_count = sum(
        has_flag(packet, URG)
        for packet in ip_tcp_packets
    )

    cwe_flag_count = sum(
        has_flag(packet, CWR)
        for packet in ip_tcp_packets
    )

    ece_flag_count = sum(
        has_flag(packet, ECE)
        for packet in ip_tcp_packets
    )

    # --------------------------------------------------------
    # Directional flags
    # --------------------------------------------------------

    fwd_psh_flags = sum(
        has_flag(packet, PSH)
        for packet in forward_packets
    )

    bwd_psh_flags = sum(
        has_flag(packet, PSH)
        for packet in backward_packets
    )

    fwd_urg_flags = sum(
        has_flag(packet, URG)
        for packet in forward_packets
    )

    bwd_urg_flags = sum(
        has_flag(packet, URG)
        for packet in backward_packets
    )

    # --------------------------------------------------------
    # Bulk statistics
    # --------------------------------------------------------

    (
        fwd_avg_bytes_bulk,
        fwd_avg_packets_bulk,
        fwd_avg_bulk_rate
    ) = calculate_bulk_statistics(
        forward_packets
    )

    (
        bwd_avg_bytes_bulk,
        bwd_avg_packets_bulk,
        bwd_avg_bulk_rate
    ) = calculate_bulk_statistics(
        backward_packets
    )

    # --------------------------------------------------------
    # Active / idle statistics
    # --------------------------------------------------------

    active_idle = calculate_active_idle(
        ip_tcp_packets
    )

    # --------------------------------------------------------
    # TCP initial windows
    # --------------------------------------------------------

    init_win_bytes_forward = (
        int(forward_packets[0][TCP].window)
        if forward_packets
        else 0
    )

    init_win_bytes_backward = (
        int(backward_packets[0][TCP].window)
        if backward_packets
        else 0
    )

    # --------------------------------------------------------
    # Forward active data packets
    # --------------------------------------------------------

    act_data_pkt_fwd = sum(
        1
        for packet in forward_packets
        if get_payload_length(packet) > 0
    )

    # --------------------------------------------------------
    # Minimum forward TCP segment size
    # --------------------------------------------------------

    forward_segment_sizes = [
        get_payload_length(packet)
        for packet in forward_packets
        if get_payload_length(packet) > 0
    ]

    min_seg_size_forward = (
        min(forward_segment_sizes)
        if forward_segment_sizes
        else 0
    )

    # --------------------------------------------------------
    # Down / Up ratio
    # --------------------------------------------------------

    down_up_ratio = (
        total_bwd_packets /
        total_fwd_packets
        if total_fwd_packets > 0
        else 0.0
    )

    # --------------------------------------------------------
    # Create exactly the 78 CICIDS2017 features
    # --------------------------------------------------------

    features = {

        "Destination Port":
            int(first_packet[TCP].dport),

        "Flow Duration":
            float(flow_duration),

        "Total Fwd Packets":
            int(total_fwd_packets),

        "Total Backward Packets":
            int(total_bwd_packets),

        "Total Length of Fwd Packets":
            int(total_fwd_bytes),

        "Total Length of Bwd Packets":
            int(total_bwd_bytes),

        "Fwd Packet Length Max":
            fwd_packet_length_max,

        "Fwd Packet Length Min":
            fwd_packet_length_min,

        "Fwd Packet Length Mean":
            fwd_packet_length_mean,

        "Fwd Packet Length Std":
            fwd_packet_length_std,

        "Bwd Packet Length Max":
            bwd_packet_length_max,

        "Bwd Packet Length Min":
            bwd_packet_length_min,

        "Bwd Packet Length Mean":
            bwd_packet_length_mean,

        "Bwd Packet Length Std":
            bwd_packet_length_std,

        "Flow Bytes/s":
            flow_bytes_per_sec,

        "Flow Packets/s":
            flow_packets_per_sec,

        "Flow IAT Mean":
            flow_iat_mean,

        "Flow IAT Std":
            flow_iat_std,

        "Flow IAT Max":
            flow_iat_max,

        "Flow IAT Min":
            flow_iat_min,

        "Fwd IAT Total":
            fwd_iat_total,

        "Fwd IAT Mean":
            fwd_iat_mean,

        "Fwd IAT Std":
            fwd_iat_std,

        "Fwd IAT Max":
            fwd_iat_max,

        "Fwd IAT Min":
            fwd_iat_min,

        "Bwd IAT Total":
            bwd_iat_total,

        "Bwd IAT Mean":
            bwd_iat_mean,

        "Bwd IAT Std":
            bwd_iat_std,

        "Bwd IAT Max":
            bwd_iat_max,

        "Bwd IAT Min":
            bwd_iat_min,

        "Fwd PSH Flags":
            int(fwd_psh_flags),

        "Bwd PSH Flags":
            int(bwd_psh_flags),

        "Fwd URG Flags":
            int(fwd_urg_flags),

        "Bwd URG Flags":
            int(bwd_urg_flags),

        "Fwd Header Length":
            int(fwd_header_length),

        "Bwd Header Length":
            int(bwd_header_length),

        "Fwd Packets/s":
            fwd_packets_per_sec,

        "Bwd Packets/s":
            bwd_packets_per_sec,

        "Min Packet Length":
            min_packet_length,

        "Max Packet Length":
            max_packet_length,

        "Packet Length Mean":
            packet_length_mean,

        "Packet Length Std":
            packet_length_std,

        "Packet Length Variance":
            packet_length_variance,

        "FIN Flag Count":
            int(fin_flag_count),

        "SYN Flag Count":
            int(syn_flag_count),

        "RST Flag Count":
            int(rst_flag_count),

        "PSH Flag Count":
            int(psh_flag_count),

        "ACK Flag Count":
            int(ack_flag_count),

        "URG Flag Count":
            int(urg_flag_count),

        "CWE Flag Count":
            int(cwe_flag_count),

        "ECE Flag Count":
            int(ece_flag_count),

        "Down/Up Ratio":
            down_up_ratio,

        "Average Packet Size":
            packet_length_mean,

        "Avg Fwd Segment Size":
            fwd_packet_length_mean,

        "Avg Bwd Segment Size":
            bwd_packet_length_mean,

        "Fwd Header Length.1":
            int(fwd_header_length),

        "Fwd Avg Bytes/Bulk":
            fwd_avg_bytes_bulk,

        "Fwd Avg Packets/Bulk":
            fwd_avg_packets_bulk,

        "Fwd Avg Bulk Rate":
            fwd_avg_bulk_rate,

        "Bwd Avg Bytes/Bulk":
            bwd_avg_bytes_bulk,

        "Bwd Avg Packets/Bulk":
            bwd_avg_packets_bulk,

        "Bwd Avg Bulk Rate":
            bwd_avg_bulk_rate,

        "Subflow Fwd Packets":
            int(total_fwd_packets),

        "Subflow Fwd Bytes":
            int(total_fwd_bytes),

        "Subflow Bwd Packets":
            int(total_bwd_packets),

        "Subflow Bwd Bytes":
            int(total_bwd_bytes),

        "Init_Win_bytes_forward":
            init_win_bytes_forward,

        "Init_Win_bytes_backward":
            init_win_bytes_backward,

        "act_data_pkt_fwd":
            int(act_data_pkt_fwd),

        "min_seg_size_forward":
            int(min_seg_size_forward),

        "Active Mean":
            active_idle["active_mean"],

        "Active Std":
            active_idle["active_std"],

        "Active Max":
            active_idle["active_max"],

        "Active Min":
            active_idle["active_min"],

        "Idle Mean":
            active_idle["idle_mean"],

        "Idle Std":
            active_idle["idle_std"],

        "Idle Max":
            active_idle["idle_max"],

        "Idle Min":
            active_idle["idle_min"],
    }

    # --------------------------------------------------------
    # Final validation
    # --------------------------------------------------------

    if len(features) != 78:
        raise RuntimeError(
            f"Feature extraction produced "
            f"{len(features)} features instead of 78."
        )

    return features