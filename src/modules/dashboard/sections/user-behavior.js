/**
 * User Behavior Analytics — 4 charts in a 2x2 grid layout.
 *
 * Exports: renderUserBehavior(container)
 *
 * Charts:
 *   A. Traffic Volume — Area chart with gradient fill, time range switcher (1H/6H/24H)
 *   B. Most Viewed Projects — Horizontal bar chart
 *   C. Scroll Depth Funnel — Vertical funnel / stacked bar
 *   D. Session Duration Distribution — Histogram (p50/p95)
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
 * Mirrors chartColors() from main.js.
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
    green: '#22c55e',
    greenAlpha: 'rgba(34,197,94,0.15)',
    amber: '#f59e0b',
    amberAlpha: 'rgba(245,158,11,0.15)',
    rose: '#f43f5e',
    roseAlpha: 'rgba(244,63,94,0.15)',
    cyan: '#06b6d4',
    cyanAlpha: 'rgba(6,182,212,0.15)',
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
 * Reuses window.myCharts registry from main.js pattern.
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

/* ── Chart creation ─────────────────────────────────────── */

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

function createTimeRangeSwitcher(onChange) {
  const wrapper = document.createElement('div');
  wrapper.className = 'time-range-switcher';

  const ranges = ['1H', '6H', '24H'];
  let active = '1H';

  ranges.forEach(range => {
    const btn = document.createElement('button');
    btn.className = `time-range-btn${range === active ? ' active' : ''}`;
    btn.textContent = range;
    btn.addEventListener('click', () => {
      wrapper.querySelectorAll('.time-range-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      active = range;
      onChange(range);
    });
    wrapper.appendChild(btn);
  });

  return wrapper;
}

/* ── Main render function ───────────────────────────────── */

/**
 * Render the User Behavior Analytics section into the given container.
 * @param {HTMLElement} container
 * @returns {{ refresh: () => Promise<void>, stop: () => void }}
 */
export async function renderUserBehavior(container) {
  // Section title
  const titleEl = document.createElement('div');
  titleEl.className = 'dashboard-section-title';
  titleEl.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">bar_chart</span> User Behavior Analytics';
  container.appendChild(titleEl);

  // Charts grid
  const grid = document.createElement('div');
  grid.className = 'dashboard-charts-grid';

  // Chart A: Traffic Volume (with time range switcher)
  let trafficTimeRange = '1H';
  const trafficSwitcher = createTimeRangeSwitcher(range => {
    trafficTimeRange = range;
    refreshTrafficChart();
  });
  const chartA = createChartSection('chart-traffic', 'trending_up', 'Traffic Volume', trafficSwitcher);
  grid.appendChild(chartA.section);

  // Chart B: Most Viewed Projects
  const chartB = createChartSection('chart-projects', 'visibility', 'Most Viewed Projects');
  grid.appendChild(chartB.section);

  // Chart C: Scroll Depth Funnel
  const chartCSection = document.createElement('div');
  chartCSection.className = 'chart-section';
  chartCSection.id = 'chart-funnel';
  chartCSection.innerHTML = `
    <div class="chart-header">
      <span class="material-symbols-outlined">filter_alt</span>
      <span>Scroll Depth Funnel</span>
    </div>
    <div id="funnel-container" style="padding: 8px 0;"></div>
  `;
  grid.appendChild(chartCSection);

  // Chart D: Session Duration
  const chartD = createChartSection('chart-duration', 'hourglass_top', 'Session Duration');
  grid.appendChild(chartD.section);

  container.appendChild(grid);

  // ── Data fetch functions ─────────────────────────────────

  async function refreshTrafficChart() {
    const promRange = window.promRange;
    if (!promRange) return;

    const stepMap = { '1H': '5m', '6H': '15m', '24H': '1h' };
    const step = stepMap[trafficTimeRange] || '5m';
    const c = getChartColors();

    const results = await promRange('sum(rate(api_requests_total[5m])) * 60', step);
    if (results.length > 0 && results[0].values) {
      const pts = results[0].values;
      safeRenderChart(chartA.canvasId, {
        type: 'line',
        data: {
          labels: pts.map(p => {
            const d = new Date(p[0] * 1000);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }),
          datasets: [{
            label: 'Requests / min',
            data: pts.map(p => parseFloat(p[1]).toFixed(1)),
            borderColor: c.primary,
            backgroundColor: (ctx) => {
              const chart = ctx.chart;
              const { ctx: context, chartArea } = chart;
              if (!chartArea) return c.primaryAlpha;
              const gradient = context.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              gradient.addColorStop(0, c.primaryAlpha);
              gradient.addColorStop(1, 'transparent');
              return gradient;
            },
            fill: true,
            tension: 0.4,
            pointRadius: 1,
            pointHoverRadius: 4,
            borderWidth: 2,
          }],
        },
        options: chartOptions(c, 'req/min'),
      });
    }
  }

  async function refreshProjectsChart() {
    const promQuery = window.promQuery;
    if (!promQuery) return;

    const c = getChartColors();
    const results = await promQuery('sum by(project) (project_view_total)');

    if (results.length > 0) {
      const colors = [c.primary, c.secondary, c.tertiary, c.cyan, c.green, c.amber, c.rose];
      safeRenderChart(chartB.canvasId, {
        type: 'bar',
        data: {
          labels: results.map(r => sanitizeLabel(r.metric.project || 'unknown')),
          datasets: [{
            label: 'Views',
            data: results.map(r => parseFloat(r.value[1])),
            backgroundColor: results.map((_, i) => colors[i % colors.length]),
            borderRadius: 4,
            borderWidth: 0,
          }],
        },
        options: chartOptions(c, 'views', {
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { color: c.text, font: { size: 9 } }, grid: { color: c.grid } },
            y: { ticks: { color: c.text, font: { size: 10 } }, grid: { color: c.grid } },
          },
        }),
      });
    }
  }

  async function refreshFunnelChart() {
    const promQuery = window.promQuery;
    if (!promQuery) return;

    const results = await promQuery('sum by(depth) (scroll_depth_total)');
    const container = document.getElementById('funnel-container');
    if (!container) return;

    const depths = [25, 50, 75, 100];
    const colors = ['#cebdff', '#a4c9ff', '#c4c1fb', '#22c55e'];

    // Build a map of depth → count
    const depthMap = {};
    results.forEach(r => {
      const depth = parseInt(r.metric.depth, 10);
      if (!isNaN(depth)) depthMap[depth] = parseFloat(r.value[1]);
    });

    const maxVal = Math.max(...depths.map(d => depthMap[d] || 0), 1);

    container.innerHTML = '';
    depths.forEach((depth, idx) => {
      const count = depthMap[depth] || 0;
      const pct = ((count / maxVal) * 100).toFixed(0);

      const bar = document.createElement('div');
      bar.className = 'funnel-bar';
      bar.innerHTML = `
        <span class="funnel-label">${depth}%</span>
        <div class="funnel-track">
          <div class="funnel-fill" style="width:${pct}%;background:${colors[idx]}40;">
            <span class="funnel-value">${count.toLocaleString()}</span>
          </div>
        </div>
      `;
      container.appendChild(bar);
    });
  }

  async function refreshDurationChart() {
    const promRange = window.promRange;
    if (!promRange) return;

    const c = getChartColors();

    // Fetch p50 and p95 session duration
    const p50Results = await promRange('histogram_quantile(0.5, sum(rate(session_duration_seconds_bucket[5m])) by (le))');
    const p95Results = await promRange('histogram_quantile(0.95, sum(rate(session_duration_seconds_bucket[5m])) by (le))');

    const p50Pts = p50Results[0]?.values || [];
    const p95Pts = p95Results[0]?.values || [];

    if (p50Pts.length > 0) {
      safeRenderChart(chartD.canvasId, {
        type: 'line',
        data: {
          labels: p50Pts.map(p => {
            const d = new Date(p[0] * 1000);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }),
          datasets: [
            {
              label: 'p50 Duration',
              data: p50Pts.map(p => parseFloat(p[1]).toFixed(1)),
              borderColor: c.green,
              backgroundColor: c.greenAlpha,
              fill: true,
              tension: 0.3,
              pointRadius: 1,
              borderWidth: 2,
            },
            {
              label: 'p95 Duration',
              data: p95Pts.map(p => parseFloat(p[1]).toFixed(1)),
              borderColor: c.amber,
              backgroundColor: c.amberAlpha,
              fill: true,
              tension: 0.3,
              pointRadius: 1,
              borderWidth: 2,
            },
          ],
        },
        options: chartOptions(c, 's'),
      });
    }
  }

  // ── Refresh cycle ────────────────────────────────────────

  async function refresh() {
    try {
      await Promise.allSettled([
        refreshTrafficChart(),
        refreshProjectsChart(),
        refreshFunnelChart(),
        refreshDurationChart(),
      ]);
    } catch (err) {
      console.error('User Behavior refresh error:', err);
    }
  }

  // Initial render
  await refresh();

  // Set up 10s refresh interval
  const intervalId = setInterval(refresh, 10000);

  return { refresh, stop: () => clearInterval(intervalId) };
}
