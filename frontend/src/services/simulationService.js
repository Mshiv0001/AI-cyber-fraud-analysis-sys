/**
 * simulationService.js
 * Manages SSE connection and simulation API calls for FraudGuard Live Simulation.
 */

const API_BASE = 'http://localhost:5000';

// ── SSE Manager ───────────────────────────────────────────────────────────────
class SimulationSSEManager {
  constructor() {
    this._source = null;
    this._handlers = {}; // { eventType: [fn, fn, ...] }
    this._reconnectDelay = 1000;
    this._maxDelay = 30000;
    this._shouldConnect = false;
  }

  on(eventType, handler) {
    if (!this._handlers[eventType]) this._handlers[eventType] = [];
    this._handlers[eventType].push(handler);
    return this;
  }

  off(eventType, handler) {
    if (!this._handlers[eventType]) return;
    this._handlers[eventType] = this._handlers[eventType].filter(h => h !== handler);
    return this;
  }

  _emit(eventType, data) {
    const handlers = this._handlers[eventType] || [];
    handlers.forEach(h => { try { h(data); } catch (e) { console.warn('[SSE]', e); } });
    // Also emit to wildcard handlers
    (this._handlers['*'] || []).forEach(h => { try { h(eventType, data); } catch (e) { console.warn('[SSE]', e); } });
  }

  connect() {
    this._shouldConnect = true;
    this._connect();
  }

  disconnect() {
    this._shouldConnect = false;
    if (this._source) {
      this._source.close();
      this._source = null;
    }
  }

  _connect() {
    if (!this._shouldConnect) return;
    if (this._source) {
      this._source.close();
    }

    try {
      this._source = new EventSource(`${API_BASE}/api/live/events`);

      this._source.onopen = () => {
        this._reconnectDelay = 1000;
        this._emit('connected', {});
        console.log('[FraudGuard SSE] Connected to live events stream');
      };

      this._source.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type) {
            this._emit(msg.type, msg.data || msg);
          }
        } catch (e) {
          // Ignore parse errors
        }
      };

      this._source.onerror = () => {
        this._source?.close();
        this._source = null;
        if (this._shouldConnect) {
          console.warn(`[FraudGuard SSE] Disconnected. Reconnecting in ${this._reconnectDelay}ms...`);
          setTimeout(() => this._connect(), this._reconnectDelay);
          this._reconnectDelay = Math.min(this._reconnectDelay * 1.5, this._maxDelay);
        }
      };
    } catch (e) {
      console.warn('[FraudGuard SSE] Could not create EventSource:', e.message);
    }
  }
}

export const sseManager = new SimulationSSEManager();


// ── Simulation Control API ─────────────────────────────────────────────────────

/**
 * Start or resume the simulation.
 * @param {object} config - Optional { rate: number|string, scenario: string }
 */
export async function startSimulation(config = {}) {
  try {
    const res = await fetch(`${API_BASE}/api/simulation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Pause the running simulation.
 */
export async function pauseSimulation() {
  try {
    const res = await fetch(`${API_BASE}/api/simulation/pause`, { method: 'POST' });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Reset simulation counters and timeline.
 */
export async function resetSimulation() {
  try {
    const res = await fetch(`${API_BASE}/api/simulation/reset`, { method: 'POST' });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Update simulation config (rate and/or scenario).
 */
export async function configureSimulation(config) {
  try {
    const res = await fetch(`${API_BASE}/api/simulation/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Get current simulation status.
 */
export async function getSimulationStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/simulation/status`);
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}


// ── Dashboard Data API ─────────────────────────────────────────────────────────

export async function getDashboardStats() {
  try {
    const res = await fetch(`${API_BASE}/api/dashboard/stats`);
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function getFraudTimeline(limit = 20) {
  try {
    const res = await fetch(`${API_BASE}/api/dashboard/fraud-timeline?limit=${limit}`);
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function getCases(limit = 50) {
  try {
    const res = await fetch(`${API_BASE}/api/cases?limit=${limit}`);
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function getAlerts(limit = 50) {
  try {
    const res = await fetch(`${API_BASE}/api/alerts?limit=${limit}`);
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function markAlertRead(alertId) {
  try {
    const res = await fetch(`${API_BASE}/api/alerts/${alertId}/read`, { method: 'PATCH' });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function markAllAlertsRead() {
  try {
    const res = await fetch(`${API_BASE}/api/alerts/read-all`, { method: 'POST' });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}
