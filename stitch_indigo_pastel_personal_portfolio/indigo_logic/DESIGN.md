---
name: Indigo Logic
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464f'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#767680'
  outline-variant: '#c6c5d1'
  surface-tint: '#505b92'
  primary: '#061449'
  on-primary: '#ffffff'
  primary-container: '#1e2a5e'
  on-primary-container: '#8793cd'
  inverse-primary: '#b9c3ff'
  secondary: '#725765'
  on-secondary: '#ffffff'
  secondary-container: '#fad6e7'
  on-secondary-container: '#775b69'
  tertiary: '#091a2d'
  on-tertiary: '#ffffff'
  tertiary-container: '#1f2f43'
  on-tertiary-container: '#8797af'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b9c3ff'
  on-primary-fixed: '#08164b'
  on-primary-fixed-variant: '#384378'
  secondary-fixed: '#fdd9ea'
  secondary-fixed-dim: '#e0bdce'
  on-secondary-fixed: '#2a1521'
  on-secondary-fixed-variant: '#593f4d'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '450'
    lineHeight: '1.5'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

This design system is engineered for the persona of a Backend and AI specialist, where precision, architectural integrity, and technical authority are paramount. The visual language balances the "heavy" logic of backend infrastructure with a sophisticated, minimalist aesthetic.

The style is **Modern Minimalist with Technical Accents**. It leverages high-contrast typography and a strict grid-based layout to reflect the organized nature of code. Influence is drawn from IDE interfaces and terminal environments, translated into a high-end professional UI. Key characteristics include:
*   **Technical Authority:** Use of Deep Indigo to establish a stable, expert foundation.
*   **Precise Minimalism:** Heavy use of whitespace and the elimination of unnecessary decoration (no gradients, no heavy shadows).
*   **Logical Hierarchy:** Information is structured with a "data-first" priority, using monospaced accents to highlight technical variables and outputs.
*   **Subtle Sophistication:** Pastel Pink is used sparingly as a "human" counterpoint to the cold logic of indigo, marking active states or critical path highlights.

## Colors

The palette is anchored by **Deep Indigo (#1e2a5e)**, representing the depth and complexity of backend engineering. This color serves as the primary weight for headers, primary buttons, and navigational anchors.

**Pastel Pink** acts as a surgical accent. It is not a secondary brand color for large surfaces, but a highlighter for interactive states, focused input borders, or successful status indicators.

**Neutral Scales** lean toward cool slates and off-whites to maintain a "clean-room" laboratory feel. 
*   **Primary:** #1E2A5E (Authority, Structure)
*   **Accent:** #F4D0E1 (Focus, Interaction)
*   **Background:** #F8FAFC (Clarity, Air)
*   **Surface:** #FFFFFF (Content Purity)

## Typography

The typography system uses a dual-concept approach to distinguish between "Content" and "Data."

1.  **Interface & Content (Geist/Inter):** A clean, modern sans-serif stack for primary communication. Geist is used for headings to provide a sharp, technical edge, while Inter handles body copy for maximum legibility.
2.  **Technical Data (JetBrains Mono):** All technical metadata, system logs, code snippets, and interface labels (like tags or IDs) must be set in JetBrains Mono. This creates an immediate visual distinction between the "user layer" and the "system layer."

Maintain a strict vertical rhythm. Headlines should have tighter letter spacing to feel dense and intentional.

## Layout & Spacing

The layout is governed by a **12-column fixed grid** on desktop (max-width 1280px) and a **4-column fluid grid** on mobile.

**Grid Discipline:**
*   Use a subtle 24px dot-matrix or hairline grid pattern in the background of large sections to reinforce the "logical" nature of the design.
*   Whitespace is used as a functional separator rather than lines whenever possible. 
*   **Desktop:** 64px outer margins with 24px gutters.
*   **Mobile:** 20px outer margins with 16px gutters.

The spacing system follows a linear 8px scale. For technical data density, the 'sm' (12px) unit is preferred to keep information compact and readable.

## Elevation & Depth

This design system rejects traditional shadows in favor of **Flat Depth** and **Tonal Layering**. 

*   **Tiers:** The background is the lowest tier (#F8FAFC). Content cards sit on the middle tier (#FFFFFF) and are defined by 1px solid borders (#E2E8F0) rather than shadows.
*   **Ghost Borders:** Interactive elements use low-opacity Indigo outlines. When hovered, these borders transition to the solid Pastel Pink accent.
*   **Zero Elevation:** No element should appear "floating." Everything is conceptually "milled" or "etched" into the grid. Use 1px hairlines to separate technical data columns.

## Shapes

The shape language is "Soft-Mechanical." We use a very small border radius (4px) to prevent the UI from feeling aggressive (Brutalist), while avoiding the playfulness of fully rounded corners.

*   **Standard Radius:** 4px (Soft) for buttons, inputs, and cards.
*   **Technical Elements:** Tags and Status chips use 0px (Sharp) corners to emphasize their role as discrete data points.
*   **Pill Shapers:** Strictly reserved for status indicators (e.g., "Online" or "Running") to provide a clear "light" metaphor.

## Components

**Buttons:**
*   **Primary:** Deep Indigo background, white text. No border. 4px radius.
*   **Secondary:** White background, 1px Deep Indigo border, Deep Indigo text.
*   **Tertiary/Ghost:** No background or border. JetBrains Mono font. Pastel Pink underline on hover.

**Input Fields:**
*   Minimalist style. 1px Slate-200 border that transforms to 1px Pastel Pink on focus. Labels use JetBrains Mono, size 12px, placed above the field.

**Cards:**
*   White background, 1px Slate-200 border. No shadow. Headers within cards should have a subtle 1px bottom border to separate titles from content.

**Technical Metadata (Chips):**
*   Small, rectangular (0px radius) blocks. Deep Indigo text on a very light slate background. Used for API endpoints, version numbers, or log types.

**Code Blocks:**
*   Deep Indigo background (#1e2a5e). Syntax highlighting should utilize the Pastel Pink accent for variables or strings to maintain brand cohesion.

**Grid Patterns:**
*   A background utility component: 24px grid of 1px dots in #E2E8F0, used to define section containers.