# FraudGuard — Antigravity Project Handoff

## Project
FraudGuard is a React + Flask fraud detection application. The frontend UI is complete visually. The next task is connecting the existing React UI to the working Flask API and saved LightGBM model.

## Workspace
`C:\Users\mshiv\my-new-app`

Structure:
```text
my-new-app/
├── backend/
│   ├── app.py
│   ├── fraud_model_temporal.pkl
│   ├── fraud_threshold.txt
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── FluidBackground.jsx
    │   │   ├── KPICards.jsx
    │   │   ├── QuickActions.jsx
    │   │   ├── QuoteCard.jsx
    │   │   ├── RecentActivity.jsx
    │   │   ├── SafetyBanner.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── TopBar.jsx
    │   │   ├── TransactionRiskAnalysis.jsx
    │   │   └── WelcomeHeader.jsx
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.css
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## Backend status — WORKING
Backend runs at `http://localhost:5000`.

`GET /api/health` returns:
```json
{
  "fraud_threshold": 0.9,
  "model_loaded": true,
  "status": "healthy"
}
```

The saved model is `backend/fraud_model_temporal.pkl`.
The saved threshold is `0.9`.

Model:
- Type: `LGBMClassifier`
- Features: 11

Expected features, exactly:
```text
step
amount
oldbalanceOrg
newbalanceOrig
oldbalanceDest
newbalanceDest
type_CASH_IN
type_CASH_OUT
type_DEBIT
type_PAYMENT
type_TRANSFER
```

## Working API
`POST http://localhost:5000/api/predict`

The endpoint accepts one transaction containing the 11 model features and returns:
- `success`
- `status`
- `is_fraud`
- `fraud_probability`
- `risk_score`
- `threshold`

A real test request successfully reached Flask, loaded the model, and returned:
```text
fraud_probability : 0.0
is_fraud          : False
risk_score        : 0.0
status            : LEGITIMATE
success            : True
threshold          : 0.9
```

This proves Flask → saved model → prediction → JSON response is working.

There is also:
`POST /api/predict/batch`

It returns:
- total_transactions
- fraud_transactions
- legitimate_transactions
- fraud_rate
- results

## Frontend status
The frontend visual design is complete. Preserve the current design.

Dashboard includes:
- Sidebar
- Top bar/search
- New Case
- KPI cards
- Transaction Risk Analysis
- Recent Activity
- Quick Actions
- Transaction table
- Filters
- Search
- Export action
- Dark/light UI

## Current frontend limitation
`frontend/src/components/TransactionRiskAnalysis.jsx` currently uses hardcoded demo data:
- `BATCH_DATA`
- `SUMMARY`

The sample rows and summary values are not live backend data.

The next implementation should replace hardcoded values with real backend-derived data where supported.

## Important modeling limitation
The ML model returns fraud probability/classification. It does NOT by itself explain why a transaction is suspicious.

Do not invent model explanations such as:
- Extreme amount outlier
- Rapid transaction velocity burst
- Off-hours anomaly spike
- Unusual merchant category code

unless a separate explainability/anomaly-analysis layer is implemented.

Do not present a hardcoded `99.2% Model Confidence` or accuracy as a live model metric unless it is backed by a documented evaluation result.

## Recommended implementation order
1. Inspect `frontend/src/components/QuickActions.jsx`.
2. Inspect `frontend/src/App.jsx`.
3. Inspect `frontend/src/components/TransactionRiskAnalysis.jsx`.
4. Connect an existing frontend action to `POST /api/predict`.
5. Preserve the existing UI.
6. Add CSV upload processing through a backend endpoint such as `/api/analyze-file`.
7. Replace hardcoded dashboard/table values with actual backend results.
8. Add persistent transaction/case/alert storage later.
9. Add analytics from real processed data.
10. Add authentication only if required.

## Immediate task
First inspect the existing frontend architecture and understand how `QuickActions.jsx`, `App.jsx`, and `TransactionRiskAnalysis.jsx` communicate.

Then make the smallest safe integration.

Do NOT:
- redesign the frontend
- retrain the model
- change model feature names
- guess missing model inputs
- replace working components unnecessarily

Target architecture:
```text
Existing React UI
      ↓
Axios/fetch
      ↓
Flask /api/predict
      ↓
fraud_model_temporal.pkl
      ↓
Real prediction
      ↓
Existing React UI
```

## Environment
Windows.
Backend: Python + Flask + Flask-CORS + pandas + joblib + scikit-learn + numpy.
Frontend: React + Vite.
Backend has been successfully tested on port 5000.
