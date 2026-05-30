/**
 * Live Telemetry — Real-time request stream, error rate monitor, and rate limiting panel.
 *
 * Exports: renderLiveTelemetry(container)
 *
 * Components:
 *   1. Live Request Stream — Terminal-style SSE feed, auto-scroll, 100 row limit
 *   2. Error Rate Monitor — Alert card with warning/critical thresholds
 *   3. Rate Limiting Events — Small event panel
 *
 * Data refresh: SSE for stream, every 10s for error rate and rate limiting
 */

/* ── Helpers ──────────────────────────────────────────────── */

/**
 * Sanitize a string for safe textContent rendering (XSS mitigation).
 * @param {string} value
 * @returns {string}
 */
function sanitizeLabel(value) {
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}

/**
 * Get chart colors matching the global theme.
 */
function getChartColors() {
  const isDark = document.documentElement.classList.contains('dark');
  const primary = isDark ? '#cebdff' : '#3730a3';
  const secondary = isDark ? '#a4c9ff' : '#6366f1';
  const text = isDark ? '#e0e3e5' : '#1e1b4b';
  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(30,27,75,0.06)';

  return {
    text,
    grid,
    primary,
    secondary,
    green: '#22c55e',
    amber: '#f59e0b',
    rose: '#f43f5e',
    cyan: '#06b6d4',
  };
}

/**
 * Safe chart render — destroys existing chart before creating new one.
 */
function safeRenderChart(canvasId, config) {
  if (typeof Chart === 'undefined') return;
  if (window.myCharts && window.myCharts[canvasId]) {
    window.myCharts[canvasId].destroy();
  }
  const el = document.getElementById(canvasId);
  if (el) {
    window.myCharts = window.myCharts || {};
    window.myCharts[canvasId] = new Chart(el, config);
  }
}

/* ── Live Stream ─────────────────────────────────────────── */

const MAX_LOG_ROWS = 100;

/**
 * Initialize the SSE live stream connection.
 * @param {HTMLElement} logContainer
 * @returns {EventSource}
 */
function initLiveStream(logContainer) {
  const backendUrl = window.location.origin.includes(':5173')
    ? 'http://localhost:8000'
    : '';

  const eventSource = new EventSource(`${backendUrl}/api/v1/stream`);

  eventSource.onmessage = (event) => {
    try {
      const entry = JSON.parse(event.data);

      const line = document.createElement('div');
      const statusGroup = Math.floor(entry.status / 100) * 100;
      line.className = `log-entry status-${statusGroup}`;

      const timestamp = sanitizeLabel(entry.timestamp || '--:--:--');
      const method = sanitizeLabel(entry.method || '?');
      const path = sanitizeLabel(entry.path || '/');
      const status = entry.status || 0;
      const duration = entry.duration_ms != null ? `${entry.duration_ms}ms` : '';

      line.textContent = `[${timestamp}] ${method} ${path} ${status} ${duration}`;
      logContainer.appendChild(line);

      // Keep max 100 rows
      while (logContainer.children.length > MAX_LOG_ROWS) {
        logContainer.removeChild(logContainer.firstChild);
      }

      // Auto-scroll to bottom
      logContainer.scrollTop = logContainer.scrollHeight;
    } catch (err) {
      console.error('Live stream parse error:', err);
    }
  };

  eventSource.onerror = () => {
    // SSE will auto-reconnect; add a visual indicator
    const existingIndicator = logContainer.querySelector('.stream-disconnected');
    if (!existingIndicator) {
      const indicator = document.createElement('div');
      indicator.className = 'stream-disconnected';
      indicator.textContent = 'Reconnecting...';
      logContainer.appendChild(indicator);
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  };

  return eventSource;
}

/* ── Main render function ───────────────────────────────── */

/**
 * Render the Live Telemetry section into the given container.
 * @param {HTMLElement} container
 * @returns {{ refresh: () => Promise<void>, stop: () => void }}
 */
export async function renderLiveTelemetry(container) {
  // Section title
  const titleEl = document.createElement('div');
  titleEl.className = 'dashboard-section-title';
  titleEl.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">satellite_alt</span> Live Telemetry';
  container.appendChild(titleEl);

  // Live Request Stream (full width, wrapped in a card)
  const streamSection = document.createElement('div');
  streamSection.className = 'chart-section';
  streamSection.innerHTML = `
    <div class="chart-header">
      <span class="material-symbols-outlined">terminal</span>
      <span>Live Request Stream</span>
      <span class="live-badge" style="margin-left: auto;">LIVE</span>
    </div>
    <div class="live-stream" id="live-stream-log" style="background: #0d1117; color: #e0e3e5; border: 1px solid rgba(255,255,255,0.08);"></div>
  `;
  container.appendChild(streamSection);



  // ── Initialize SSE live stream ───────────────────────────

  const logContainer = document.getElementById('live-stream-log');
  let eventSource = null;
  if (logContainer) {
    eventSource = initLiveStream(logContainer);
  }

  // ── Refresh cycle ────────────────────────────────────────

  async function refresh() {
    // Live telemetry updates via SSE, no polling/refresh query needed
  }

  return {
    refresh,
    stop: () => {
      if (eventSource) {
        eventSource.close();
      }
    },
  };
}
