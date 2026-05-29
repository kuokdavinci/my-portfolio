---
phase: 05.1-observability-foundation
decision: architecture-approach
chosen: B
date: 2026-05-29
---

# Architecture Decision: Dashboard Stack

## Chosen Option

**Option B: Enhance existing Vanilla JS + Vite stack**

## Rationale

- Current stack (Vanilla JS + Vite + TailwindCSS) is stable and functional
- Avoids 2-3 additional phases required for full Next.js migration
- Apache ECharts (via CDN) supports all required visualizations: area charts, funnel charts, gauge charts, heatmap, dual-axis, stacked area
- Faster delivery while maintaining professional quality
- All 5 dashboard sections achievable within current architecture

## Implications

- Replace Chart.js with Apache ECharts for richer visualizations
- All UI plans (5.2, 5.3) proceed with Vanilla JS + ECharts approach
- No framework migration risk
- Dark mode already implemented, theme sync works globally

## Stack Adjustments from Brief

| Brief Target | Actual |
|-------------|--------|
| Next.js + TypeScript | Vanilla JS + Vite |
| shadcn/ui | TailwindCSS + custom components |
| Framer Motion | CSS transitions + keyframes |
| Recharts/Tremor | Apache ECharts (CDN) |
| Zustand/Context | Module pattern + global state |
