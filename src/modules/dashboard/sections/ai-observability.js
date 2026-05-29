/**
 * AI Observability — 5 charts demonstrating LLMOps capability.
 *
 * Exports: renderAIObservability(container)
 *
 * Charts:
 *   A. AI Intent Categories — Bar chart (5 categories)
 *   B. LLM Performance Profile — Dual-axis line chart (p50, p95, gen time)
 *   C. Token Consumption — Stacked area chart (input vs output)
 *   D. Estimated AI Cost — Financial metric card
 *   E. Cache Hit Rate — Gauge chart (doughnut)
 *
 * Data refresh: every 10s via setInterval
 */

/* ── Helpers ──────────────────────────────────────────────── */

/**
 * Sanitize a string for safe textContent rendering (XSS mitigation — T-05.2-02).
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
  const tertiary = isDark ? '#c4c1fb' : '#4f46e5';
  const text = isDark ? '#e0e3e5' : '#1e1b4b';
  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(30,27,75,0.06)';

  return {
    text,
    grid,
    primary,
    primaryAlpha: isDark ? 'rgba(206,189,255,0.15)' : 'rgba(55,48,163,0.1)',
    secondary,
    secondaryAlpha: isDark ? 'rgba(164,201,255,0.15)' : 'rgba(99,102,241,0.1)',
    tertiary,
    tertiaryAlpha: isDark ? 'rgba(196,193,251,0.15)' : 'rgba(79,70,229,0.1)',
    green: '#22c55e',
    greenAlpha: 'rgba(34,197,94,0.15)',
    amber: '#f59e0b',
    amberAlpha: 'rgba(245,158,11,0.15)',
    rose: '#f43f5e',
    roseAlpha: 'rgba(244,63,94,0.15)',
    cyan: '#06b6d4',
    cyanAlpha: 'rgba(6,182,212,0.15)',
    purple: '#a855f7',
    purpleAlpha: 'rgba(168,85,247,0.15)',
  };
}

/**
 * Shared Chart.js options for dark mode.
 */
