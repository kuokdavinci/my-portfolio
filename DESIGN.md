---
name: Celestial Glass
colors:
  surface: '#101415'
  surface-dim: '#101415'
  surface-bright: '#363a3b'
  surface-container-lowest: '#0b0f10'
  surface-container-low: '#191c1e'
  surface-container: '#1d2022'
  surface-container-high: '#272a2c'
  surface-container-highest: '#323537'
  on-surface: '#e0e3e5'
  on-surface-variant: '#cac4d4'
  inverse-surface: '#e0e3e5'
  inverse-on-surface: '#2d3133'
  outline: '#948e9d'
  outline-variant: '#787382'
  surface-tint: '#cebdff'
  primary: '#cebdff'
  on-primary: '#381385'
  primary-container: '#a78bfa'
  on-primary-container: '#3c1989'
  inverse-primary: '#674bb5'
  secondary: '#a4c9ff'
  on-secondary: '#00315d'
  secondary-container: '#0267b8'
  on-secondary-container: '#d6e5ff'
  tertiary: '#c4c1fb'
  on-tertiary: '#2d2a5b'
  tertiary-container: '#9a97cf'
  on-tertiary-container: '#312e5f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e8ddff'
  primary-fixed-dim: '#cebdff'
  on-primary-fixed: '#21005e'
  on-primary-fixed-variant: '#4f319c'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#a4c9ff'
  on-secondary-fixed: '#001c39'
  on-secondary-fixed-variant: '#004883'
  tertiary-fixed: '#e3dfff'
  tertiary-fixed-dim: '#c4c1fb'
  on-tertiary-fixed: '#181445'
  on-tertiary-fixed-variant: '#444173'
  background: '#101415'
  on-background: '#e0e3e5'
  surface-variant: '#323537'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
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
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 24px
  gutter: 16px
  section-gap: 80px
---

## Brand & Style
The design system is built on a "Celestial Glass" aesthetic—a sophisticated blend of high-tech futurism and serene, cosmic depth. It targets technical professionals and modern brands who value clarity amidst complexity. 

The visual language combines **Glassmorphism** with **Modern Corporate** reliability. Key characteristics include semi-transparent surfaces that mimic frosted glass, vibrant accent glows that suggest energy and "activity," and a meticulous focus on information hierarchy. The emotional response is one of "focused intelligence"—the interface feels like a high-end digital cockpit that is both powerful and approachable.

## Colors
The palette is rooted in deep space. The primary background uses a rich, dark indigo/navy to provide maximum contrast for glowing elements.

- **Primary (Electric Lavender):** Used for primary actions, headlines, and key highlights. It provides a warm, human touch to the technical backdrop.
- **Secondary (Atmospheric Blue):** Used for supporting accents, secondary buttons, and icons, creating a cool, calm balance.
- **Tertiary (Cosmic Lavender):** A soft, secondary accent used for highlights, tags, and supportive branding elements.
- **Surface & Containers (Deep Midnight):** The foundational dark space surfaces (`#101415`) used to anchor cards and content layers.
- **Neutral (Starlight White):** High-legibility text and borders, often used with varying opacities to maintain the glass effect.

The default state is **Dark Mode**, which best preserves the vibrant luminosity of the accent colors.

## Typography
The typography system uses a tiered approach to balance personality with readability. 

**Plus Jakarta Sans** provides a friendly yet geometric feel for headers, while **Inter** ensures long-form content remains highly legible. For technical metadata and labels, **JetBrains Mono** is used to reinforce the "developer-centric" or "high-tech" narrative. 

Hierarchies are reinforced through weight and color. Primary headlines often utilize a subtle gradient from the primary to secondary color to enhance the "glowing" effect.

## Layout & Spacing
The layout follows a **fluid grid** model with a maximum content width of 1280px for desktop. 

- **Desktop (1024px+):** 12-column grid, 24px gutters, 64px side margins.
- **Tablet (768px - 1023px):** 8-column grid, 16px gutters, 32px side margins.
- **Mobile (<767px):** 4-column grid, 16px gutters, 16px side margins.

Vertical rhythm is strictly maintained using multiples of 8px. Large sections are separated by significant "breathing room" (80px+) to allow the glass containers to stand out against the background.

## Elevation & Depth
Depth is created through **Glassmorphism** and **Backdrop Blurs** rather than traditional drop shadows. To maintain rendering performance, backdrop blurs are restricted to main cards and navigation layers.

1.  **Base Layer:** The deepest background, often a dark indigo gradient or a subtle star-field texture.
2.  **Surface Layer:** Semi-transparent containers (Background: `rgba(16, 20, 21, 0.75)` for legibility) with a `blur(12px)` and a subtle 1px white border at 15% opacity to ensure contrast.
3.  **Accent Layer:** Components that need to pop (like the "Available for Work" badge) use a high-opacity background with a clean border highlight.
4.  **Floating Elements:** Interactive elements use clean, shadow-based translation lifts without excessive neon glows.

## Shapes
The shape language is consistently rounded to soften the technical edge and make the UI feel approachable.

Standard components (buttons, input fields) use **0.75rem (12px)** corner radii. Larger containers like cards use **1rem (16px)** to create a unified and balanced geometry across all element scales. Interactive elements like chips should feel consistent, maintaining a clean, organic feel.

## Components
- **Glass Cards:** The primary container. Must have a backdrop-filter, a subtle 1px border (`outline-variant`), and a slight top-to-bottom gradient. Opacity is kept at 75% minimum to guarantee text legibility.
- **Primary Buttons:** High-contrast backgrounds (Electric Lavender) with dark text (`on-primary`). Use standard translation scale lifts instead of glows on hover.
- **Ghost Buttons:** Transparent background with a 1px border and primary-colored text. 
- **Tech Chips:** Small, pill-shaped badges used for skills or categories. Use a dark, flat semi-transparent background without backdrop blur to optimize rendering performance.
- **Input Fields:** Dark, semi-transparent backgrounds with a focus state that activates a clear border color transition.
- **Progress Indicators:** Use vibrant gradients (Primary to Secondary) to represent completion or activity.
- **Navigation:** A sticky top bar with a heavy backdrop-blur (20px+) and a solid fallback background color to maintain legibility as users scroll.