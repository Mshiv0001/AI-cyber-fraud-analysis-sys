from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import joblib
import pandas as pd
from pathlib import Path
import sqlite3
import json
import random
import threading
import time
import uuid
from datetime import datetime, timezone

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "fraud_model_temporal.pkl"
THRESHOLD_PATH = BASE_DIR / "fraud_threshold.txt"
DB_PATH = BASE_DIR / "fraudguard.db"

# ── Database helpers ──────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            # ── Original transactions table (extended with simulation fields) ──
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS transactions (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT,
                    amount TEXT,
                    type TEXT,
                    score REAL,
                    risk TEXT,
                    signal TEXT,
                    status TEXT,
                    raw_data TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    case_id TEXT,
                    customer_id TEXT,
                    location TEXT,
                    device_type TEXT,
                    ip_address TEXT,
                    payment_method TEXT,
                    ground_truth TEXT,
                    model_prediction TEXT,
                    fraud_probability REAL,
                    is_synthetic INTEGER DEFAULT 0
                )
            """)

            # ── Add new columns to existing table if they don't exist ──────────
            for col, dtype in [
                ("case_id", "TEXT"),
                ("customer_id", "TEXT"),
                ("location", "TEXT"),
                ("device_type", "TEXT"),
                ("ip_address", "TEXT"),
                ("payment_method", "TEXT"),
                ("ground_truth", "TEXT"),
                ("model_prediction", "TEXT"),
                ("fraud_probability", "REAL"),
                ("is_synthetic", "INTEGER DEFAULT 0"),
            ]:
                try:
                    cursor.execute(f"ALTER TABLE transactions ADD COLUMN {col} {dtype}")
                except Exception:
                    pass  # Column already exists

            # ── Cases table ───────────────────────────────────────────────────
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS cases (
                    id TEXT PRIMARY KEY,
                    transaction_id TEXT,
                    customer_id TEXT,
                    amount TEXT,
                    amount_raw REAL,
                    payment_method TEXT,
                    location TEXT,
                    device_type TEXT,
                    risk_level TEXT,
                    fraud_probability REAL,
                    prediction TEXT,
                    ground_truth TEXT,
                    status TEXT DEFAULT 'Under Investigation',
                    source TEXT DEFAULT 'MANUAL',
                    analyst TEXT DEFAULT 'Mohit S.',
                    summary TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # ── Alerts table ──────────────────────────────────────────────────
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    id TEXT PRIMARY KEY,
                    case_id TEXT,
                    transaction_id TEXT,
                    title TEXT,
                    body TEXT,
                    amount TEXT,
                    risk_level TEXT,
                    fraud_probability REAL,
                    alert_type TEXT DEFAULT 'HIGH_RISK',
                    severity TEXT DEFAULT 'High',
                    read INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # ── Simulation timeline table ─────────────────────────────────────
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS simulation_timeline (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    minute_slot TEXT,
                    happening_count INTEGER DEFAULT 0,
                    reported_count INTEGER DEFAULT 0,
                    actual_fraud_count INTEGER DEFAULT 0,
                    ml_fraud_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # ── Clean up legacy payment rail terms (UPI, NEFT, IMPS, RTGS) ───
            cursor.execute("UPDATE transactions SET payment_method = 'Wire Transfer' WHERE payment_method IN ('IMPS', 'NEFT', 'RTGS', 'NetBanking')")
            cursor.execute("UPDATE transactions SET payment_method = 'Merchant Payment' WHERE payment_method = 'UPI'")
            cursor.execute("UPDATE cases SET payment_method = 'Wire Transfer' WHERE payment_method IN ('IMPS', 'NEFT', 'RTGS', 'NetBanking')")
            cursor.execute("UPDATE cases SET payment_method = 'Merchant Payment' WHERE payment_method = 'UPI'")
            cursor.execute("UPDATE cases SET summary = REPLACE(summary, 'IMPS', 'Wire Transfer')")
            cursor.execute("UPDATE cases SET summary = REPLACE(summary, 'NEFT', 'Wire Transfer')")
            cursor.execute("UPDATE cases SET summary = REPLACE(summary, 'RTGS', 'Wire Transfer')")
            cursor.execute("UPDATE cases SET summary = REPLACE(summary, 'UPI', 'Merchant Payment')")
            cursor.execute("UPDATE cases SET summary = REPLACE(summary, 'NetBanking', 'Wire Transfer')")
            cursor.execute("UPDATE alerts SET body = REPLACE(body, 'IMPS', 'Wire Transfer')")
            cursor.execute("UPDATE alerts SET body = REPLACE(body, 'NEFT', 'Wire Transfer')")
            cursor.execute("UPDATE alerts SET body = REPLACE(body, 'RTGS', 'Wire Transfer')")
            cursor.execute("UPDATE alerts SET body = REPLACE(body, 'UPI', 'Merchant Payment')")
            cursor.execute("UPDATE alerts SET body = REPLACE(body, 'NetBanking', 'Wire Transfer')")
            cursor.execute("UPDATE cases SET risk_level = 'low' WHERE prediction = 'LEGITIMATE' AND risk_level = 'high'")
            conn.commit()

            # ── Seed initial transactions if empty ────────────────────────────
            cursor.execute("SELECT COUNT(*) FROM transactions")
            if cursor.fetchone()[0] == 0:
                initial_seed = [
                    ('TX-9842', 'Yesterday, 10:24 AM', '$14,850.00', 'Wire Transfer', 0.96, 'high', 'Extreme amount outlier (>6σ from mean)', 'Flagged', None),
                    ('TX-9831', 'Yesterday, 09:52 AM', '$6,200.00', 'Card Payment', 0.88, 'high', 'Rapid transaction velocity burst', 'Flagged', None),
                    ('TX-9810', 'Yesterday, 08:30 AM', '$9,400.00', 'ACH Transfer', 0.74, 'medium', 'Off-hours anomaly spike', 'Reviewing', None),
                    ('TX-9794', 'Yesterday, 11:15 PM', '$1,850.00', 'Online Checkout', 0.62, 'medium', 'Unusual merchant category code', 'Reviewing', None),
                    ('TX-9781', 'Yesterday, 06:40 PM', '$240.00', 'Card Payment', 0.12, 'low', 'Typical recurring subscription pattern', 'Cleared', None),
                    ('TX-9765', 'Yesterday, 03:10 PM', '$520.00', 'ACH Transfer', 0.08, 'low', 'Consistent scheduled payroll deposit', 'Cleared', None),
                ]
                cursor.executemany("""
                    INSERT INTO transactions (id, timestamp, amount, type, score, risk, signal, status, raw_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, initial_seed)
                conn.commit()
                print("SQLite database initialized and seeded with demo transactions.")
    except Exception as e:
        print(f"Failed to initialize SQLite database: {e}")

