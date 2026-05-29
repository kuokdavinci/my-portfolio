# Portfolio Roadmap

> **Project:** kuokdavinci-portfolio — Vanilla JS portfolio with RAG chatbot
> **Created:** 2026-05-26

## Milestones

### Milestone 1: Core Portfolio Experience
**Status:** Complete

**Phases:**
- ~~Phase 0: Foundation~~ — Initial scaffolding, Vite + Tailwind setup
- ~~Phase 1: Portfolio Content~~ — Personal info, projects, skills, journey sections
- ~~Phase 2: RAG Chatbot~~ — Client-side RAG chatbot with knowledge base retrieval

---

### Milestone 2: Enhanced UX & Engagement
**Status:** In Progress

**Phases:**
- **Phase 3: Chatbot UX Enhancement** — Improve chatbot feedback with visible loading states, streaming effects, and smooth animations

---

### Milestone 3: Analytics & Observability
**Status:** In Progress

**Phases:**
- **Phase 4: Dashboard Page** — Move metrics from homepage to dedicated Dashboard page with theme sync
- **Phase 5: Observability Dashboard** — Production-grade observability dashboard with 5 sections, real-time telemetry, AI monitoring, and infrastructure health
  - **Phase 5.1: Architecture + Foundation** — Architecture decision (Next.js vs Vanilla), project setup, backend metrics expansion
  - **Phase 5.2: Dashboard UI (Sections 1-3)** — System Overview, User Behavior Analytics, AI Observability
  - **Phase 5.3: Dashboard UI (Sections 4-5)** — Infrastructure Health, Live Telemetry, real-time architecture

**Requirements:**
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

---

## Phase Details

### Phase 3: Chatbot UX Enhancement

**Goal:** Enhance chatbot user experience with visible feedback states, smooth message animations, and natural-feeling response delivery — even when responses are instantaneous (local fallback).

**Requirements:**
- CHAT-01: Thinking/loading indicator must be visible for a minimum duration so users perceive it
- CHAT-02: Bot responses should appear with a natural typing/streaming effect
- CHAT-03: Messages should have smooth entrance animations (fade + slide)
- CHAT-04: Chat scroll behavior must remain smooth during animations
- CHAT-05: Agent processing state must be visible — show sequential steps (analyzing, retrieving, generating) with completion indicators
- CHAT-06: Clicking links in chat messages must navigate without closing the chat panel

**Plans:** 2/2 plans complete

**Plans:**
- [x] 03-01-PLAN.md — Chatbot UX Enhancement (fix short circuit + streaming + animations)
- [x] 03-02-PLAN.md — Agent state visibility + link behavior (show tool states, links don't close chat)

---

### Phase 4: Dashboard Page

**Goal:** Create a dedicated Dashboard page to display portfolio metrics (stat cards + Grafana analytics) that are currently embedded on the homepage, with theme synchronization.

**Requirements:**
- DASH-01: Dashboard accessible via `#dashboard` hash route
- DASH-02: Dashboard displays all current metrics (4 stat cards + Grafana iframe)
- DASH-03: Stats section removed from homepage
- DASH-04: Theme sync with homepage (dark/light mode)
- DASH-05: Dashboard link in navigation (desktop + mobile)

**Plans:** 1/1 plans complete

**Plans:**
- [x] 04-01-PLAN.md — Create Dashboard page, update navigation, wire routing

---

### Phase 5.1: Architecture + Foundation

**Goal:** Resolve architecture decision, expand backend Prometheus metrics, create enhanced frontend tracking SDK.

**Requirements:**
- OBS-01: Dashboard has 5 major sections
- OBS-02: Dark mode only, high contrast, soft neon accents
- OBS-03: Real-time metrics with smooth animations
- OBS-04: Prometheus metrics endpoint integration
- OBS-05: SSE or WebSocket for live metrics updates
- OBS-06: Frontend tracking SDK

**Plans:** 2 plans
- [ ] 05.1-01-PLAN.md — Architecture decision checkpoint
- [ ] 05.1-02-PLAN.md — Backend metrics + tracking SDK + cAdvisor

---

### Phase 5.2: Dashboard UI (Sections 1-3)

**Goal:** Build System Overview, User Behavior Analytics, and AI Observability sections.

**Requirements:**
- OBS-01: Dashboard has 5 major sections
- OBS-02: Dark mode only, high contrast, soft neon accents
- OBS-03: Real-time metrics with smooth animations
- OBS-07: AI observability (intent categories, LLM performance, token consumption, estimated cost, cache hit rate)

**Plans:** 2 plans
- [ ] 05.2-01-PLAN.md — System Overview + User Behavior Analytics
- [ ] 05.2-02-PLAN.md — AI Observability

---

### Phase 5.3: Dashboard UI (Sections 4-5)

**Goal:** Build Infrastructure Health, Live Telemetry, wire all sections together.

**Requirements:**
- OBS-01: Dashboard has 5 major sections
- OBS-02: Dark mode only, high contrast, soft neon accents
- OBS-03: Real-time metrics with smooth animations
- OBS-08: Infrastructure health
- OBS-09: Live request stream
- OBS-10: Error rate monitor

**Plans:** 2 plans
- [ ] 05.3-01-PLAN.md — Infrastructure Health + Live Telemetry
- [ ] 05.3-02-PLAN.md — Dashboard wiring + responsive layout + polish

---

## Stakeholders

- **User:** Primary portfolio visitor (HR/recruiter)
- **Owner:** kuokdavinci
