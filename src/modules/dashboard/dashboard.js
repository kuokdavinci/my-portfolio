/**
 * Dashboard Orchestrator — assembles all 5 sections and manages data refresh.
 *
 * Exports: initDashboard(), refreshDashboard(), destroyDashboard()
 *
 * Mounts System Overview, User Behavior, AI Observability, Infrastructure Health,
 * and Live Telemetry sections into the #dashboard-content container.
 * Manages 10s refresh cycles for all sections.
 */

import { renderSystemOverview } from './sections/system-overview.js';
import { renderUserBehavior } from './sections/user-behavior.js';
import { renderAIObservability } from './sections/ai-observability.js';
import { renderInfrastructureHealth } from './sections/infrastructure-health.js';
import { renderLiveTelemetry } from './sections/live-telemetry.js';

// Import Live Telemetry CSS
import './sections/live-telemetry.css';

let systemOverviewHandle = null;
let userBehaviorHandle = null;
let aiObservabilityHandle = null;
let infrastructureHealthHandle = null;
let liveTelemetryHandle = null;
let refreshInterval = null;
let isInitialized = false;

/**
 * Initialize the dashboard: render all 5 sections into #dashboard-content.
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

  // Render all 5 sections in order
  const overviewContainer = createSectionContainer(container, 'system-overview');
  systemOverviewHandle = await renderSystemOverview(overviewContainer);

  const behaviorContainer = createSectionContainer(container, 'user-behavior');
  userBehaviorHandle = await renderUserBehavior(behaviorContainer);

  const aiContainer = createSectionContainer(container, 'ai-observability');
  aiObservabilityHandle = await renderAIObservability(aiContainer);

  const infraContainer = createSectionContainer(container, 'infrastructure-health');
  infrastructureHealthHandle = await renderInfrastructureHealth(infraContainer);

  const telemetryContainer = createSectionContainer(container, 'live-telemetry');
  liveTelemetryHandle = await renderLiveTelemetry(telemetryContainer);

  // Set up unified 10s refresh cycle
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  refreshInterval = setInterval(async () => {
    await refreshDashboard();
  }, 10000);

  isInitialized = true;

  // Update last-refresh timestamp
  updateLastRefresh();
}

/**
 * Trigger a manual refresh of all dashboard sections.
 */
export async function refreshDashboard() {
  const overviewContainer = document.getElementById('section-system-overview');
  const behaviorContainer = document.getElementById('section-user-behavior');
  const aiContainer = document.getElementById('section-ai-observability');
  const infraContainer = document.getElementById('section-infrastructure-health');

  if (overviewContainer && systemOverviewHandle?.refresh) {
    await systemOverviewHandle.refresh();
  }
  if (behaviorContainer && userBehaviorHandle?.refresh) {
    await userBehaviorHandle.refresh();
  }
  if (aiContainer && aiObservabilityHandle?.refresh) {
    await aiObservabilityHandle.refresh();
  }
  if (infraContainer && infrastructureHealthHandle?.refresh) {
    await infrastructureHealthHandle.refresh();
  }
  // Live telemetry updates via SSE, no need to re-render
  if (liveTelemetryHandle?.refresh) {
    await liveTelemetryHandle.refresh();
  }

  // Update last-refresh timestamp
  updateLastRefresh();
}

/**
 * Destroy all dashboard resources: intervals, SSE connections, Chart.js instances.
 * Called when navigating away from the dashboard.
 */
export function destroyDashboard() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }

  // Stop all section refresh intervals and SSE connections
  if (systemOverviewHandle?.stop) systemOverviewHandle.stop();
  if (userBehaviorHandle?.stop) userBehaviorHandle.stop();
  if (aiObservabilityHandle?.stop) aiObservabilityHandle.stop();
  if (infrastructureHealthHandle?.stop) infrastructureHealthHandle.stop();
  if (liveTelemetryHandle?.stop) liveTelemetryHandle.stop();

  // Destroy all Chart.js instances
  destroyCharts();

  // Clear handles
  systemOverviewHandle = null;
  userBehaviorHandle = null;
  aiObservabilityHandle = null;
  infrastructureHealthHandle = null;
  liveTelemetryHandle = null;

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