init_db()


# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)


# ── Load ML model ─────────────────────────────────────────────────────────────
try:
    model = joblib.load(MODEL_PATH)
    print("Fraud detection model loaded successfully.")
except Exception as e:
    model = None
    print(f"Failed to load the fraud detection model: {e}")

try:
    with open(THRESHOLD_PATH, "r") as f:
        FRAUD_THRESHOLD = float(f.read().strip())
    print(f"Fraud threshold loaded: {FRAUD_THRESHOLD}")
except Exception as e:
    FRAUD_THRESHOLD = 0.90
    print(f"Using default threshold: {FRAUD_THRESHOLD}")


# ── ML Feature columns (exact order expected by LightGBM model) ───────────────
ML_FEATURES = [
    "step", "amount", "oldbalanceOrg", "newbalanceOrig",
    "oldbalanceDest", "newbalanceDest",
    "type_CASH_IN", "type_CASH_OUT", "type_DEBIT", "type_PAYMENT", "type_TRANSFER"
]


# ═══════════════════════════════════════════════════════════════════════════════
#  SYNTHETIC DATA GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

GLOBAL_CITIES = [
    "New York", "San Francisco", "London", "Chicago", "Boston",
    "Los Angeles", "Seattle", "Toronto", "Frankfurt", "Tokyo",
    "Singapore", "Sydney", "Miami", "Austin", "Denver"
]

DEVICE_TYPES = [
    "Mobile (Android)", "Mobile (iOS)", "Desktop (Windows)",
    "Desktop (Mac)", "Tablet (iOS)", "Unknown Device"
]

PAYMENT_METHODS = ["Wire Transfer", "Cash Out", "Merchant Payment", "Account Deposit", "Debit Purchase"]

_cust_counter = 10000
_cust_lock = threading.Lock()

def _next_customer_id():
    global _cust_counter
    with _cust_lock:
        _cust_counter += 1
        return f"CUST-{_cust_counter}"

def _next_txn_id():
    return f"TXN-{random.randint(100000, 999999)}"

def _next_case_id():
    # Format: FG-YYYY-NNNNNN
    year = datetime.now().year
    num = random.randint(1000, 99999)
    return f"FG-{year}-{num:06d}"

def _random_ip():
    return f"{random.randint(10,223)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"

def _step_from_hour(hour):
    """Approximate 'step' (hours from epoch) — used by model as temporal feature."""
    return hour + random.randint(0, 743)  # Within a 31-day window

