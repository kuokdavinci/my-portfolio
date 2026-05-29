# Phase 4: Dashboard Page — Context

## User Vision
Create a separate Dashboard page to display metrics that are currently on the homepage. Theme should sync with homepage.

## Current State
- **Homepage stats section** (`index.html` lines 119-159): Contains 4 stat cards (GitHub Repos, Chat Queries, Active Sessions, All Systems Online) + Grafana iframe embed
- **Stats JS** (`src/main.js` lines 687-709): `loadPortfolioStats()` fetches Prometheus data for stat-queries and stat-sessions
- **Navigation**: Hash-based routing with `#home`, `#journey`, `#projects`, `#skills` links in header nav + mobile drawer
- **Theme**: Dark/light toggle with `ios-toggle` button, CSS classes use `dark:` prefix, theme stored in localStorage
- **Router**: `handleRoute()` in `src/main.js` handles `#/project/:id` routes, other hashes scroll to section IDs

## Decisions
- **D-01**: Dashboard should be a separate page (not a section on homepage), accessible via `#dashboard` hash route
- **D-02**: Theme must sync with homepage (same dark/light mode, same CSS variables, same toggle)
- **D-03**: Stats section should be REMOVED from homepage (lines 119-159 in index.html)
- **D-04**: Dashboard should include all current metrics: 4 stat cards + Grafana iframe + "Open in Grafana" link
- **D-05**: Navigation should include a "Dashboard" link in both desktop nav and mobile drawer
- **D-06**: The GitHub Repos counter in the hero section (line 103) should remain on homepage — only the stats section moves

## Scope
- Move stats section from homepage to new Dashboard page
- Add Dashboard route and navigation links
- Keep all existing functionality (Prometheus fetching, Grafana embed, counter animations)
- No new metrics or features — exact migration with theme sync
