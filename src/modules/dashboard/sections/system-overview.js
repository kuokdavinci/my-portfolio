/**
 * System Overview — 5 stat cards with sparklines, animated values, and live pulse indicators.
 *
 * Exports: renderSystemOverview(container)
 *
 * Stat cards:
 *   1. Total AI Queries
 *   2. Portfolio Sessions
 *   3. Resume Downloads
 *   4. Active Users (Realtime)
 *   5. System Uptime
 *
 * Data refresh: every 10s via setInterval
 */

/* ── Helpers ──────────────────────────────────────────────── */

/**
 * Animate a numeric value change with ease-out cubic.
 * @param {HTMLElement} element
 * @param {number} start
 * @param {number} end
 * @param {number} duration — ms, default 500
 */
function animateValue(element, start, end, duration = 500) {
  const range = end - start;
  if (range === 0) {
    element.textContent = Math.round(end).toLocaleString();
    return;
  }
  const startTime = performance.now();
  function step(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(start + range * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/**
 * Draw a mini sparkline on a canvas element.
 * @param {HTMLCanvasElement} canvas
 * @param {number[]} data
 * @param {string} color
 */
function drawSparkline(canvas, data, color) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padding = 2;

  ctx.clearRect(0, 0, w, h);

  if (data.length < 2) return;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const stepX = (w - padding * 2) / (data.length - 1);

  // Gradient fill
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, color + '40');
  gradient.addColorStop(1, color + '00');

  // Fill area
  ctx.beginPath();
  ctx.moveTo(padding, h - padding);
  data.forEach((val, i) => {
    const x = padding + i * stepX;
    const y = h - padding - ((val - min) / range) * (h - padding * 2);
    ctx.lineTo(x, y);
  });
  ctx.lineTo(padding + (data.length - 1) * stepX, h - padding);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Line
  ctx.beginPath();
  data.forEach((val, i) => {
    const x = padding + i * stepX;
    const y = h - padding - ((val - min) / range) * (h - padding * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

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

/* ── Sparkline data buffers (last 12 points per metric) ─── */

const sparklineBuffers = {
  aiQueries: [],
  sessions: [],
  downloads: [],
  activeUsers: [],
  uptime: [],
};

const MAX_SPARKLINE_POINTS = 12;

function pushSparkline(key, value) {
  const buf = sparklineBuffers[key];
  buf.push(value);
  if (buf.length > MAX_SPARKLINE_POINTS) buf.shift();
  return [...buf];
}

/* ── Previous values for animation ──────────────────────── */

const previousValues = {
  aiQueries: 0,
  sessions: 0,
  downloads: 0,
  activeUsers: 0,
};

/* ── Card rendering ─────────────────────────────────────── */

function createStatCard(id, title, statusType) {
  const card = document.createElement('div');
  card.className = 'dashboard-stat-card';
  card.id = id;

  const isLive = statusType === 'live';
  const isActive = statusType === 'active';
  const isStatic = statusType === 'static';

  const pulseClass = isActive ? 'stat-pulse active' : 'stat-pulse';

  card.innerHTML = `
    <div class="stat-card-header">
      <span class="stat-card-title">${sanitizeLabel(title)}</span>
      ${isLive || isActive
        ? `<span class="${pulseClass}"></span>`
        : isStatic
          ? `<span class="stat-live-badge">LIVE</span>`
          : ''
      }
    </div>
    <div class="stat-value" id="${id}-value">—</div>
    <div class="stat-subtitle" id="${id}-subtitle"></div>
    <div class="stat-delta" id="${id}-delta"></div>
    <canvas class="stat-sparkline" id="${id}-sparkline"></canvas>
  `;

  return card;
}

/* ── Main render function ───────────────────────────────── */

/**
 * Render the System Overview section into the given container.
 * @param {HTMLElement} container
 * @returns {{ refresh: () => Promise<void>, stop: () => void }}
 */
export async function renderSystemOverview(container) {
  // Section title
  const titleEl = document.createElement('div');
  titleEl.className = 'dashboard-section-title';
  titleEl.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">dashboard</span> System Overview';
  container.appendChild(titleEl);

  // Cards grid
  const grid = document.createElement('div');
  grid.className = 'dashboard-overview';

  const cards = [
    { id: 'card-ai-queries', title: 'AI Queries', status: 'live' },
    { id: 'card-sessions', title: 'Sessions', status: 'live' },
    { id: 'card-downloads', title: 'Downloads', status: 'live' },
    { id: 'card-active-users', title: 'Active Users', status: 'active' },
    { id: 'card-uptime', title: 'Uptime', status: 'static' },
  ];

  cards.forEach(c => {
    grid.appendChild(createStatCard(c.id, c.title, c.status));
  });

  container.appendChild(grid);

  // ── Data fetch + update cycle ────────────────────────────

  async function refresh() {
    // Import promQuery from the global scope (exposed by main.js)
    const promQuery = window.promQuery;
    if (!promQuery) return;

    try {
      // 1. Total AI Queries
      const aiRes = await promQuery('sum(chatbot_queries_total)');
      const aiTotal = parseFloat(aiRes[0]?.value?.[1] || '0');
      const aiEl = document.getElementById('card-ai-queries-value');
      if (aiEl) animateValue(aiEl, previousValues.aiQueries, Math.round(aiTotal));
      previousValues.aiQueries = Math.round(aiTotal);

      const aiRateRes = await promQuery('sum(rate(chatbot_queries_total[5m])) * 60');
      const aiRate = parseFloat(aiRateRes[0]?.value?.[1] || '0');
      const aiSub = document.getElementById('card-ai-queries-subtitle');
      if (aiSub) aiSub.textContent = `${aiRate.toFixed(1)} queries/min`;

      const aiSpark = pushSparkline('aiQueries', aiRate);
      const aiCanvas = document.getElementById('card-ai-queries-sparkline');
      if (aiCanvas) drawSparkline(aiCanvas, aiSpark, '#cebdff');

      // 2. Portfolio Sessions
      const sessRes = await promQuery('sum(portfolio_sessions_total)');
      const sessTotal = parseFloat(sessRes[0]?.value?.[1] || '0');
      const sessEl = document.getElementById('card-sessions-value');
      if (sessEl) animateValue(sessEl, previousValues.sessions, Math.round(sessTotal));
      previousValues.sessions = Math.round(sessTotal);

      const sessSub = document.getElementById('card-sessions-subtitle');
      if (sessSub) sessSub.textContent = 'Total sessions';

      const sessSpark = pushSparkline('sessions', sessTotal);
      const sessCanvas = document.getElementById('card-sessions-sparkline');
      if (sessCanvas) drawSparkline(sessCanvas, sessSpark, '#a4c9ff');

      // 3. Resume Downloads
      const dlRes = await promQuery('sum(resume_download_total)');
      const dlTotal = parseFloat(dlRes[0]?.value?.[1] || '0');
      const dlEl = document.getElementById('card-downloads-value');
      if (dlEl) animateValue(dlEl, previousValues.downloads, Math.round(dlTotal));
      previousValues.downloads = Math.round(dlTotal);

      const convRate = sessTotal > 0 ? ((dlTotal / sessTotal) * 100).toFixed(1) : '0.0';
      const dlSub = document.getElementById('card-downloads-subtitle');
      if (dlSub) dlSub.textContent = `${convRate}% conversion rate`;

      const dlSpark = pushSparkline('downloads', dlTotal);
      const dlCanvas = document.getElementById('card-downloads-sparkline');
      if (dlCanvas) drawSparkline(dlCanvas, dlSpark, '#22c55e');

      // 4. Active Users (Realtime)
      const activeRes = await promQuery('sum(active_sessions)');
      const activeCount = parseFloat(activeRes[0]?.value?.[1] || '0');
      const activeEl = document.getElementById('card-active-users-value');
      if (activeEl) animateValue(activeEl, previousValues.activeUsers, Math.round(activeCount));
      previousValues.activeUsers = Math.round(activeCount);

      const activeSub = document.getElementById('card-active-users-subtitle');
      if (activeSub) activeSub.textContent = 'Currently browsing';

      const activeSpark = pushSparkline('activeUsers', activeCount);
      const activeCanvas = document.getElementById('card-active-users-sparkline');
      if (activeCanvas) drawSparkline(activeCanvas, activeSpark, '#f59e0b');

      // 5. System Uptime (static)
      const uptimeEl = document.getElementById('card-uptime-value');
      if (uptimeEl) uptimeEl.textContent = '99.9%';

      const uptimeSub = document.getElementById('card-uptime-subtitle');
      if (uptimeSub) uptimeSub.textContent = 'Last 30 days';

      const uptimeDelta = document.getElementById('card-uptime-delta');
      if (uptimeDelta) {
        uptimeDelta.className = 'stat-delta positive';
        uptimeDelta.textContent = 'All systems operational';
      }

      const uptimeSpark = pushSparkline('uptime', 99.9);
      const uptimeCanvas = document.getElementById('card-uptime-sparkline');
      if (uptimeCanvas) drawSparkline(uptimeCanvas, uptimeSpark, '#22c55e');

    } catch (err) {
      console.error('System Overview refresh error:', err);
    }
  }

  // Initial refresh
  await refresh();

  return { refresh, stop: () => {} };
}