# ── Realistic LEGITIMATE pattern generator ────────────────────────────────────
def generate_legitimate_transaction():
    """
    Generate a realistic legitimate transaction.
    Patterns: routine payments, normal transfers with healthy sender balance,
              deposits, small debit purchases.
    The model will score these — we do NOT force a low probability.
    """
    tx_class = random.choices(
        ["PAYMENT", "CASH_IN", "DEBIT", "TRANSFER"],
        weights=[45, 25, 20, 10],
        k=1
    )[0]

    now = datetime.now()
    hour = now.hour

    if tx_class == "PAYMENT":
        # Routine merchant payment — small to medium amount, balance remains healthy
        amount = round(random.uniform(100, 8000), 2)
        old_orig = round(random.uniform(amount * 2, amount * 20), 2)
        new_orig = round(old_orig - amount, 2)
        old_dest = round(random.uniform(5000, 500000), 2)
        new_dest = round(old_dest + amount, 2)
        step = _step_from_hour(hour)
        features = {
            "step": step, "amount": amount,
            "oldbalanceOrg": old_orig, "newbalanceOrig": new_orig,
            "oldbalanceDest": old_dest, "newbalanceDest": new_dest,
            "type_CASH_IN": 0, "type_CASH_OUT": 0, "type_DEBIT": 0,
            "type_PAYMENT": 1, "type_TRANSFER": 0,
        }
        payment_method = "Merchant Payment"

    elif tx_class == "CASH_IN":
        # Normal deposit — money arriving into an account
        amount = round(random.uniform(500, 50000), 2)
        old_orig = round(random.uniform(1000, 200000), 2)
        new_orig = round(old_orig + amount, 2)
        old_dest = round(random.uniform(1000, 100000), 2)
        new_dest = round(old_dest - amount, 2)
        step = _step_from_hour(hour)
        features = {
            "step": step, "amount": amount,
            "oldbalanceOrg": old_orig, "newbalanceOrig": new_orig,
            "oldbalanceDest": old_dest, "newbalanceDest": new_dest,
            "type_CASH_IN": 1, "type_CASH_OUT": 0, "type_DEBIT": 0,
            "type_PAYMENT": 0, "type_TRANSFER": 0,
        }
        payment_method = "Account Deposit"

    elif tx_class == "DEBIT":
        # Small debit purchase
        amount = round(random.uniform(50, 3000), 2)
        old_orig = round(random.uniform(amount * 3, amount * 30), 2)
        new_orig = round(old_orig - amount, 2)
        old_dest = round(random.uniform(10000, 500000), 2)
        new_dest = round(old_dest + amount, 2)
        step = _step_from_hour(hour)
        features = {
            "step": step, "amount": amount,
            "oldbalanceOrg": old_orig, "newbalanceOrig": new_orig,
            "oldbalanceDest": old_dest, "newbalanceDest": new_dest,
            "type_CASH_IN": 0, "type_CASH_OUT": 0, "type_DEBIT": 1,
            "type_PAYMENT": 0, "type_TRANSFER": 0,
        }
        payment_method = "Debit Purchase"

    else:  # TRANSFER — normal with good remaining balance
        amount = round(random.uniform(1000, 30000), 2)
        old_orig = round(random.uniform(amount * 3, amount * 15), 2)
        new_orig = round(old_orig - amount, 2)
        old_dest = round(random.uniform(5000, 300000), 2)
        new_dest = round(old_dest + amount, 2)
        step = _step_from_hour(hour)
        features = {
            "step": step, "amount": amount,
            "oldbalanceOrg": old_orig, "newbalanceOrig": new_orig,
            "oldbalanceDest": old_dest, "newbalanceDest": new_dest,
            "type_CASH_IN": 0, "type_CASH_OUT": 0, "type_DEBIT": 0,
            "type_PAYMENT": 0, "type_TRANSFER": 1,
        }
        payment_method = "Wire Transfer"

    meta = {
        "transaction_id": _next_txn_id(),
        "customer_id": _next_customer_id(),
        "location": random.choice(GLOBAL_CITIES),
        "device_type": random.choice(DEVICE_TYPES),
        "ip_address": _random_ip(),
        "payment_method": payment_method,
        "ground_truth": "LEGITIMATE",
        "tx_class": tx_class,
    }
    return features, meta


# ── Realistic FRAUDULENT pattern generator ────────────────────────────────────
def generate_fraudulent_transaction():
    """
    Generate a realistic fraudulent transaction pattern matching what the model
    actually identifies. Based on PaySim training data analysis: the model reliably
    flags FRAUD on TRANSFER and CASH_OUT transactions where newbalanceOrig == 0
    (account completely drained).
    """
    fraud_class = random.choices(
        ["DRAIN_TRANSFER", "DRAIN_CASHOUT"],
        weights=[55, 45],
        k=1
    )[0]

    now = datetime.now()

    if fraud_class == "DRAIN_TRANSFER":
        amount = round(random.uniform(10000, 150000), 2)
        old_orig = amount  # Balance exactly equals the transfer — common in stolen-account fraud
        new_orig = 0.0    # Fully drained
        old_dest = round(random.uniform(0, 5000), 2)   # New/lightly-used mule account
        new_dest = round(old_dest + amount, 2)
        step = random.randint(1, 15)  # Early step: burst transfer
        features = {
            "step": step, "amount": amount,
            "oldbalanceOrg": old_orig, "newbalanceOrig": new_orig,
            "oldbalanceDest": old_dest, "newbalanceDest": new_dest,
            "type_CASH_IN": 0, "type_CASH_OUT": 0, "type_DEBIT": 0,
            "type_PAYMENT": 0, "type_TRANSFER": 1,
        }
        payment_method = "Wire Transfer"
        tx_class = "TRANSFER"

    else:  # DRAIN_CASHOUT
        amount = round(random.uniform(5000, 100000), 2)
        old_orig = amount  # Balance equals withdrawal
        new_orig = 0.0    # Fully drained
        old_dest = round(random.uniform(0, 80000), 2)
        new_dest = round(old_dest + amount, 2)
        step = random.randint(1, 20)
        features = {
            "step": step, "amount": amount,
            "oldbalanceOrg": old_orig, "newbalanceOrig": new_orig,
            "oldbalanceDest": old_dest, "newbalanceDest": new_dest,
            "type_CASH_IN": 0, "type_CASH_OUT": 1, "type_DEBIT": 0,
            "type_PAYMENT": 0, "type_TRANSFER": 0,
        }
        payment_method = "Cash Out"
        tx_class = "CASH_OUT"

    meta = {
        "transaction_id": _next_txn_id(),
        "customer_id": _next_customer_id(),
        "location": random.choice(GLOBAL_CITIES),
        "device_type": random.choice(DEVICE_TYPES),
        "ip_address": _random_ip(),
        "payment_method": payment_method,
        "ground_truth": "FRAUD",
        "tx_class": tx_class,
    }
    return features, meta


