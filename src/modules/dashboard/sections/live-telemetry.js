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

  // Live Request Stream (full width)
  const streamSection = document.createElement('div');
  streamSection.className = 'live-stream-section';
  streamSection.innerHTML = `
    <div class="live-stream-header">
      <span class="material-symbols-outlined">terminal</span>
      <span>Live Request Stream</span>
      <span class="live-badge">LIVE</span>
    </div>
    <div class="live-stream" id="live-stream-log"></div>
  `;
  container.appendChild(streamSection);

  // Bottom row: Error Rate + Rate Limiting
  const bottomGrid = document.createElement('div');
  bottomGrid.className = 'dashboard-charts-grid';

  // Error Rate Monitor
  const errorRateSection = document.createElement('div');
  errorRateSection.className = 'chart-section';
  errorRateSection.id = 'error-rate-monitor';
  errorRateSection.innerHTML = `
    <div class="chart-header">
      <span class="material-symbols-outlined">warning</span>
      <span>Error Rate Monitor</span>
    </div>
    <div class="error-rate-card" id="error-rate-card">
      <div class="error-rate-value" id="error-rate-value">—</div>
      <div class="error-rate-label">5xx errors / total requests</div>
      <div class="error-rate-bar">
        <div class="error-rate-fill" id="error-rate-fill"></div>
      </div>
      <div class="error-rate-status" id="error-rate-status">Calculating...</div>
    </div>
  `;
  bottomGrid.appendChild(errorRateSection);

  // Rate Limiting Events
  const rateLimitSection = document.createElement('div');
  rateLimitSection.className = 'chart-section';
  rateLimitSection.id = 'rate-limit-monitor';
  rateLimitSection.innerHTML = `
    <div class="chart-header">
      <span class="material-symbols-outlined">gpp_maybe</span>
      <span>Rate Limiting Events</span>
    </div>
    <div class="rate-limit-card" id="rate-limit-card">
      <div class="rate-limit-total" id="rate-limit-total">—</div>
      <div class="rate-limit-label">Total rate limit events</div>
      <div class="rate-limit-recent" id="rate-limit-recent">
        <div class="rate-limit-placeholder">Waiting for events...</div>
      </div>
    </div>
  `;
  bottomGrid.appendChild(rateLimitSection);

  container.appendChild(bottomGrid);

  // ── Initialize SSE live stream ───────────────────────────

  const logContainer = document.getElementById('live-stream-log');
  let eventSource = null;
  if (logContainer) {
    eventSource = initLiveStream(logContainer);
  }

  // ── Data fetch functions ─────────────────────────────────

  async function refreshErrorRate() {
    const promQuery = window.promQuery;
    if (!promQuery) return;

    const c = getChartColors();

    try {
      // Get 5xx errors
      const errorResults = await promQuery('sum by(status) (api_requests_total)');
      let totalErrors = 0;
      let totalRequests = 0;

      errorResults.forEach(r => {
        const status = parseInt(r.metric.status, 10) || 0;
        const count = parseFloat(r.value[1]) || 0;
        totalRequests += count;
        if (status >= 500) {
          totalErrors += count;
        }
      });

      const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

      const valueEl = document.getElementById('error-rate-value');
      const fillEl = document.getElementById('error-rate-fill');
      const statusEl = document.getElementById('error-rate-status');
      const cardEl = document.getElementById('error-rate-card');

      if (valueEl) valueEl.textContent = `${errorRate.toFixed(2)}%`;

      if (fillEl) {
        const fillWidth = Math.min(errorRate * 10, 100); // Scale: 10% error rate = full bar
        fillEl.style.width = `${fillWidth}%`;
      }

      if (statusEl && cardEl) {
        // Remove previous classes
        cardEl.classList.remove('warning', 'critical');

        if (errorRate > 5) {
          cardEl.classList.add('critical');
          fillEl.style.backgroundColor = c.rose;
          statusEl.textContent = '⚠ Critical: Error rate > 5%';
          statusEl.style.color = c.rose;
        } else if (errorRate > 1) {
          cardEl.classList.add('warning');
          fillEl.style.backgroundColor = c.amber;
          statusEl.textContent = 'Warning: Error rate > 1%';
          statusEl.style.color = c.amber;
        } else {
          fillEl.style.backgroundColor = c.green;
          statusEl.textContent = 'Healthy: Error rate < 1%';
          statusEl.style.color = c.green;
        }
      }
    } catch (err) {
      console.error('Error rate refresh error:', err);
    }
  }

  async function refreshRateLimiting() {
    const promQuery = window.promQuery;
    if (!promQuery) return;

    try {
      const results = await promQuery('sum(rate_limit_trigger_total)');
      const total = results.length > 0 ? parseFloat(results[0]?.value?.[1] || '0') : 0;

      const totalEl = document.getElementById('rate-limit-total');
      const recentEl = document.getElementById('rate-limit-recent');

      if (totalEl) totalEl.textContent = Math.round(total).toLocaleString();

      if (recentEl) {
        if (total > 0) {
          // Show recent rate limit events by endpoint
          const endpointResults = await promQuery('sum by(endpoint) (rate_limit_trigger_total)');
          if (endpointResults.length > 0) {
            recentEl.innerHTML = '';
            endpointResults.slice(0, 5).forEach(r => {
              const entry = document.createElement('div');
              entry.className = 'rate-limit-entry';
              entry.innerHTML = `
                <span class="rate-limit-endpoint">${sanitizeLabel(r.metric.endpoint || 'unknown')}</span>
                <span class="rate-limit-count">${Math.round(parseFloat(r.value[1])).toLocaleString()}</span>
              `;
              recentEl.appendChild(entry);
            });
          }
        } else {
          recentEl.innerHTML = '<div class="rate-limit-placeholder">Rate limiting not configured</div>';
        }
      }
    } catch {
      const totalEl = document.getElementById('rate-limit-total');
      const recentEl = document.getElementById('rate-limit-recent');
      if (totalEl) totalEl.textContent = 'N/A';
      if (recentEl) recentEl.innerHTML = '<div class="rate-limit-placeholder">Rate limiting metrics unavailable</div>';
    }
  }

  // ── Refresh cycle ────────────────────────────────────────

  async function refresh() {
    try {
      await Promise.allSettled([
        refreshErrorRate(),
        refreshRateLimiting(),
      ]);
    } catch (err) {
      console.error('Live Telemetry refresh error:', err);
    }
  }

  // Initial render
  await refresh();

  // Set up 10s refresh interval
  const intervalId = setInterval(refresh, 10000);

  return {
    refresh,
    stop: () => {
      clearInterval(intervalId);
      if (eventSource) {
        eventSource.close();
      }
    },
  };
}
