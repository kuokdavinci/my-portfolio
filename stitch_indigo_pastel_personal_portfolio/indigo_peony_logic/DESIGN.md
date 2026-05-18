---
name: Indigo & Peony Logic
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf4'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dde9ff'
  surface-container-highest: '#d5e3fd'
  on-surface: '#0d1c2f'
  on-surface-variant: '#45464f'
  inverse-surface: '#233144'
  inverse-on-surface: '#ebf1ff'
  outline: '#767680'
  outline-variant: '#c6c5d1'
  surface-tint: '#505b92'
  primary: '#061449'
  on-primary: '#ffffff'
  primary-container: '#1e2a5e'
  on-primary-container: '#8793cd'
  inverse-primary: '#b9c3ff'
  secondary: '#635c61'
  on-secondary: '#ffffff'
  secondary-container: '#e7dde3'
  on-secondary-container: '#686066'
  tertiary: '#2c1300'
  on-tertiary: '#ffffff'
  tertiary-container: '#4b2400'
  on-tertiary-container: '#c4895b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b9c3ff'
  on-primary-fixed: '#08164b'
  on-primary-fixed-variant: '#384378'
  secondary-fixed: '#eae0e6'
  secondary-fixed-dim: '#cec4ca'
  on-secondary-fixed: '#1f1a1e'
  on-secondary-fixed-variant: '#4b454a'
  tertiary-fixed: '#ffdcc4'
  tertiary-fixed-dim: '#fbb887'
  on-tertiary-fixed: '#2f1400'
  on-tertiary-fixed-variant: '#693c14'
  background: '#f8f9ff'
  on-background: '#0d1c2f'
  surface-variant: '#d5e3fd'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  code-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.5'
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2.5rem
  xl: 4rem
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

This design system is built for a high-level Backend and AI Engineer portfolio, balancing the rigid structural logic of systems engineering with the approachable warmth of modern product design. The aesthetic direction is **Logical Minimalism with a Tactile Softness**. 

The brand personality is authoritative yet welcoming—positioning the engineer not just as a coder, but as an architect of intelligent systems. The style utilizes a disciplined grid-based layout inspired by IDEs and technical documentation, but subverts the "dark mode" stereotype of backend engineering by using a sophisticated pastel peony and deep indigo palette. Subtle "code-like" details (monospaced accents, line-drawn borders, and bracketed labels) provide the technical texture without sacrificing the clean, premium feel.

## Colors

The palette centers on the tension between "The Logic" (Deep Indigo) and "The Warmth" (Soft Peony).

- **Deep Indigo (#1e2a5e):** Used for primary typography, structural borders, and high-importance buttons. It represents depth, stability, and precision.
- **Soft Peony (#fdf2f8):** The primary container and wash color. It replaces white to reduce eye strain and provide a distinctive, warm "studio" feel.
- **Main Surface (#fffafb):** A slightly lighter variant of the peony used for the base background to ensure the UI feels airy and spacious.
- **Accent Pink (#f472b6):** Used sparingly for interactive states, highlights, and specialized data visualizations to draw the eye toward key achievements.
- **Text & UI Neutral (#334155):** Used for secondary body text and supporting UI elements to ensure high contrast and readability against pastel backgrounds.

## Typography

This system exclusively uses **Geist**, a typeface designed for developers. It provides a technical, mono-inspired geometric aesthetic while maintaining excellent readability for long-form project descriptions.

- **Headlines:** Set in Deep Indigo with tight letter-spacing for a modern, impactful look.
- **Body:** Prioritize generous line height (1.6) to keep technical content digestible.
- **Specialized Labels:** Use `label-caps` for section headers and category tags to reinforce the organized, methodical nature of the work.
- **Code Accents:** Use `code-sm` for inline technical references, API endpoints, or logic snippets, often paired with a subtle Indigo background or Peony border.

## Layout & Spacing

The layout is governed by a **Strict Modular Grid**. Everything is aligned to a base 4px unit to ensure visual mathematical precision.

- **Grid:** A 12-column desktop grid with 24px gutters. Content should "snap" to these lines, often using thin Indigo rules (0.5px - 1px) to separate sections, mimicking a blueprint or terminal interface.
- **Margins:** Large horizontal margins (`xl`) on desktop to center the portfolio and provide a focused reading experience. 
- **Mobile Adaptivity:** On mobile, the grid collapses to 4 columns. Spacing scales down (e.g., `xl` becomes `lg`) to maximize screen real estate while maintaining the signature padding.
- **Logical Grouping:** Related backend services or project tech-stacks should be grouped in cards that use `sm` padding internally to create a compact, efficient feel.

## Elevation & Depth

To maintain a clean, technical aesthetic, this design system avoids traditional heavy shadows. Instead, it uses **Tonal Layering and Low-Contrast Outlines**.

- **Surfaces:** Depth is created by placing `surface_subtle` (Peony) containers on top of the `background_main`. 
- **Outlines:** Use 1px Deep Indigo borders with 10-20% opacity for most containers. This provides a clear structural definition without the visual "weight" of a solid line.
- **Interactive Depth:** When an element (like a project card) is hovered, transition the border opacity from 20% to 100% or add a very soft, tinted shadow (Indigo #1e2a5e at 5% opacity, 12px blur) to suggest a slight lift.
- **Backdrop Blurs:** For navigation bars or overlays, use a semi-transparent Peony background with a subtle blur (8px) to maintain context of the underlying grid.

## Shapes

The shape language is **Softly Structured**. While the layout is rigid and grid-based, the corners are slightly rounded to align with the "Peony" side of the brand and make the UI feel modern and approachable.

- **Small Components:** Buttons, input fields, and tags use `0.25rem` (4px) corner radius.
- **Large Components:** Project cards and main content containers use `rounded-lg` (0.5rem / 8px).
- **Accents:** Occasional use of full pill shapes (rounded-full) for status indicators (e.g., "Active", "Stable") to differentiate them from functional buttons.

## Components

- **Buttons:** 
  - *Primary:* Solid Deep Indigo background with Peony text. Square-ish (4px radius) for a professional feel.
  - *Secondary:* Peony background with Deep Indigo border and text.
- **Project Cards:** Large containers with a 1px Indigo border (low opacity). Use a Peony "wash" for the header section of the card to separate the title from the project description.
- **Tech Chips:** Small, monospaced labels used to list languages and frameworks (e.g., Go, Python, AWS). Use a light Peony fill with an Accent Pink dot next to the text.
- **Input Fields:** Minimalist design with only a bottom border in Deep Indigo. When focused, a soft Peony background fill slides in.
- **Data Visualizations:** Use the Indigo-to-Peony gradient for charts. Logic flows or architecture diagrams should use "Code-line" style: thin Indigo lines with Peony circular nodes.
- **Status Indicators:** Use a blinking dot animation for "Live" systems—a small nod to terminal interfaces—set in the Accent Pink color.