# ── Run transaction through existing ML pipeline ──────────────────────────────
def run_ml_pipeline(features: dict):
    """
    Pass the 11-feature dict through the exact same pipeline as /api/predict.
    Returns (fraud_probability, model_prediction, risk_level).
    """
    if model is None:
        raise RuntimeError("ML model not loaded")

    df = pd.DataFrame([features])[ML_FEATURES]

    prob = float(model.predict_proba(df)[0][1])
    prediction = "FRAUD" if prob >= FRAUD_THRESHOLD else "LEGITIMATE"

    # Strictly align risk_level with prediction and fraud probability
    if prediction == "FRAUD":
        risk_level = "high"
    elif prob >= 0.35:
        risk_level = "medium"
    else:
        risk_level = "low"

    return prob, prediction, risk_level


# ═══════════════════════════════════════════════════════════════════════════════
#  SIMULATION ENGINE (background thread)
# ═══════════════════════════════════════════════════════════════════════════════

class SimulationEngine:
    RATES = {"slow": 5, "normal": 20, "fast": 50}
    SCENARIO_FRAUD_RATIOS = {
        "normal":  0.05,   # ~5% fraud patterns
        "mixed":   0.20,   # ~20% fraud patterns
        "spike":   0.50,   # ~50% fraud patterns
    }

    def __init__(self):
        self._thread = None
        self._stop_event = threading.Event()
        self._pause_event = threading.Event()   # Set = running, Clear = paused
        self._pause_event.set()

        self.status = "STOPPED"   # RUNNING | PAUSED | STOPPED
        self.rate = 20            # events per minute
        self.scenario = "normal"  # normal | mixed | spike
        self.events_generated = 0
        self.cases_registered = 0
        self.fraud_events = 0
        self._lock = threading.Lock()

        # SSE subscribers {id: queue}
        self._subscribers = {}
        self._sub_lock = threading.Lock()

    # ── Subscriber management ──────────────────────────────────────────────
    def subscribe(self):
        sid = str(uuid.uuid4())
        q = []
        with self._sub_lock:
            self._subscribers[sid] = q
        return sid, q

    def unsubscribe(self, sid):
        with self._sub_lock:
            self._subscribers.pop(sid, None)

    def _broadcast(self, event_type: str, data: dict):
        payload = json.dumps({"type": event_type, "data": data, "ts": _now_iso()})
        with self._sub_lock:
            for q in self._subscribers.values():
                q.append(payload)

    # ── Controls ───────────────────────────────────────────────────────────
    def start(self):
        with self._lock:
            if self.status == "RUNNING":
                return
            self._stop_event.clear()
            self._pause_event.set()
            self.status = "RUNNING"
            if self._thread is None or not self._thread.is_alive():
                self._thread = threading.Thread(target=self._run_loop, daemon=True)
                self._thread.start()

    def pause(self):
        with self._lock:
            if self.status == "RUNNING":
                self._pause_event.clear()
                self.status = "PAUSED"
        self._broadcast("status", self._status_dict())

    def resume(self):
        with self._lock:
            if self.status == "PAUSED":
                self._pause_event.set()
                self.status = "RUNNING"
        self._broadcast("status", self._status_dict())

    def reset(self):
        with self._lock:
            self._stop_event.set()
            self._pause_event.set()  # Unblock so thread can exit
            self.status = "STOPPED"
            self.events_generated = 0
            self.cases_registered = 0
            self.fraud_events = 0
        self._thread = None
        # Clear simulation timeline
        try:
            with get_db() as conn:
                conn.execute("DELETE FROM simulation_timeline")
                conn.commit()
        except Exception:
            pass
        self._broadcast("status", self._status_dict())
        self._broadcast("stats", self._compute_stats())

    def configure(self, rate=None, scenario=None):
        with self._lock:
            if rate is not None:
                if isinstance(rate, str):
                    self.rate = self.RATES.get(rate, 20)
                else:
                    self.rate = max(1, min(100, int(rate)))
            if scenario is not None and scenario in self.SCENARIO_FRAUD_RATIOS:
                self.scenario = scenario

    def _status_dict(self):
        with self._lock:
            return {
                "status": self.status,
                "rate": self.rate,
                "scenario": self.scenario,
                "events_generated": self.events_generated,
                "cases_registered": self.cases_registered,
                "fraud_events": self.fraud_events,
            }

    # ── Background loop ────────────────────────────────────────────────────
    def _run_loop(self):
        while not self._stop_event.is_set():
            # Respect pause
            self._pause_event.wait()
            if self._stop_event.is_set():
                break

            start_t = time.monotonic()

            try:
                self._generate_one_event()
            except Exception as e:
                print(f"[SIM] Event generation error: {e}")

            with self._lock:
                rate = self.rate

            # Sleep remainder of (60 / rate) seconds
            sleep_t = max(0.0, (60.0 / rate) - (time.monotonic() - start_t))
            # Use small-step sleep so we can react to stop/pause quickly
            elapsed = 0
            while elapsed < sleep_t and not self._stop_event.is_set():
                chunk = min(0.25, sleep_t - elapsed)
                time.sleep(chunk)
                elapsed += chunk
                if not self._pause_event.is_set():
                    self._pause_event.wait()

    def _generate_one_event(self):
        """Core pipeline: generate → ML inference → store → broadcast."""
        with self._lock:
            fraud_ratio = self.SCENARIO_FRAUD_RATIOS.get(self.scenario, 0.05)
            scenario = self.scenario

        is_fraud_pattern = random.random() < fraud_ratio

        # 1. Generate realistic pattern
        if is_fraud_pattern:
            features, meta = generate_fraudulent_transaction()
        else:
            features, meta = generate_legitimate_transaction()

        # 2. Run through existing ML pipeline (never force outcome)
        prob, ml_prediction, risk_level = run_ml_pipeline(features)

        # 3. Compose full event record
        amount_raw = features["amount"]
        amount_str = f"${amount_raw:,.2f}"
        now_iso = _now_iso()
        tx_id = meta["transaction_id"]
        case_id = None
        alert_id = None

        # Determine if we register a case (all high-risk or fraud-pattern events)
        register_case = (risk_level == "high" or ml_prediction == "FRAUD")

        if register_case:
            case_id = _next_case_id()
            alert_id = f"ALT-{uuid.uuid4().hex[:8].upper()}"

        # Build transaction record
        tx_signal = (
            f"[SIM] ML Flagged (p={prob:.3f} ≥ {FRAUD_THRESHOLD})"
            if ml_prediction == "FRAUD"
            else f"[SIM] ML Verified (p={prob:.3f} < {FRAUD_THRESHOLD})"
        )
        tx_status = "Flagged" if ml_prediction == "FRAUD" else (
            "Reviewing" if risk_level == "medium" else "Cleared"
        )

        # 4. Persist to SQLite
        with get_db() as conn:
            cursor = conn.cursor()

            # Save transaction
            cursor.execute("""
                INSERT OR REPLACE INTO transactions
                    (id, timestamp, amount, type, score, risk, signal, status,
                     raw_data, created_at, case_id, customer_id, location,
                     device_type, ip_address, payment_method,
                     ground_truth, model_prediction, fraud_probability, is_synthetic)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (
                tx_id, "Just now", amount_str, meta["tx_class"], prob, risk_level,
                tx_signal, tx_status,
                json.dumps(features), now_iso,
                case_id, meta["customer_id"], meta["location"],
                meta["device_type"], meta["ip_address"], meta["payment_method"],
                meta["ground_truth"], ml_prediction, prob,
            ))

            # Save case if applicable
            if case_id:
                summary = (
                    f"[SIM] {meta['ground_truth']} pattern detected via simulation. "
                    f"ML prediction: {ml_prediction} (p={prob:.3f}). "
                    f"Payment: {meta['payment_method']}, Location: {meta['location']}."
                )
                cursor.execute("""
                    INSERT OR REPLACE INTO cases
                        (id, transaction_id, customer_id, amount, amount_raw,
                         payment_method, location, device_type, risk_level,
                         fraud_probability, prediction, ground_truth,
                         status, source, summary, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    case_id, tx_id, meta["customer_id"], amount_str, amount_raw,
                    meta["payment_method"], meta["location"], meta["device_type"],
                    risk_level, prob, ml_prediction, meta["ground_truth"],
                    "Under Investigation", "LIVE SIMULATION", summary, now_iso,
                ))

            # Save alert if applicable
            if alert_id and case_id:
                alert_title = "High-risk transaction detected"
                alert_body = (
                    f"{amount_str} • {meta['payment_method']} • "
                    f"Fraud probability: {prob*100:.1f}% • Case {case_id}"
                )
                cursor.execute("""
                    INSERT OR REPLACE INTO alerts
                        (id, case_id, transaction_id, title, body, amount,
                         risk_level, fraud_probability, alert_type, severity,
                         read, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
                """, (
                    alert_id, case_id, tx_id, alert_title, alert_body,
                    amount_str, risk_level, prob,
                    "HIGH_RISK" if ml_prediction == "FRAUD" else "MEDIUM_RISK",
                    "High" if risk_level == "high" else "Medium",
                    now_iso,
                ))

            # Update simulation timeline
            minute_slot = datetime.now(timezone.utc).strftime("%H:%M")
            cursor.execute("""
                INSERT INTO simulation_timeline
                    (minute_slot, happening_count, reported_count,
                     actual_fraud_count, ml_fraud_count, created_at)
                VALUES (?, 1, ?, ?, ?, ?)
            """, (
                minute_slot,
                1 if register_case else 0,
                1 if meta["ground_truth"] == "FRAUD" else 0,
                1 if ml_prediction == "FRAUD" else 0,
                now_iso,
            ))

            conn.commit()

        # 5. Update counters
        with self._lock:
            self.events_generated += 1
            if register_case:
                self.cases_registered += 1
            if meta["ground_truth"] == "FRAUD":
                self.fraud_events += 1

        # 6. Broadcast SSE events
        tx_payload = {
            "id": tx_id,
            "amount": amount_str,
            "amount_raw": amount_raw,
            "type": meta["tx_class"],
            "payment_method": meta["payment_method"],
            "location": meta["location"],
            "device_type": meta["device_type"],
            "risk": risk_level,
            "score": prob,
            "fraud_probability": prob,
            "ground_truth": meta["ground_truth"],
            "model_prediction": ml_prediction,
            "status": tx_status,
            "is_synthetic": True,
            "timestamp": now_iso,
        }
        self._broadcast("transaction", tx_payload)

        if case_id:
            case_payload = {
                "id": case_id,
                "transaction_id": tx_id,
                "amount": amount_str,
                "amount_raw": amount_raw,
                "payment_method": meta["payment_method"],
                "location": meta["location"],
                "risk_level": risk_level,
                "fraud_probability": prob,
                "prediction": ml_prediction,
                "ground_truth": meta["ground_truth"],
                "status": "Under Investigation",
                "source": "LIVE SIMULATION",
                "timestamp": now_iso,
            }
            self._broadcast("case", case_payload)

        if alert_id and case_id:
            alert_payload = {
                "id": alert_id,
                "case_id": case_id,
                "transaction_id": tx_id,
                "title": "High-risk transaction detected",
                "body": f"{amount_str} • {meta['payment_method']} • Fraud probability: {prob*100:.1f}% • Case {case_id}",
                "amount": amount_str,
                "risk_level": risk_level,
                "fraud_probability": prob,
                "severity": "High" if risk_level == "high" else "Medium",
                "read": 0,
                "timestamp": now_iso,
            }
            self._broadcast("alert", alert_payload)

        # Always broadcast updated stats
        self._broadcast("stats", self._compute_stats())

        # Broadcast timeline point
        minute_slot = datetime.now(timezone.utc).strftime("%H:%M")
        self._broadcast("timeline_point", {"minute": minute_slot})

    def _compute_stats(self):
        try:
            with get_db() as conn:
                cur = conn.cursor()
                cur.execute("SELECT COUNT(*) FROM cases")
                total_cases = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM cases WHERE prediction='FRAUD'")
                fraud_cases = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM cases WHERE status='Under Investigation'")
                under_investigation = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM cases WHERE fraud_probability >= 0.70")
                high_risk_cases = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM cases WHERE prediction='LEGITIMATE'")
                legitimate_cases = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM alerts WHERE read=0")
                active_alerts = cur.fetchone()[0]
            return {
                "total_cases": total_cases,
                "fraud_cases": fraud_cases,
                "active_alerts": active_alerts,
                "under_investigation": under_investigation,
                "high_risk_cases": high_risk_cases,
                "legitimate_cases": legitimate_cases,
            }
        except Exception:
            return {}


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


