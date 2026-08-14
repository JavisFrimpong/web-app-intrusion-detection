from datetime import datetime


latest_prediction = {
    "prediction": None,
    "attack_type": None,
    "confidence": None,
    "timestamp": None,
    "source_ip": None,
    "source_port": None,
    "destination_ip": None,
    "destination_port": None,
    "packet_count": None
}


def update_prediction(
    prediction,
    attack_type,
    confidence,
    source_ip,
    source_port,
    destination_ip,
    destination_port,
    packet_count
):

    global latest_prediction

    latest_prediction = {
        "prediction": prediction,
        "attack_type": attack_type,
        "confidence": confidence,
        "timestamp": datetime.now().isoformat(),

        "source_ip": source_ip,
        "source_port": source_port,

        "destination_ip": destination_ip,
        "destination_port": destination_port,

        "packet_count": packet_count
    }


def get_latest_prediction():

    return latest_prediction

