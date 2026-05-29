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

  // Chart A: AI Conversation Intelligence (Doughnut Chart + ASCII block list)
  const chartASection = document.createElement('div');
  chartASection.className = 'chart-section';
  chartASection.id = 'chart-intent';
  chartASection.innerHTML = `
    <div class="chart-header">
      <span class="material-symbols-outlined">psychology</span>
      <span>AI Conversation Intelligence</span>
    </div>
    <div class="intent-flex-layout" style="display: flex; flex-direction: column; gap: 20px; padding-top: 8px;">
      <div style="height: 160px; position: relative;">
        <canvas id="chart-intent-canvas"></canvas>
      </div>
      <div id="intent-ascii-container" style="padding: 4px 0;"></div>
    </div>
  `;
  grid.appendChild(chartASection);

  // Chart B: LLM & API Latency Stats (p50, p95, p99 averages)
  const chartBSection = document.createElement('div');
  chartBSection.className = 'chart-section';
  chartBSection.id = 'chart-llm-performance';
  chartBSection.innerHTML = `
    <div class="chart-header">
      <span class="material-symbols-outlined">speed</span>
      <span>LLM & API Latency</span>
    </div>
    <div class="latency-container" style="display: flex; flex-direction: column; gap: 20px; padding: 24px 8px;">
      <div class="latency-item" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--color-outline-variant); padding-bottom: 12px;">
        <span class="latency-label" style="font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: bold;">p50 Latency (Avg)</span>
        <span class="latency-val" id="latency-p50" style="font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: bold; color: #22c55e;">— ms</span>
      </div>
      <div class="latency-item" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--color-outline-variant); padding-bottom: 12px;">
        <span class="latency-label" style="font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: bold;">p95 Latency (Avg)</span>
        <span class="latency-val" id="latency-p95" style="font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: bold; color: #f59e0b;">— ms</span>
      </div>
      <div class="latency-item" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px;">
        <span class="latency-label" style="font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: bold;">p99 Latency (Avg)</span>
        <span class="latency-val" id="latency-p99" style="font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: bold; color: #f43f5e;">— ms</span>
      </div>
    </div>
  `;
  grid.appendChild(chartBSection);

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

  container.appendChild(grid);

  // ── Data fetch functions ─────────────────────────────────

  async function refreshIntentChart() {
    const promQuery = window.promQuery;
    if (!promQuery) return;

    const c = getChartColors();
    const results = await promQuery('sum by(category) (chatbot_queries_total)');

    // Map backend categories to display-friendly intent names
    const categoryDisplayMap = {
      'project': 'Project Detail',
      'project_detail': 'Project Detail',
      'education': 'General Info',
      'experience': 'General Info',
      'personal_info': 'General Info',
      'contact': 'General Info',
      'skills': 'Skills Audit',
      'competencies': 'Skills Audit',
      'greeting': 'Chitchat',
      'general': 'General Info',
      'RAG Retrieval': 'RAG Retrieval',
      'General Info': 'General Info',
      'Skills Audit': 'Skills Audit',
      'Project Detail': 'Project Detail',
      'Chitchat': 'Chitchat',
    };

    if (results.length > 0) {
      const categoryOrder = ['RAG Retrieval', 'Project Detail', 'Skills Audit', 'General Info', 'Chitchat'];
      const categoryColors = [c.primary, c.cyan, c.tertiary, c.secondary, c.green];

      // Build data map with category mapping
      const dataMap = {};
      let totalQueries = 0;
      results.forEach(r => {
        const rawCat = r.metric.category || 'unknown';
        const displayCat = categoryDisplayMap[rawCat] || rawCat;
        const val = parseFloat(r.value[1]) || 0;
        dataMap[displayCat] = (dataMap[displayCat] || 0) + val;
        totalQueries += val;
      });

      // Filter and order labels
      const labels = categoryOrder.filter(cat => cat in dataMap);
      const data = labels.map(cat => dataMap[cat] || 0);
      const colors = labels.map((_, i) => categoryColors[i % categoryColors.length]);

      // 1. Render Doughnut Chart
      safeRenderChart('chart-intent-canvas', {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: true }
          },
          cutout: '70%'
        }
      });

      // 2. Render ASCII-like HTML grid
      const asciiContainer = document.getElementById('intent-ascii-container');
      if (asciiContainer) {
        // Sort items by count descending
        const items = labels.map((l, idx) => ({
          label: l,
          count: data[idx],
          color: colors[idx]
        })).sort((a, b) => b.count - a.count);

        const maxTotal = totalQueries > 0 ? totalQueries : 1;

        let rowsHtml = '';
        items.forEach(item => {
          const pct = Math.round((item.count / maxTotal) * 100);
          
          rowsHtml += `
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-family: 'JetBrains Mono', monospace; font-size: 13px;">
                <span style="font-weight: bold; color: ${item.color};">${sanitizeLabel(item.label)}</span>
                <span style="font-weight: bold; color: var(--color-primary);">${item.count.toLocaleString()} <span style="opacity: 0.7; font-size: 0.85em;">(${pct}%)</span></span>
              </div>
              <div style="width: 100%; height: 24px; border: 2px solid var(--color-primary); background: transparent; box-sizing: border-box; overflow: hidden; position: relative;">
                <div style="width: ${pct}%; height: 100%; background: ${item.color}; transition: width 0.5s ease;"></div>
              </div>
            </div>
          `;
        });

        asciiContainer.innerHTML = `
          <div class="font-code select-none" style="padding-top: 8px;">
            <div style="display: flex; flex-direction: column;">
              ${rowsHtml}
            </div>
          </div>
        `;
      }
    }
  }

  async function refreshLLMPerformanceChart() {
    const promQuery = window.promQuery;
    if (!promQuery) return;

    try {
      // Query current average latencies (p50, p95, p99 over the last 5m)
      const p50Res = await promQuery('histogram_quantile(0.5, sum(rate(api_request_duration_seconds_bucket[5m])) by (le))');
      const p95Res = await promQuery('histogram_quantile(0.95, sum(rate(api_request_duration_seconds_bucket[5m])) by (le))');
      const p99Res = await promQuery('histogram_quantile(0.99, sum(rate(api_request_duration_seconds_bucket[5m])) by (le))');

      const p50 = p50Res.length > 0 ? parseFloat(p50Res[0]?.value?.[1]) * 1000 : null;
      const p95 = p95Res.length > 0 ? parseFloat(p95Res[0]?.value?.[1]) * 1000 : null;
      const p99 = p99Res.length > 0 ? parseFloat(p99Res[0]?.value?.[1]) * 1000 : null;

      const p50El = document.getElementById('latency-p50');
      const p95El = document.getElementById('latency-p95');
      const p99El = document.getElementById('latency-p99');

      if (p50El) p50El.textContent = p50 !== null && !isNaN(p50) ? `${p50.toFixed(0)} ms` : '— ms';
      if (p95El) p95El.textContent = p95 !== null && !isNaN(p95) ? `${p95.toFixed(0)} ms` : '— ms';
      if (p99El) p99El.textContent = p99 !== null && !isNaN(p99) ? `${p99.toFixed(0)} ms` : '— ms';
    } catch (err) {
      console.error('Latency stats refresh error:', err);
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

  // ── Refresh cycle ────────────────────────────────────────

  async function refresh() {
    try {
      await Promise.allSettled([
        refreshIntentChart(),
        refreshLLMPerformanceChart(),
        refreshTokenChart(),
        refreshCostCard(),
      ]);
    } catch (err) {
      console.error('AI Observability refresh error:', err);
    }
  }

  // Initial render
  await refresh();

  return { refresh, stop: () => {} };
}