# ── Global simulation engine instance ────────────────────────────────────────
sim = SimulationEngine()


# ═══════════════════════════════════════════════════════════════════════════════
#  ORIGINAL API ENDPOINTS (preserved)
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "online",
        "message": "Fraud Detection Backend is running",
        "model_loaded": model is not None,
        "fraud_threshold": FRAUD_THRESHOLD
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy" if model is not None else "model_not_loaded",
        "model_loaded": model is not None,
        "fraud_threshold": FRAUD_THRESHOLD
    })


@app.route("/api/model-info", methods=["GET"])
def model_info():
    if model is None:
        return jsonify({"success": False, "error": "Fraud detection model is not loaded."}), 500
    info = {"success": True, "model_type": type(model).__name__}
    if hasattr(model, "n_features_in_"):
        info["n_features"] = int(model.n_features_in_)
    if hasattr(model, "feature_names_in_"):
        info["feature_names"] = model.feature_names_in_.tolist()
    if hasattr(model, "named_steps"):
        info["pipeline_steps"] = list(model.named_steps.keys())
        for step_name, step in model.named_steps.items():
            if hasattr(step, "feature_names_in_"):
                info[f"{step_name}_feature_names"] = step.feature_names_in_.tolist()
            if hasattr(step, "n_features_in_"):
                info[f"{step_name}_n_features"] = int(step.n_features_in_)
    return jsonify(info)


