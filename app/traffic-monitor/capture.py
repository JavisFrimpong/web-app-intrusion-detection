from scapy.all import sniff


def packet_callback(packet):
    print(packet.summary())


print("Starting packet capture...")
print("Press CTRL+C to stop.")

sniff(prn=packet_callback, store=False)