function chartOptions(c, unit = '', extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeOutQuart' },
    plugins: {
      legend: { labels: { color: c.text, font: { family: "'JetBrains Mono', monospace", size: 10 } } },
      tooltip: {
        backgroundColor: c.text === '#e0e3e5' ? '#16191b' : '#ffffff',
        titleColor: c.text === '#e0e3e5' ? '#ffffff' : '#16191b',
        bodyColor: c.text === '#e0e3e5' ? '#e0e3e5' : '#16191b',
        borderColor: c.grid,
        borderWidth: 1,
        cornerRadius: 4,
        titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
        bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
      },
      ...extra.plugins || {},
    },
    scales: {
      x: { ticks: { color: c.text, font: { size: 9 } }, grid: { color: c.grid } },
      y: {
        beginAtZero: true,
        ticks: { color: c.text, font: { size: 9 }, callback: v => `${v} ${unit}` },
        grid: { color: c.grid },
      },
    },
    ...extra,
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

/**
 * Create a chart section element with header and canvas.
 */
function createChartSection(id, icon, title, extraHeaderContent) {
  const section = document.createElement('div');
  section.className = 'chart-section';
  section.id = id;

  const header = document.createElement('div');
  header.className = 'chart-header';
  header.innerHTML = `
    <span class="material-symbols-outlined">${icon}</span>
    <span>${sanitizeLabel(title)}</span>
  `;

  if (extraHeaderContent) {
    header.appendChild(extraHeaderContent);
  }

  section.appendChild(header);

  const container = document.createElement('div');
  container.className = 'dashboard-chart-canvas';
  const canvas = document.createElement('canvas');
  canvas.id = `${id}-canvas`;
  container.appendChild(canvas);
  section.appendChild(container);

  return { section, canvasId: `${id}-canvas` };
}

/* ── Main render function ───────────────────────────────── */

/**
 * Render the AI Observability section into the given container.
 * @param {HTMLElement} container
 * @returns {{ refresh: () => Promise<void>, stop: () => void }}
 */
export async function renderAIObservability(container) {
  // Section title
  const titleEl = document.createElement('div');
  titleEl.className = 'dashboard-section-title';
  titleEl.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">monitoring</span> AI Observability';
  container.appendChild(titleEl);

  // Charts grid
  const grid = document.createElement('div');
  grid.className = 'ai-section';

  // Chart A: AI Intent Categories (Bar Chart)
  const chartA = createChartSection('chart-intent', 'category', 'AI Intent Categories');
  grid.appendChild(chartA.section);

  // Chart B: LLM Performance (Dual-axis Line Chart)
  const chartB = createChartSection('chart-llm-performance', 'speed', 'LLM Performance');
  grid.appendChild(chartB.section);

  // Chart C: Token Consumption (Stacked Area Chart)
  const chartC = createChartSection('chart-tokens', 'token', 'Token Consumption');
  grid.appendChild(chartC.section);

  // Chart D: Estimated AI Cost (Financial Metric Card)
  const costCard = document.createElement('div');
  costCard.className = 'chart-section cost-card';
  costCard.id = 'cost-card';
  costCard.innerHTML = `
    <div class="chart-header">
      <span class="material-symbols-outlined">payments</span>
      <span>Estimated AI Cost</span>
    </div>
    <div class="cost-total" id="cost-total-value">$0.00</div>
    <div class="cost-breakdown">
      <div class="cost-item">
        <div class="cost-item-label">Avg Cost / Query</div>
        <div id="cost-avg-query">$0.00</div>
      </div>
      <div class="cost-item">
        <div class="cost-item-label">Cost Today (24h)</div>
        <div id="cost-today">$0.00</div>
      </div>
      <div class="cost-item">
        <div class="cost-item-label">Cost / Session</div>
        <div id="cost-per-session">$0.00</div>
      </div>
      <div class="cost-item">
        <div class="cost-item-label">Total Queries</div>
        <div id="cost-total-queries">0</div>
      </div>
    </div>
  `;
  grid.appendChild(costCard);

  // Chart E: Cache Hit Rate (Gauge Chart)
  const gaugeSection = document.createElement('div');
  gaugeSection.className = 'chart-section';
  gaugeSection.id = 'chart-cache';
  gaugeSection.innerHTML = `
    <div class="chart-header">
      <span class="material-symbols-outlined">cached</span>
      <span>Cache Hit Rate</span>
    </div>
    <div class="gauge-container">
      <canvas id="chart-cache-canvas"></canvas>
      <div class="gauge-value" id="gauge-cache-value">—</div>
    </div>
  `;
  grid.appendChild(gaugeSection);

  container.appendChild(grid);

  // ── Data fetch functions ─────────────────────────────────

  async function refreshIntentChart() {
    const promQuery = window.promQuery;
    if (!promQuery) return;

    const c = getChartColors();
    const results = await promQuery('sum by(category) (chatbot_queries_total)');

    if (results.length > 0) {
      // Ensure we have exactly 5 categories with consistent colors
      const categoryOrder = ['RAG Retrieval', 'General Info', 'Skills Audit', 'Project Detail', 'Chitchat'];
      const categoryColors = [c.primary, c.secondary, c.tertiary, c.cyan, c.green];

      // Build ordered data
      const dataMap = {};
      results.forEach(r => {
        const cat = r.metric.category || 'unknown';
        dataMap[cat] = parseFloat(r.value[1]);
      });

      const labels = categoryOrder.filter(cat => cat in dataMap || results.some(r => r.metric.category === cat));
      const data = labels.map(cat => dataMap[cat] || 0);
      const colors = labels.map((_, i) => categoryColors[i % categoryColors.length]);

      safeRenderChart(chartA.canvasId, {
        type: 'bar',
        data: {
          labels: labels.map(l => sanitizeLabel(l)),
          datasets: [{
            label: 'Queries',
            data: data,
            backgroundColor: colors,
            borderRadius: 6,
            borderWidth: 0,
          }],
        },
        options: chartOptions(c, 'queries', {
          plugins: { legend: { display: false } },
        }),
      });
    }
  }

  async function refreshLLMPerformanceChart() {
    const promRange = window.promRange;
    if (!promRange) return;

    const c = getChartColors();

    // Fetch p50, p95 API latency and LLM generation time
    const p50Results = await promRange('histogram_quantile(0.5, sum(rate(api_request_duration_seconds_bucket[5m])) by (le))');
    const p95Results = await promRange('histogram_quantile(0.95, sum(rate(api_request_duration_seconds_bucket[5m])) by (le))');
    const llmResults = await promRange('sum(rate(chatbot_llm_duration_seconds_sum[5m])) / sum(rate(chatbot_llm_duration_seconds_count[5m]))');

    const p50Pts = p50Results[0]?.values || [];
    const p95Pts = p95Results[0]?.values || [];
    const llmPts = llmResults[0]?.values || [];

    if (p50Pts.length > 0) {
      safeRenderChart(chartB.canvasId, {
        type: 'line',
        data: {
          labels: p50Pts.map(p => {
            const d = new Date(p[0] * 1000);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }),
          datasets: [
            {
              label: 'API p50 Latency',
              data: p50Pts.map(p => (parseFloat(p[1]) * 1000).toFixed(0)),
              borderColor: c.green,
              backgroundColor: c.greenAlpha,
              yAxisID: 'y',
              fill: false,
              tension: 0.3,
              pointRadius: 1,
              borderWidth: 2,
            },
            {
              label: 'API p95 Latency',
              data: p95Pts.map(p => (parseFloat(p[1]) * 1000).toFixed(0)),
              borderColor: c.amber,
              backgroundColor: c.amberAlpha,
              yAxisID: 'y',
              fill: false,
              tension: 0.3,
              pointRadius: 1,
              borderWidth: 2,
            },
            {
              label: 'LLM Gen Time',
              data: llmPts.map(p => parseFloat(p[1]).toFixed(2)),
              borderColor: c.rose,
              backgroundColor: c.roseAlpha,
              yAxisID: 'y1',
              fill: true,
              tension: 0.3,
              pointRadius: 1,
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 600, easing: 'easeOutQuart' },
          plugins: {
            legend: { labels: { color: c.text, font: { family: "'JetBrains Mono', monospace", size: 10 } } },
            tooltip: {
              backgroundColor: c.text === '#e0e3e5' ? '#16191b' : '#ffffff',
              titleColor: c.text === '#e0e3e5' ? '#ffffff' : '#16191b',
              bodyColor: c.text === '#e0e3e5' ? '#e0e3e5' : '#16191b',
              borderColor: c.grid,
              borderWidth: 1,
              cornerRadius: 4,
              titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
              bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
            },
          },
          scales: {
            x: { ticks: { color: c.text, font: { size: 9 } }, grid: { color: c.grid } },
            y: {
              type: 'linear',
              position: 'left',
              beginAtZero: true,
              ticks: { color: c.text, font: { size: 9 }, callback: v => `${v} ms` },
              grid: { color: c.grid },
              title: { display: true, text: 'API Latency (ms)', color: c.text, font: { size: 10 } },
            },
            y1: {
              type: 'linear',
              position: 'right',
              beginAtZero: true,
              ticks: { color: c.text, font: { size: 9 }, callback: v => `${v}s` },
              grid: { drawOnChartArea: false },
              title: { display: true, text: 'LLM Gen Time (s)', color: c.text, font: { size: 10 } },
            },
          },
        },
      });
    }
  }

  async function refreshTokenChart() {
    const promRange = window.promRange;
    if (!promRange) return;

    const c = getChartColors();

    const inputResults = await promRange('sum(chatbot_input_tokens_total)');
    const outputResults = await promRange('sum(chatbot_output_tokens_total)');

    const inputPts = inputResults[0]?.values || [];
    const outputPts = outputResults[0]?.values || [];

    if (inputPts.length > 0 || outputPts.length > 0) {
      // Use input points as the time base (or output if input is empty)
      const basePts = inputPts.length > 0 ? inputPts : outputPts;

      safeRenderChart(chartC.canvasId, {
        type: 'line',
        data: {
          labels: basePts.map(p => {
            const d = new Date(p[0] * 1000);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }),
          datasets: [
            {
              label: 'Input Tokens',
              data: inputPts.length > 0 ? inputPts.map(p => parseFloat(p[1]).toFixed(0)) : basePts.map(() => '0'),
              borderColor: c.secondary,
              backgroundColor: c.secondaryAlpha,
              fill: true,
              tension: 0.4,
              pointRadius: 1,
              borderWidth: 2,
            },
            {
              label: 'Output Tokens',
              data: outputPts.length > 0 ? outputPts.map(p => parseFloat(p[1]).toFixed(0)) : basePts.map(() => '0'),
              borderColor: c.purple,
              backgroundColor: c.purpleAlpha,
              fill: true,
              tension: 0.4,
              pointRadius: 1,
              borderWidth: 2,
            },
          ],
        },
        options: chartOptions(c, 'tokens', {
          scales: {
            x: { ticks: { color: c.text, font: { size: 9 } }, grid: { color: c.grid } },
            y: {
              beginAtZero: true,
              stacked: true,
              ticks: { color: c.text, font: { size: 9 }, callback: v => `${v}` },
              grid: { color: c.grid },
            },
          },
        }),
      });
    }
  }

  async function refreshCostCard() {
    const promQuery = window.promQuery;
    if (!promQuery) return;

    try {
      // Total cost
      const costRes = await promQuery('sum(chatbot_cost_usd_total)');
      const totalCost = parseFloat(costRes[0]?.value?.[1] || '0');

      // Total queries (for avg cost/query)
      const queriesRes = await promQuery('sum(chatbot_queries_total)');
      const totalQueries = parseFloat(queriesRes[0]?.value?.[1] || '1'); // avoid division by zero

      // Cost today (last 24h) — use rate * 86400 as approximation
      const costTodayRes = await promQuery('sum(rate(chatbot_cost_usd_total[24h])) * 86400');
      const costToday = parseFloat(costTodayRes[0]?.value?.[1] || '0');

      // Total sessions (for cost/session)
      const sessionsRes = await promQuery('sum(portfolio_sessions_total)');
      const totalSessions = parseFloat(sessionsRes[0]?.value?.[1] || '1');

      const avgCostPerQuery = totalQueries > 0 ? totalCost / totalQueries : 0;
      const costPerSession = totalSessions > 0 ? totalCost / totalSessions : 0;

      const totalEl = document.getElementById('cost-total-value');
      if (totalEl) totalEl.textContent = `$${totalCost.toFixed(2)}`;

      const avgEl = document.getElementById('cost-avg-query');
      if (avgEl) avgEl.textContent = `$${avgCostPerQuery.toFixed(4)}`;

      const todayEl = document.getElementById('cost-today');
      if (todayEl) todayEl.textContent = `$${costToday.toFixed(2)}`;

      const sessionEl = document.getElementById('cost-per-session');
      if (sessionEl) sessionEl.textContent = `$${costPerSession.toFixed(2)}`;

      const queriesEl = document.getElementById('cost-total-queries');
      if (queriesEl) queriesEl.textContent = Math.round(totalQueries).toLocaleString();
    } catch (err) {
      console.error('AI Cost card refresh error:', err);
    }
  }

  async function refreshGaugeChart() {
    const promQuery = window.promQuery;
    if (!promQuery) return;

    try {
      const hitsRes = await promQuery('sum(cache_hits_total)');
      const missesRes = await promQuery('sum(cache_misses_total)');

      const hits = parseFloat(hitsRes[0]?.value?.[1] || '0');
      const misses = parseFloat(missesRes[0]?.value?.[1] || '0');
      const total = hits + misses;

      const gaugeValueEl = document.getElementById('gauge-cache-value');
      if (!gaugeValueEl) return;

      if (total === 0) {
        // No cache data available
        gaugeValueEl.textContent = 'N/A';
        // Clear the chart if it exists
        if (window.myCharts && window.myCharts['chart-cache-canvas']) {
          window.myCharts['chart-cache-canvas'].destroy();
          delete window.myCharts['chart-cache-canvas'];
        }
        return;
      }

      const hitRate = (hits / total) * 100;
      gaugeValueEl.textContent = `${hitRate.toFixed(1)}%`;

      // Determine gauge color based on hit rate
      let gaugeColor;
      if (hitRate < 50) {
        gaugeColor = '#f43f5e'; // red
      } else if (hitRate < 80) {
        gaugeColor = '#f59e0b'; // amber
      } else {
        gaugeColor = '#22c55e'; // green
      }

      safeRenderChart('chart-cache-canvas', {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [hitRate, 100 - hitRate],
            backgroundColor: [gaugeColor, 'rgba(255,255,255,0.05)'],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          rotation: -90,
          circumference: 180,
          cutout: '75%',
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
        },
      });
    } catch (err) {
      console.error('Cache gauge refresh error:', err);
    }
  }

  // ── Refresh cycle ────────────────────────────────────────

  async function refresh() {
    try {
      await Promise.allSettled([
        refreshIntentChart(),
        refreshLLMPerformanceChart(),
        refreshTokenChart(),
        refreshCostCard(),
        refreshGaugeChart(),
      ]);
    } catch (err) {
      console.error('AI Observability refresh error:', err);
    }
  }

  // Initial render
  await refresh();

  // Set up 10s refresh interval
  const intervalId = setInterval(refresh, 10000);

  return { refresh, stop: () => clearInterval(intervalId) };
}