@app.route("/api/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"success": False, "error": "Fraud detection model is not loaded."}), 500
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No transaction data received."}), 400
        transaction = pd.DataFrame([data])
        if hasattr(model, "predict_proba"):
            probability = float(model.predict_proba(transaction)[0][1])
        else:
            probability = float(model.predict(transaction)[0])
        is_fraud = probability >= FRAUD_THRESHOLD
        risk_score = round(probability * 100, 2)
        status = "FRAUD" if is_fraud else "LEGITIMATE"
        result = {
            "success": True, "status": status, "is_fraud": bool(is_fraud),
            "fraud_probability": round(probability, 6),
            "risk_score": risk_score, "threshold": FRAUD_THRESHOLD
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/api/predict/batch", methods=["POST"])
def predict_batch():
    if model is None:
        return jsonify({"success": False, "error": "Fraud detection model is not loaded."}), 500
    try:
        data = request.get_json()
        if not isinstance(data, list) or len(data) == 0:
            return jsonify({"success": False, "error": "Expected a non-empty list of transactions."}), 400
        transactions = pd.DataFrame(data)
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(transactions)[:, 1]
        else:
            probabilities = model.predict(transactions)
        results = []
        for probability in probabilities:
            probability = float(probability)
            is_fraud = probability >= FRAUD_THRESHOLD
            results.append({
                "status": "FRAUD" if is_fraud else "LEGITIMATE",
                "is_fraud": bool(is_fraud),
                "fraud_probability": round(probability, 6),
                "risk_score": round(probability * 100, 2)
            })
        fraud_count = sum(r["is_fraud"] for r in results)
        total_transactions = len(results)
        return jsonify({
            "success": True,
            "total_transactions": total_transactions,
            "fraud_transactions": fraud_count,
            "legitimate_transactions": total_transactions - fraud_count,
            "fraud_rate": round((fraud_count / total_transactions) * 100, 2),
            "results": results,
            "predictions": results
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


# ── SQLite Persistent Transaction API ─────────────────────────────────────────

@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, timestamp, amount, type, score, risk, signal, status,
                       raw_data, created_at, case_id, customer_id, location,
                       device_type, ip_address, payment_method,
                       ground_truth, model_prediction, fraud_probability, is_synthetic
                FROM transactions ORDER BY created_at DESC
            """)
            rows = cursor.fetchall()
            transactions = [dict(row) for row in rows]
            for tx in transactions:
                if tx.get("raw_data"):
                    try:
                        tx["raw_data"] = json.loads(tx["raw_data"])
                    except Exception:
                        pass
                if tx.get("score") is not None:
                    tx["score"] = float(tx["score"])
        return jsonify({"success": True, "count": len(transactions), "transactions": transactions})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/transactions", methods=["POST"])
def save_transaction():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No transaction data provided"}), 400
        tx_id = data.get("id") or f"TX-{random.randint(1000, 9999)}"
        timestamp = data.get("timestamp", "Just now")
        created_at = data.get("created_at") or datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        amount = data.get("amount", "$0.00")
        tx_type = data.get("type", "Transfer")
        score = float(data.get("score", 0.0))
        risk = data.get("risk", "low")
        signal = data.get("signal", "Normal transaction")
        status = data.get("status", "Cleared")
        raw_data = json.dumps(data.get("raw_data")) if data.get("raw_data") else None
        with get_db() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO transactions
                    (id, timestamp, amount, type, score, risk, signal, status, raw_data, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (tx_id, timestamp, amount, tx_type, score, risk, signal, status, raw_data, created_at))
            conn.commit()
        new_tx = {
            "id": tx_id, "timestamp": timestamp, "created_at": created_at,
            "amount": amount, "type": tx_type, "score": score,
            "risk": risk, "signal": signal, "status": status,
            "raw_data": data.get("raw_data")
        }
        return jsonify({"success": True, "transaction": new_tx}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/api/transactions/<tx_id>/status", methods=["PATCH"])
def update_transaction_status(tx_id):
    try:
        data = request.get_json()
        new_status = data.get("status") if data else None
        if not new_status:
            return jsonify({"success": False, "error": "Status is required"}), 400
        with get_db() as conn:
            conn.execute("UPDATE transactions SET status=? WHERE id=?", (new_status, tx_id))
            conn.commit()
        return jsonify({"success": True, "id": tx_id, "status": new_status})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


# ═══════════════════════════════════════════════════════════════════════════════
#  NEW SIMULATION & LIVE API ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/simulation/start", methods=["POST"])
def simulation_start():
    try:
        data = request.get_json(silent=True) or {}
        if data.get("rate"):
            sim.configure(rate=data["rate"])
        if data.get("scenario"):
            sim.configure(scenario=data["scenario"])
        if sim.status == "PAUSED":
            sim.resume()
        else:
            sim.start()
        return jsonify({"success": True, **sim._status_dict()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/simulation/pause", methods=["POST"])
def simulation_pause():
    try:
        sim.pause()
        return jsonify({"success": True, **sim._status_dict()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/simulation/reset", methods=["POST"])
def simulation_reset():
    try:
        sim.reset()
        return jsonify({"success": True, **sim._status_dict()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/simulation/config", methods=["POST"])
def simulation_config():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No config data"}), 400
        sim.configure(
            rate=data.get("rate"),
            scenario=data.get("scenario"),
        )
        return jsonify({"success": True, **sim._status_dict()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/simulation/status", methods=["GET"])
def simulation_status():
    try:
        return jsonify({"success": True, **sim._status_dict()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/live/events")
def live_events():
    """Server-Sent Events (SSE) stream for real-time dashboard updates."""
    sid, q = sim.subscribe()

    @stream_with_context
    def generate():
        # Send initial status + stats on connect
        yield f"data: {json.dumps({'type': 'status', 'data': sim._status_dict(), 'ts': _now_iso()})}\n\n"
        yield f"data: {json.dumps({'type': 'stats', 'data': sim._compute_stats(), 'ts': _now_iso()})}\n\n"

        # Send heartbeat and any queued events
        heartbeat_interval = 15  # seconds
        last_heartbeat = time.monotonic()

        try:
            while True:
                # Drain queue
                while q:
                    payload = q.pop(0)
                    yield f"data: {payload}\n\n"

                # Heartbeat
                if time.monotonic() - last_heartbeat >= heartbeat_interval:
                    yield f"data: {json.dumps({'type': 'heartbeat', 'ts': _now_iso()})}\n\n"
                    last_heartbeat = time.monotonic()

                time.sleep(0.2)
        finally:
            sim.unsubscribe(sid)

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


@app.route("/api/dashboard/stats", methods=["GET"])
def dashboard_stats():
    try:
        stats = sim._compute_stats()
        stats["simulation"] = sim._status_dict()
        return jsonify({"success": True, **stats})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/dashboard/fraud-timeline", methods=["GET"])
def fraud_timeline():
    """
    Aggregate simulation_timeline rows by minute_slot and return the last N minutes.
    Returns four series: happening, reported, actual_fraud, ml_fraud.
    """
    try:
        limit = int(request.args.get("limit", 20))
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT minute_slot,
                       SUM(happening_count)    AS happening,
                       SUM(reported_count)     AS reported,
                       SUM(actual_fraud_count) AS actual_fraud,
                       SUM(ml_fraud_count)     AS ml_fraud
                FROM simulation_timeline
                GROUP BY minute_slot
                ORDER BY minute_slot DESC
                LIMIT ?
            """, (limit,))
            rows = cur.fetchall()
        # Reverse so oldest → newest
        timeline = [
            {
                "minute": r["minute_slot"],
                "happening": r["happening"],
                "reported": r["reported"],
                "actual_fraud": r["actual_fraud"],
                "ml_fraud": r["ml_fraud"],
            }
            for r in reversed(rows)
        ]
        return jsonify({"success": True, "timeline": timeline})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/cases", methods=["GET"])
def get_cases():
    try:
        limit = int(request.args.get("limit", 50))
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, transaction_id, customer_id, amount, amount_raw,
                       payment_method, location, device_type, risk_level,
                       fraud_probability, prediction, ground_truth,
                       status, source, analyst, summary, created_at
                FROM cases
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))
            rows = cur.fetchall()
        cases = [dict(r) for r in rows]
        return jsonify({"success": True, "count": len(cases), "cases": cases})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/cases", methods=["POST"])
def create_case():
    """Manually create a case (from the New Case modal or other UI action)."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No case data"}), 400
        case_id = data.get("id") or _next_case_id()
        now_iso = _now_iso()
        with get_db() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO cases
                    (id, transaction_id, customer_id, amount, amount_raw,
                     payment_method, location, device_type, risk_level,
                     fraud_probability, prediction, ground_truth,
                     status, source, analyst, summary, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                case_id,
                data.get("transaction_id", ""),
                data.get("customer_id", ""),
                data.get("amount", ""),
                data.get("amount_raw", 0),
                data.get("payment_method", ""),
                data.get("location", ""),
                data.get("device_type", ""),
                data.get("risk_level", "low"),
                data.get("fraud_probability", 0),
                data.get("prediction", "LEGITIMATE"),
                data.get("ground_truth", ""),
                data.get("status", "Open"),
                data.get("source", "MANUAL"),
                data.get("analyst", "Mohit S."),
                data.get("summary", ""),
                now_iso,
            ))
            conn.commit()
        return jsonify({"success": True, "id": case_id}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/cases/<case_id>/status", methods=["PATCH"])
def update_case_status(case_id):
    try:
        data = request.get_json()
        new_status = data.get("status") if data else None
        if not new_status:
            return jsonify({"success": False, "error": "Status is required"}), 400
        with get_db() as conn:
            conn.execute("UPDATE cases SET status=? WHERE id=?", (new_status, case_id))
            conn.commit()
        return jsonify({"success": True, "id": case_id, "status": new_status})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    try:
        limit = int(request.args.get("limit", 50))
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, case_id, transaction_id, title, body, amount,
                       risk_level, fraud_probability, alert_type, severity,
                       read, created_at
                FROM alerts
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))
            rows = cur.fetchall()
        alerts = [dict(r) for r in rows]
        return jsonify({"success": True, "count": len(alerts), "alerts": alerts})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/alerts/<alert_id>/read", methods=["PATCH"])
def mark_alert_read(alert_id):
    try:
        with get_db() as conn:
            conn.execute("UPDATE alerts SET read=1 WHERE id=?", (alert_id,))
            conn.commit()
        stats = sim._compute_stats()
        sim._broadcast("stats", stats)
        return jsonify({"success": True, "id": alert_id, "stats": stats})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/alerts/read-all", methods=["POST"])
def mark_all_alerts_read():
    try:
        with get_db() as conn:
            conn.execute("UPDATE alerts SET read=1")
            conn.commit()
        stats = sim._compute_stats()
        sim._broadcast("stats", stats)
        return jsonify({"success": True, "stats": stats})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ── Start Flask ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Fraud Detection Backend with Live Simulation")
    print(f"Model path: {MODEL_PATH}")
    print(f"Fraud threshold: {FRAUD_THRESHOLD}")
    print("Server URL: http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)