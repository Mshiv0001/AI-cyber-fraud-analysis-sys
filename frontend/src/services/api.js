const API_BASE_URL = 'http://localhost:5000';

/**
 * Check health of Flask ML backend
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`);
    }
    const data = await response.json();
    return { success: true, ...data };
  } catch (err) {
    console.warn('FraudGuard backend health check error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Format user transaction inputs into the exact 11 LightGBM model features
 * and send to POST /api/predict
 */
export async function predictTransaction(input) {
  const transactionType = (input.type || 'TRANSFER').toUpperCase();

  const payload = {
    step: Number(input.step ?? 1),
    amount: Number(input.amount ?? 0),
    oldbalanceOrg: Number(input.oldbalanceOrg ?? 0),
    newbalanceOrig: Number(input.newbalanceOrig ?? 0),
    oldbalanceDest: Number(input.oldbalanceDest ?? 0),
    newbalanceDest: Number(input.newbalanceDest ?? 0),
    type_CASH_IN: transactionType === 'CASH_IN' ? 1 : 0,
    type_CASH_OUT: transactionType === 'CASH_OUT' ? 1 : 0,
    type_DEBIT: transactionType === 'DEBIT' ? 1 : 0,
    type_PAYMENT: transactionType === 'PAYMENT' ? 1 : 0,
    type_TRANSFER: transactionType === 'TRANSFER' ? 1 : 0,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || `Prediction failed with status ${response.status}`);
    }

    return {
      success: true,
      data,
      payload,
    };
  } catch (err) {
    console.error('Prediction API call failed:', err);
    return {
      success: false,
      error: err.message || 'Failed to connect to backend.',
    };
  }
}

/**
 * Send batch of transactions to POST /api/predict/batch
 */
export async function predictBatch(transactions) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/predict/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(transactions),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || `Batch prediction failed with status ${response.status}`);
    }

    return { success: true, data };
  } catch (err) {
    console.error('Batch prediction failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all transactions from SQLite backend database
 */
export async function getTransactions() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    return { success: true, transactions: data.transactions || [] };
  } catch (err) {
    console.warn('Failed to fetch transactions from backend:', err.message);
    return { success: false, error: err.message, transactions: [] };
  }
}

/**
 * Save a newly scored transaction permanently to SQLite database
 */
export async function saveTransaction(tx) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(tx),
    });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    return { success: true, transaction: data.transaction };
  } catch (err) {
    console.warn('Failed to save transaction to backend:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Update transaction status in SQLite database
 */
export async function updateTransactionStatus(txId, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions/${txId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    return { success: true, ...data };
  } catch (err) {
    console.warn('Failed to update transaction status in backend:', err.message);
    return { success: false, error: err.message };
  }
}
