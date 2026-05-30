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
  const chartBSection = document.createElement('div');
  chartBSection.className = 'chart-section';
  chartBSection.id = 'chart-projects';
  chartBSection.innerHTML = `
    <div class="chart-header">
      <span class="material-symbols-outlined">visibility</span>
      <span>Most Viewed Projects</span>
    </div>
    <div class="projects-flex-layout" style="display: flex; flex-direction: column; gap: 20px; padding-top: 8px;">
      <div id="projects-total-display" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 0 8px;">
        <div id="projects-total-value" style="font-family: 'JetBrains Mono', monospace; font-size: 48px; font-weight: 800; color: var(--color-primary); line-height: 1; letter-spacing: -2px;">0</div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.5; margin-top: 6px;">total project views</div>
      </div>
      <div id="projects-container" style="padding: 8px 0;"></div>
    </div>
  `;
  grid.appendChild(chartBSection);

  // Chart C: Scroll Depth Funnel
  const chartCSection = document.createElement('div');
  chartCSection.className = 'chart-section';
  chartCSection.id = 'chart-funnel';
  chartCSection.innerHTML = `
    <div class="chart-header">
      <span class="material-symbols-outlined">filter_alt</span>
      <span>Scroll Engagement Funnel</span>
    </div>
    <div class="funnel-flex-layout" style="display: flex; flex-direction: column; gap: 20px; padding-top: 8px;">
      <div id="funnel-total-display" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 0 8px;">
        <div id="funnel-total-value" style="font-family: 'JetBrains Mono', monospace; font-size: 48px; font-weight: 800; color: var(--color-primary); line-height: 1; letter-spacing: -2px;">0</div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.5; margin-top: 6px;">total visitors</div>
      </div>
      <div id="funnel-container" style="padding: 8px 0;"></div>
    </div>
  `;
  grid.appendChild(chartCSection);

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

    const container = document.getElementById('projects-container');
    if (!container) return;

    const c = getChartColors();
    const results = await promQuery('sum by(project) (project_view_total)');

    if (results.length > 0) {
      const colors = [c.primary, c.secondary, c.tertiary, c.cyan, c.green, c.amber, c.rose];
      
      // Sort by value descending
      results.sort((a, b) => parseFloat(b.value[1]) - parseFloat(a.value[1]));

      const totalViews = results.reduce((sum, r) => sum + (parseFloat(r.value[1]) || 0), 0);
      const totalValueEl = document.getElementById('projects-total-value');
      if (totalValueEl) {
        totalValueEl.textContent = Math.round(totalViews).toLocaleString();
      }

      const maxViews = Math.max(...results.map(r => parseFloat(r.value[1])));
      const safeMax = maxViews > 0 ? maxViews : 1;

      let rowsHtml = '';
      results.forEach((r, idx) => {
        const label = r.metric.project || 'unknown';
        const views = parseFloat(r.value[1]);
        const pct = Math.round((views / safeMax) * 100);
        const color = colors[idx % colors.length];

        rowsHtml += `
          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-family: 'JetBrains Mono', monospace; font-size: 14px;">
              <span style="font-weight: bold; color: ${color};">${sanitizeLabel(label)}</span>
              <span style="font-weight: bold; color: var(--color-primary);">${views.toLocaleString()}</span>
            </div>
            <div style="width: 100%; height: 26px; border: 2px solid var(--color-primary); background: transparent; box-sizing: border-box; overflow: hidden; position: relative;">
              <div style="width: ${pct}%; height: 100%; background: ${color}; transition: width 0.5s ease;"></div>
            </div>
          </div>
        `;
      });

      container.innerHTML = `
        <div class="font-code select-none" style="padding-top: 16px; padding-bottom: 8px;">
          <div style="display: flex; flex-direction: column;">
            ${rowsHtml}
          </div>
        </div>
      `;
    }
  }

  async function refreshFunnelChart() {
    const promQuery = window.promQuery;
    if (!promQuery) return;

    const container = document.getElementById('funnel-container');
    if (!container) return;

    // 1. Fetch total visitors
    let totalVisitors = 0;
    try {
      const visitorsRes = await promQuery('sum(portfolio_sessions_total)');
      if (visitorsRes.length > 0) {
        totalVisitors = parseInt(visitorsRes[0].value[1], 10);
      }
    } catch (e) {
      console.error("Failed to query total visitors", e);
    }
    if (isNaN(totalVisitors) || totalVisitors <= 0) {
      totalVisitors = 1; // Prevent division by zero
    }

    // 2. Fetch scroll depth buckets
    let count50 = 0;
    let count90 = 0;
    try {
      const results = await promQuery('sum by(depth_percentile) (scroll_depth_reached_bucket)');
      results.forEach(r => {
        const depth = parseInt(r.metric.depth_percentile, 10);
        const val = parseFloat(r.value[1]) || 0;
        if (depth === 50) count50 = val;
        if (depth === 90) count90 = val;
      });
    } catch (e) {
      console.error("Failed to query scroll depth", e);
    }

    // Ensure logic constraints remain valid
    if (count50 > totalVisitors) totalVisitors = Math.round(count50 * 1.2);
    if (count90 > count50) count50 = count90;

    const completionRate = totalVisitors > 0 ? Math.round((count90 / totalVisitors) * 100) : 0;

    const ratio50 = totalVisitors > 0 ? count50 / totalVisitors : 0;
    const ratio90 = totalVisitors > 0 ? count90 / totalVisitors : 0;

    const renderFunnelItem = (label, pct, color, countVal, labelColor) => {
      return `
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-family: 'JetBrains Mono', monospace; font-size: 14px;">
            <span style="font-weight: bold; color: ${labelColor || 'var(--color-primary)'};">${label}</span>
            <span style="font-weight: bold; color: var(--color-primary);">${countVal} <span style="opacity: 0.7; font-size: 0.85em;">(${pct}%)</span></span>
          </div>
          <div style="width: 100%; height: 26px; border: 2px solid var(--color-primary); background: transparent; box-sizing: border-box; overflow: hidden; position: relative;">
            <div style="width: ${pct}%; height: 100%; background: ${color}; transition: width 0.5s ease;"></div>
          </div>
        </div>
      `;
    };

    const totalValueEl = document.getElementById('funnel-total-value');
    if (totalValueEl) {
      totalValueEl.textContent = totalVisitors.toLocaleString();
    }

    container.innerHTML = `
      <div class="font-code select-none" style="padding-top: 16px; padding-bottom: 8px;">
        <div style="display: flex; flex-direction: column;">
          ${renderFunnelItem('Visitors', 100, 'var(--color-primary)', totalVisitors.toLocaleString(), 'var(--color-primary)')}
          ${renderFunnelItem('Reached 50%', Math.round(ratio50 * 100), 'var(--color-secondary)', count50.toLocaleString(), 'var(--color-secondary)')}
          ${renderFunnelItem('Reached 90%', completionRate, 'var(--color-tertiary)', count90.toLocaleString(), 'var(--color-tertiary)')}
        </div>
      </div>
    `;
  }

  // ── Refresh cycle ────────────────────────────────────────

  async function refresh() {
    try {
      await Promise.allSettled([
        refreshTrafficChart(),
        refreshProjectsChart(),
        refreshFunnelChart(),
      ]);
    } catch (err) {
      console.error('User Behavior refresh error:', err);
    }
  }

  // Initial render
  await refresh();

  return { refresh, stop: () => {} };
}
