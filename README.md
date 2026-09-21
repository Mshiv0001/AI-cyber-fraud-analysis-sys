# 🛡️ FraudGuard — Intelligent Fraud Detection & Artifact Correlator

> A real-time fraud detection platform that spots suspicious transactions, connects digital artifacts (IP, device, and ledger footprints), and flags high-risk activity using machine learning.

---

## 🌟 Features

- **Real-Time ML Fraud Scoring:** Evaluates transactions with sub-50ms latency using a temporal LightGBM model trained on financial transfer patterns.
- **Digital Artifact Correlator:** Connects fragmented evidence—IP addresses, device fingerprints, transaction velocity bursts, and balance anomalies—into unified investigation cases.
- **Live SSE Streaming Telemetry:** Server-Sent Events stream live transactions, alerts, and timeline telemetry straight to the dashboard.
- **Forensic Drawer & Case Management:** Inspect transaction metadata, add investigator notes, and transition case statuses (`Under Investigation`, `Resolved - Fraud`, `Cleared`).
- **Batch CSV Analysis:** Drag-and-drop CSV batch upload with instant risk breakdowns and a downloadable sample dataset.
- **Built-in Simulation Engine:** Test live bursts, normal traffic, and fraud spikes with adjustable playback speeds.
- **Adaptive UI:** Modern glassmorphic interface with full support for both Dark and Light themes.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **Python** (v3.10+ recommended)

### 2. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt   # or pip install flask flask-cors pandas lightgbm scikit-learn joblib
python app.py
```
*Backend runs on `http://localhost:5000`*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, TailwindCSS, Lucide Icons
- **Backend:** Python, Flask, Server-Sent Events (SSE), SQLite
- **Machine Learning:** LightGBM, Scikit-Learn, Pandas, NumPy
