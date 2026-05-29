/**
 * Dashboard Orchestrator — assembles all sections and manages data refresh.
 *
 * Exports: initDashboard(), refreshDashboard()
 *
 * Mounts System Overview, User Behavior, AI Observability, Infrastructure Health,
 * and Live Telemetry sections into the #dashboard container.
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
let isInitialized = false;

/**
 * Initialize the dashboard: render all sections into #dashboard.
 * Should be called when the user navigates to #dashboard route.
 */
export async function initDashboard() {
  if (isInitialized) {
    // Already initialized — just refresh
    await refreshDashboard();
    return;
  }

  const dashboardEl = document.getElementById('dashboard');
  if (!dashboardEl) {
    console.warn('Dashboard container #dashboard not found');
    return;
  }

  // Clear existing dashboard content (keep the header/title area if present)
  // We replace the inner content with our new structure
  const existingContent = dashboardEl.querySelector('.dashboard-content');
  if (existingContent) {
    existingContent.innerHTML = '';
  } else {
    // Create a content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'dashboard-content';
    contentWrapper.style.cssText = 'max-width:7xl;margin:0 auto;padding:0 1rem;';
    dashboardEl.appendChild(contentWrapper);
  }

  const contentEl = dashboardEl.querySelector('.dashboard-content');
  if (!contentEl) return;

  // Render System Overview
  const overviewContainer = document.createElement('div');
  overviewContainer.style.marginBottom = '24px';
  contentEl.appendChild(overviewContainer);
  systemOverviewHandle = await renderSystemOverview(overviewContainer);

  // Render User Behavior Analytics
  const behaviorContainer = document.createElement('div');
  contentEl.appendChild(behaviorContainer);
  userBehaviorHandle = await renderUserBehavior(behaviorContainer);

  // Render AI Observability
  const aiContainer = document.createElement('div');
  aiContainer.style.marginTop = '24px';
  contentEl.appendChild(aiContainer);
  aiObservabilityHandle = await renderAIObservability(aiContainer);

  // Render Infrastructure Health
  const infraContainer = document.createElement('div');
  infraContainer.style.marginTop = '24px';
  contentEl.appendChild(infraContainer);
  infrastructureHealthHandle = await renderInfrastructureHealth(infraContainer);

  // Render Live Telemetry
  const telemetryContainer = document.createElement('div');
  telemetryContainer.style.marginTop = '24px';
  contentEl.appendChild(telemetryContainer);
  liveTelemetryHandle = await renderLiveTelemetry(telemetryContainer);

  isInitialized = true;
}

/**
 * Trigger a manual refresh of all dashboard sections.
 */
export async function refreshDashboard() {
  if (systemOverviewHandle && typeof systemOverviewHandle.refresh === 'function') {
    await systemOverviewHandle.refresh();
  }
  if (userBehaviorHandle && typeof userBehaviorHandle.refresh === 'function') {
    await userBehaviorHandle.refresh();
  }
  if (aiObservabilityHandle && typeof aiObservabilityHandle.refresh === 'function') {
    await aiObservabilityHandle.refresh();
  }
  if (infrastructureHealthHandle && typeof infrastructureHealthHandle.refresh === 'function') {
    await infrastructureHealthHandle.refresh();
  }
  if (liveTelemetryHandle && typeof liveTelemetryHandle.refresh === 'function') {
    await liveTelemetryHandle.refresh();
  }
}

/**
 * Stop all refresh intervals.
 * Called when navigating away from the dashboard.
 */
export function stopDashboard() {
  if (systemOverviewHandle && typeof systemOverviewHandle.stop === 'function') {
    systemOverviewHandle.stop();
  }
  if (userBehaviorHandle && typeof userBehaviorHandle.stop === 'function') {
    userBehaviorHandle.stop();
  }
  if (aiObservabilityHandle && typeof aiObservabilityHandle.stop === 'function') {
    aiObservabilityHandle.stop();
  }
  if (infrastructureHealthHandle && typeof infrastructureHealthHandle.stop === 'function') {
    infrastructureHealthHandle.stop();
  }
  if (liveTelemetryHandle && typeof liveTelemetryHandle.stop === 'function') {
    liveTelemetryHandle.stop();
  }
  isInitialized = false;
}

// Expose promQuery and promRange on window for section modules to use
// (they are defined in main.js as global functions)
window.promQuery = window.promQuery || null;
window.promRange = window.promRange || null;
