/**
 * Dashboard Orchestrator — assembles all 3 sections and manages data refresh.
 *
 * Exports: initDashboard(), refreshDashboard(), destroyDashboard()
 *
 * Mounts System Overview, User Behavior, and AI Observability
 * sections into the #dashboard-content container.
 * Manages 10s refresh cycles for all sections.
 */

import { renderSystemOverview } from './sections/system-overview.js';
import { renderUserBehavior } from './sections/user-behavior.js';
import { renderAIObservability } from './sections/ai-observability.js';


// Import Live Telemetry CSS (for error rate and rate limiting styles)
import './sections/live-telemetry.css';

let systemOverviewHandle = null;
let userBehaviorHandle = null;
let aiObservabilityHandle = null;

let refreshInterval = null;
let isInitialized = false;

/**
 * Initialize the dashboard: render all 4 sections into #dashboard-content.
 * Should be called when the user navigates to #dashboard route.
 */
export async function initDashboard() {
  const container = document.getElementById('dashboard-content');
  if (!container) {
    console.warn('Dashboard content container #dashboard-content not found');
    return;
  }

  // Clear existing content
  container.innerHTML = '';

  // Destroy any previous Chart.js instances
  destroyCharts();

  // Render all 3 sections in order
  const overviewContainer = createSectionContainer(container, 'system-overview');
  systemOverviewHandle = await renderSystemOverview(overviewContainer);

  const behaviorContainer = createSectionContainer(container, 'user-behavior');
  userBehaviorHandle = await renderUserBehavior(behaviorContainer);

  const aiContainer = createSectionContainer(container, 'ai-observability');
  aiObservabilityHandle = await renderAIObservability(aiContainer);

  isInitialized = true;
  updateLastRefresh();
}

/**
 * Trigger a manual refresh of all dashboard sections.
 */
export async function refreshDashboard() {
  const overviewContainer = document.getElementById('section-system-overview');
  const behaviorContainer = document.getElementById('section-user-behavior');
  const aiContainer = document.getElementById('section-ai-observability');

  if (overviewContainer && systemOverviewHandle?.refresh) {
    await systemOverviewHandle.refresh();
  }
  if (behaviorContainer && userBehaviorHandle?.refresh) {
    await userBehaviorHandle.refresh();
  }
  if (aiContainer && aiObservabilityHandle?.refresh) {
    await aiObservabilityHandle.refresh();
  }
  // Update last-refresh timestamp
  updateLastRefresh();
}

/**
 * Destroy all dashboard resources: intervals, Chart.js instances.
 * Called when navigating away from the dashboard.
 */
export function destroyDashboard() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }

  // Stop all section refresh intervals
  if (systemOverviewHandle?.stop) systemOverviewHandle.stop();
  if (userBehaviorHandle?.stop) userBehaviorHandle.stop();
  if (aiObservabilityHandle?.stop) aiObservabilityHandle.stop();

  // Destroy all Chart.js instances
  destroyCharts();

  // Clear handles
  systemOverviewHandle = null;
  userBehaviorHandle = null;
  aiObservabilityHandle = null;

  isInitialized = false;
}

/**
 * Destroy all Chart.js instances registered in window.myCharts.
 * Prevents memory leaks from orphaned chart canvases (T-05.3-01 mitigation).
 */
function destroyCharts() {
  if (window.myCharts) {
    Object.values(window.myCharts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    window.myCharts = {};
  }
}

/**
 * Update the #last-refresh element with current time.
 */
function updateLastRefresh() {
  const lastRefresh = document.getElementById('last-refresh');
  if (lastRefresh) {
    lastRefresh.textContent = `Last refresh: ${new Date().toLocaleTimeString()}`;
  }
}

/**
 * Create a section container div and append to parent.
 */
function createSectionContainer(parent, id) {
  const section = document.createElement('div');
  section.id = `section-${id}`;
  section.className = 'dashboard-section';
  parent.appendChild(section);
  return section;
}

// Expose promQuery and promRange on window for section modules to use
// (they are defined in main.js as global functions)
window.promQuery = window.promQuery || null;
window.promRange = window.promRange || null;
