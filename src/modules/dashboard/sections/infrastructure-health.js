/**
 * Infrastructure Health — 4 charts demonstrating backend and deployment engineering skills.
 *
 * Exports: renderInfrastructureHealth(container)
 *
 * Charts:
 *   A. HTTP Status Distribution — Doughnut chart (200, 201, 400, 429, 500)
 *   B. Endpoint Activity — Horizontal bar chart
 *   C. Container Resources — 3 mini line charts (CPU, RAM, Restarts)
 *   D. Deployment Timeline — Vertical timeline with container lifecycle events
 *
 * Data refresh: every 10s via setInterval
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
    orange: '#f97316',
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
function createChartSection(id, icon, title) {
  const section = document.createElement('div');
  section.className = 'chart-section';
  section.id = id;

  const header = document.createElement('div');
  header.className = 'chart-header';
  header.innerHTML = `
    <span class="material-symbols-outlined">${icon}</span>
    <span>${sanitizeLabel(title)}</span>
  `;
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
 * Render the Infrastructure Health section into the given container.
 * @param {HTMLElement} container
 * @returns {{ refresh: () => Promise<void>, stop: () => void }}
 */
export async function renderInfrastructureHealth(container) {
  // Section title
  const titleEl = document.createElement('div');
  titleEl.className = 'dashboard-section-title';
  titleEl.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">dns</span> Infrastructure Health';
  container.appendChild(titleEl);

  // Charts grid (2x2)
  const grid = document.createElement('div');
  grid.className = 'dashboard-charts-grid';

  // Chart A: HTTP Status Distribution (Doughnut)
  const chartA = createChartSection('chart-http-status', 'donut_large', 'HTTP Status Distribution');
  grid.appendChild(chartA.section);

  // Chart B: Endpoint Activity (Horizontal Bar)
  const chartB = createChartSection('chart-endpoint-activity', 'route', 'Endpoint Activity');
  grid.appendChild(chartB.section);

  // Chart C: Container Resources (3 mini line charts)
  const containerSection = document.createElement('div');
  containerSection.className = 'chart-section';
  containerSection.id = 'chart-container-resources';
  containerSection.innerHTML = `
    <div class="chart-header">
      <span class="material-symbols-outlined">memory</span>
      <span>Container Resources</span>
    </div>
    <div class="container-resources-grid">
      <div class="container-mini-chart">
        <div class="container-mini-title">CPU Usage</div>
        <div class="container-mini-canvas"><canvas id="chart-container-cpu-canvas"></canvas></div>
        <div class="container-mini-value" id="chart-container-cpu-value">—</div>
      </div>
      <div class="container-mini-chart">
        <div class="container-mini-title">RAM Usage</div>
        <div class="container-mini-canvas"><canvas id="chart-container-ram-canvas"></canvas></div>
        <div class="container-mini-value" id="chart-container-ram-value">—</div>
      </div>
      <div class="container-mini-chart">
        <div class="container-mini-title">Restarts</div>
        <div class="container-mini-canvas"><canvas id="chart-container-restarts-canvas"></canvas></div>
        <div class="container-mini-value" id="chart-container-restarts-value">—</div>
      </div>
    </div>
  `;
  grid.appendChild(containerSection);

  // Chart D: Deployment Timeline
  const timelineSection = document.createElement('div');
  timelineSection.className = 'chart-section';
  timelineSection.id = 'chart-deployment-timeline';
  timelineSection.innerHTML = `
    <div class="chart-header">
      <span class="material-symbols-outlined">timeline</span>
      <span>Deployment Timeline</span>
    </div>
    <div class="timeline" id="deployment-timeline">
      <div class="timeline-placeholder">Loading deployment events...</div>
    </div>
  `;
  grid.appendChild(timelineSection);

  container.appendChild(grid);

  // ── Data fetch functions ─────────────────────────────────

  async function refreshHTTPStatusChart() {
    const promQuery = window.promQuery;
    if (!promQuery) return;

    const c = getChartColors();
    const results = await promQuery('sum by(status) (api_requests_total)');

    if (results.length > 0) {
      // Status code color mapping
      const statusColorMap = {
        '200': c.green,
        '201': c.secondary,
        '400': c.amber,
        '429': c.orange,
        '500': c.rose,
      };

      // Sort by status code for consistent ordering
      const sorted = results.sort((a, b) => {
        const statusA = parseInt(a.metric.status, 10) || 0;
        const statusB = parseInt(b.metric.status, 10) || 0;
        return statusA - statusB;
      });

      const labels = sorted.map(r => sanitizeLabel(r.metric.status || 'unknown'));
      const data = sorted.map(r => parseFloat(r.value[1]));
      const colors = sorted.map(r => statusColorMap[r.metric.status] || c.tertiary);

      const totalRequests = data.reduce((sum, v) => sum + v, 0);

      safeRenderChart(chartA.canvasId, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors,
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 600, easing: 'easeOutQuart' },
          rotation: -90,
          circumference: 360,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'right',
              labels: { color: c.text, font: { family: "'JetBrains Mono', monospace", size: 10 }, padding: 8 },
            },
            tooltip: {
              backgroundColor: c.text === '#e0e3e5' ? '#16191b' : '#ffffff',
              titleColor: c.text === '#e0e3e5' ? '#ffffff' : '#16191b',
              bodyColor: c.text === '#e0e3e5' ? '#e0e3e5' : '#16191b',
              borderColor: c.grid,
              borderWidth: 1,
              cornerRadius: 4,
              titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
              bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.parsed} (${((ctx.parsed / totalRequests) * 100).toFixed(1)}%)`,
              },
            },
          },
        },
        plugins: [{
          id: 'centerLabel',
          beforeDraw(chart) {
            const { ctx, chartArea: { width, height, top, left } } = chart;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Total count
            ctx.font = `bold 20px 'JetBrains Mono', monospace`;
            ctx.fillStyle = c.text;
            ctx.fillText(totalRequests.toLocaleString(), left + width / 2, top + height / 2 - 8);

            // Label
            ctx.font = `10px 'JetBrains Mono', monospace`;
            ctx.fillStyle = 'rgba(224, 227, 229, 0.5)';
            ctx.fillText('total requests', left + width / 2, top + height / 2 + 12);

            ctx.restore();
          },
        }],
      });
    }
  }

  async function refreshEndpointActivityChart() {
    const promQuery = window.promQuery;
    if (!promQuery) return;

    const c = getChartColors();
    const results = await promQuery('sum by(endpoint) (api_requests_total)');

    if (results.length > 0) {
      const colors = [c.primary, c.secondary, c.tertiary, c.cyan, c.green, c.amber, c.rose];

      // Sort by value descending
      const sorted = results.sort((a, b) => parseFloat(b.value[1]) - parseFloat(a.value[1]));

      safeRenderChart(chartB.canvasId, {
        type: 'bar',
        data: {
          labels: sorted.map(r => sanitizeLabel(r.metric.endpoint || 'unknown')),
          datasets: [{
            label: 'Requests',
            data: sorted.map(r => parseFloat(r.value[1])),
            backgroundColor: sorted.map((_, i) => colors[i % colors.length]),
            borderRadius: 4,
            borderWidth: 0,
          }],
        },
        options: chartOptions(c, 'reqs', {
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

  async function refreshContainerResources() {
    const promRange = window.promRange;
    const promQuery = window.promQuery;
    if (!promRange || !promQuery) return;

    const c = getChartColors();

    // CPU Usage
    try {
      const cpuResults = await promRange('rate(container_cpu_usage_seconds_total{container="backend"}[5m]) * 100', '5m');
      const cpuPts = cpuResults[0]?.values || [];

      if (cpuPts.length > 0) {
        const latestCpu = parseFloat(cpuPts[cpuPts.length - 1][1]).toFixed(1);
        const cpuValueEl = document.getElementById('chart-container-cpu-value');
        if (cpuValueEl) cpuValueEl.textContent = `${latestCpu}%`;

        safeRenderChart('chart-container-cpu-canvas', {
          type: 'line',
          data: {
            labels: cpuPts.map(p => {
              const d = new Date(p[0] * 1000);
              return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }),
            datasets: [{
              data: cpuPts.map(p => parseFloat(p[1]).toFixed(1)),
              borderColor: c.cyan,
              backgroundColor: c.cyanAlpha,
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              borderWidth: 2,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 400 },
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: {
              x: { display: false },
              y: { display: false, beginAtZero: true },
            },
          },
        });
      }
    } catch {
      // cAdvisor data not available
      const cpuValueEl = document.getElementById('chart-container-cpu-value');
      if (cpuValueEl) cpuValueEl.textContent = 'N/A';
    }

    // RAM Usage
    try {
      const ramResults = await promRange('container_memory_usage_bytes{container="backend"} / 1024 / 1024', '5m');
      const ramPts = ramResults[0]?.values || [];

      if (ramPts.length > 0) {
        const latestRam = parseFloat(ramPts[ramPts.length - 1][1]).toFixed(0);
        const ramValueEl = document.getElementById('chart-container-ram-value');
        if (ramValueEl) ramValueEl.textContent = `${latestRam} MB`;

        safeRenderChart('chart-container-ram-canvas', {
          type: 'line',
          data: {
            labels: ramPts.map(p => {
              const d = new Date(p[0] * 1000);
              return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }),
            datasets: [{
              data: ramPts.map(p => parseFloat(p[1]).toFixed(0)),
              borderColor: c.green,
              backgroundColor: c.greenAlpha,
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              borderWidth: 2,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 400 },
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: {
              x: { display: false },
              y: { display: false, beginAtZero: true },
            },
          },
        });
      }
    } catch {
      const ramValueEl = document.getElementById('chart-container-ram-value');
      if (ramValueEl) ramValueEl.textContent = 'N/A';
    }

    // Restarts
    try {
      const restartResults = await promQuery('sum by(container) (kube_pod_container_status_restarts_total)');
      const totalRestarts = restartResults.reduce((sum, r) => sum + parseFloat(r.value[1]), 0);
      const restartValueEl = document.getElementById('chart-container-restarts-value');
      if (restartValueEl) restartValueEl.textContent = Math.round(totalRestarts).toString();

      // Show a flat sparkline for restarts (cumulative counter)
      safeRenderChart('chart-container-restarts-canvas', {
        type: 'line',
        data: {
          labels: [''],
          datasets: [{
            data: [totalRestarts],
            borderColor: totalRestarts > 0 ? c.rose : c.green,
            backgroundColor: totalRestarts > 0 ? c.roseAlpha : c.greenAlpha,
            fill: true,
            tension: 0,
            pointRadius: 0,
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400 },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { display: false },
            y: { display: false, beginAtZero: true },
          },
        },
      });
    } catch {
      const restartValueEl = document.getElementById('chart-container-restarts-value');
      if (restartValueEl) restartValueEl.textContent = 'N/A';
    }
  }

  async function refreshDeploymentTimeline() {
    const promQuery = window.promQuery;
    if (!promQuery) return;

    const timelineEl = document.getElementById('deployment-timeline');
    if (!timelineEl) return;

    try {
      // Query container start time
      const startResults = await promQuery('container_start_time_seconds{container="backend"}');
      const restartResults = await promQuery('sum by(container) (container_restart_count{container="backend"})');

      const events = [];

      // Container start event
      if (startResults.length > 0 && startResults[0].value) {
        const startTime = parseFloat(startResults[0].value[1]);
        if (!isNaN(startTime) && startTime > 0) {
          const startDate = new Date(startTime * 1000);
          events.push({
            timestamp: startDate,
            label: 'Container started',
            type: 'start',
          });
        }
      }

      // Container restart events
      if (restartResults.length > 0 && restartResults[0].value) {
        const restartCount = parseFloat(restartResults[0].value[1]);
        if (!isNaN(restartCount) && restartCount > 0) {
          events.push({
            timestamp: new Date(),
            label: `${Math.round(restartCount)} container restart(s) detected`,
            type: 'restart',
          });
        }
      }

      if (events.length === 0) {
        timelineEl.innerHTML = '<div class="timeline-placeholder">No deployment events available</div>';
        return;
      }

      // Sort events by timestamp (newest first)
      events.sort((a, b) => b.timestamp - a.timestamp);

      timelineEl.innerHTML = '';
      events.forEach(event => {
        const eventEl = document.createElement('div');
        eventEl.className = `timeline-event${event.type === 'restart' ? ' error' : ''}`;

        const timeStr = event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = event.timestamp.toLocaleDateString();

        eventEl.innerHTML = `
          <div class="timeline-timestamp">${sanitizeLabel(dateStr)} ${sanitizeLabel(timeStr)}</div>
          <div class="timeline-label">${sanitizeLabel(event.label)}</div>
        `;
        timelineEl.appendChild(eventEl);
      });
    } catch {
      timelineEl.innerHTML = '<div class="timeline-placeholder">Container metrics unavailable</div>';
    }
  }

  // ── Refresh cycle ────────────────────────────────────────

  async function refresh() {
    try {
      await Promise.allSettled([
        refreshHTTPStatusChart(),
        refreshEndpointActivityChart(),
        refreshContainerResources(),
        refreshDeploymentTimeline(),
      ]);
    } catch (err) {
      console.error('Infrastructure Health refresh error:', err);
    }
  }

  // Initial render
  await refresh();

  // Set up 10s refresh interval
  const intervalId = setInterval(refresh, 10000);

  return { refresh, stop: () => clearInterval(intervalId) };
}
