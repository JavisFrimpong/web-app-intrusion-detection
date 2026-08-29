import sqlite3
from datetime import datetime
import os


# ------------------------------------------------------------
# Database path
# ------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATABASE_PATH = os.path.join(
    BASE_DIR,
    "predictions.db"
)


# ------------------------------------------------------------
# Database initialization
# ------------------------------------------------------------

def initialize_database():

    connection = sqlite3.connect(DATABASE_PATH)

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            prediction INTEGER,
            attack_type TEXT,
            confidence REAL,

            timestamp TEXT,

            source_ip TEXT,
            source_port INTEGER,

            destination_ip TEXT,
            destination_port INTEGER,

            packet_count INTEGER
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS heuristic_alerts (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            alert_type TEXT,
            message TEXT,

            timestamp TEXT,

            source_ip TEXT
        )
    """)

    connection.commit()
    connection.close()


# ------------------------------------------------------------
# Store prediction
# ------------------------------------------------------------

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

    connection = sqlite3.connect(DATABASE_PATH)

    cursor = connection.cursor()

    timestamp = datetime.now().isoformat()

    cursor.execute("""
        INSERT INTO predictions (

            prediction,
            attack_type,
            confidence,
            timestamp,

            source_ip,
            source_port,

            destination_ip,
            destination_port,

            packet_count

        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (

        prediction,
        attack_type,
        confidence,
        timestamp,

        source_ip,
        source_port,

        destination_ip,
        destination_port,

        packet_count
    ))

    connection.commit()
    connection.close()


# ------------------------------------------------------------
# Store heuristic alert
# ------------------------------------------------------------

def insert_heuristic_alert(
    alert_type,
    message,
    source_ip
):

    connection = sqlite3.connect(DATABASE_PATH)

    cursor = connection.cursor()

    timestamp = datetime.now().isoformat()

    cursor.execute("""
        INSERT INTO heuristic_alerts (

            alert_type,
            message,
            timestamp,

            source_ip

        )

        VALUES (?, ?, ?, ?)
    """, (

        alert_type,
        message,
        timestamp,

        source_ip
    ))

    connection.commit()
    connection.close()


# ------------------------------------------------------------
# Get latest prediction
# ------------------------------------------------------------

def get_latest_prediction():

    connection = sqlite3.connect(DATABASE_PATH)

    connection.row_factory = sqlite3.Row

    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM predictions
        ORDER BY id DESC
        LIMIT 1
    """)

    row = cursor.fetchone()

    connection.close()

    if row is None:
        return None

    return dict(row)


# ------------------------------------------------------------
# Get prediction history
# ------------------------------------------------------------

def get_prediction_history(limit=100):

    connection = sqlite3.connect(DATABASE_PATH)

    connection.row_factory = sqlite3.Row

    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM predictions
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))

    rows = cursor.fetchall()

    connection.close()

    return [dict(row) for row in rows]


# ------------------------------------------------------------
# Get heuristic alert history
# ------------------------------------------------------------

def get_heuristic_alert_history(limit=100):

    connection = sqlite3.connect(DATABASE_PATH)

    connection.row_factory = sqlite3.Row

    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM heuristic_alerts
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))

    rows = cursor.fetchall()

    connection.close()

    return [dict(row) for row in rows]


# ------------------------------------------------------------
# Initialize database when module loads
# ------------------------------------------------------------

initialize_database()