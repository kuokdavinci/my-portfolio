# Phase 5 Context — Portfolio Observability Dashboard

## Phase Goal
Build a production-style observability dashboard integrated into the personal portfolio system that demonstrates infrastructure engineering capability, observability/telemetry design, AI system monitoring, and real-time analytics architecture.

## Current State
- **Frontend:** Vanilla JS + Vite + TailwindCSS + Chart.js (NOT Next.js)
- **Backend:** FastAPI (Python) with 4 Prometheus metrics already defined
- **Infrastructure:** Docker Compose with Prometheus, Grafana, Kafka, Redis, Qdrant
- **Existing Dashboard:** Basic stat cards (4) + Chart.js charts (5) + Grafana iframe
- **Tracking:** Basic `trackEvent()` function with page_view, project_click, scroll_depth

## Critical Architecture Decision Required
The brief specifies Next.js + TypeScript + shadcn/ui + Framer Motion + Recharts/Tremor.
The current project uses Vanilla JS + Vite + TailwindCSS + Chart.js.

**Options:**
- **A: Migrate to Next.js** — Full migration to React/Next.js. Clean architecture, modern libraries. Bigger initial effort but matches brief exactly.
- **B: Enhance existing stack** — Keep Vanilla JS + Vite, use Apache ECharts or advanced Chart.js for rich visualizations. Faster delivery, less risk.
- **C: Hybrid** — Create observability dashboard as separate Next.js sub-app at /dashboard path alongside vanilla portfolio.

## Scope Assessment
This phase is TOO LARGE for a single planning cycle. It must be split into sub-phases:

**Proposed Split:**
- **Phase 5a:** Foundation + Architecture Decision + Backend Metrics Expansion
- **Phase 5b:** Dashboard UI — Sections 1-3 (System Overview, User Behavior, AI Observability)
- **Phase 5c:** Dashboard UI — Sections 4-5 (Infrastructure Health, Live Telemetry) + Real-time Architecture

## Requirements
- OBS-01: Dashboard has 5 major sections (System Overview, User Behavior, AI Observability, Infrastructure Health, Live Telemetry)
- OBS-02: Dark mode only, high contrast, soft neon accents, clean SaaS aesthetic
- OBS-03: Real-time metrics with smooth animations (number ticker, pulse effects, chart transitions)
- OBS-04: Prometheus metrics endpoint integration
- OBS-05: SSE or WebSocket for live metrics updates
- OBS-06: Frontend tracking SDK (page views, sessions, scroll depth, downloads, project clicks, chat interactions)
- OBS-07: AI observability (intent categories, LLM performance, token consumption, estimated cost, cache hit rate)
- OBS-08: Infrastructure health (HTTP status distribution, endpoint activity, container resources, deployment timeline)
- OBS-09: Live request stream (terminal-style, SSE, auto-scroll, 100 row limit)
- OBS-10: Error rate monitor with alert thresholds

## User Decisions
- Dark mode only (locked)
- Dense professional telemetry UI (locked)
- Subtle motion only — no excessive animation (locked)
- 10s chart refresh, realtime live feed (locked)
- SSE preferred for metrics, WebSocket for live stream (locked)
