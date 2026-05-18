---
name: Indigo & Peony
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#45464f'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#767680'
  outline-variant: '#c6c5d1'
  surface-tint: '#505b92'
  primary: '#061449'
  on-primary: '#ffffff'
  primary-container: '#1e2a5e'
  on-primary-container: '#8793cd'
  inverse-primary: '#b9c3ff'
  secondary: '#70585b'
  on-secondary: '#ffffff'
  secondary-container: '#f8d8db'
  on-secondary-container: '#755d5f'
  tertiary: '#001548'
  on-tertiary: '#ffffff'
  tertiary-container: '#142a64'
  on-tertiary-container: '#8093d3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b9c3ff'
  on-primary-fixed: '#08164b'
  on-primary-fixed-variant: '#384378'
  secondary-fixed: '#fbdbde'
  secondary-fixed-dim: '#debfc2'
  on-secondary-fixed: '#281719'
  on-secondary-fixed-variant: '#574144'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c4ff'
  on-tertiary-fixed: '#00174c'
  on-tertiary-fixed-variant: '#30447e'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
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
    lineHeight: '1.6'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  section-gap: 128px
---

## Brand & Style
This design system is crafted for a creative professional who balances rigorous expertise with artistic flair. The aesthetic is rooted in **Minimalism** with **Modern Corporate** influences, prioritizing clarity and intentionality. 

The brand personality is authoritative yet approachable—a "sophisticated creative." It utilizes generous whitespace to allow work samples to breathe, while employing a playful high-contrast palette to keep the interface from feeling clinical. The emotional response should be one of calm confidence, reliability, and refined taste.

## Colors
The palette centers on the tension between the deep, intellectual weight of **Indigo Blue** and the ethereal lightness of **Pastel Pink**. 

- **Primary (Indigo Blue):** Used for primary headings, navigation links, and high-emphasis buttons to anchor the design in professionalism.
- **Secondary (Pastel Pink):** Used for large decorative elements, hover states, and "joyful" accents like chips or underlines.
- **Tertiary (Muted Indigo):** A bridge color for secondary text or borders, softening the transition between high-contrast areas.
- **Neutrals:** Crisp whites and very light grays ensure the minimalism feels "clean" rather than "stark."

## Typography
The typographic hierarchy relies on a classic serif/sans-serif pairing. **Playfair Display** provides an editorial, premium feel for large headlines, evoking the quality of a high-end magazine. **Inter** handles all functional and long-form content, ensuring high legibility and a modern, systematic feel. 

Special attention is paid to tracking: Display headings use slight negative letter-spacing for a "tight" professional look, while small labels use increased tracking and uppercase styling to provide a structural, modern contrast.

## Layout & Spacing
This design system utilizes a **Fixed Grid** model on desktop (12 columns) and a fluid 4-column model on mobile. 

The spacing rhythm is intentionally "loose." Section gaps are generous (128px+) to prevent the portfolio from feeling cluttered. Small-scale spacing follows an 8px linear scale. Alignment is strictly left-heavy for text content, creating a strong vertical axis that guides the eye, while imagery is allowed to break the grid slightly for a more playful, dynamic feel.

## Elevation & Depth
Depth is created through **Ambient Shadows** and **Tonal Layers** rather than heavy gradients. 

Surfaces utilize a very soft, diffused shadow (15% opacity Indigo) to make "cards" appear to float slightly above the neutral background. To maintain the minimalist aesthetic, depth is often suggested through subtle color shifts—such as placing a Pastel Pink card on a slightly off-white background—rather than relying on heavy shadows alone. A "glass" effect may be used for the global navigation bar, utilizing a high-saturation backdrop blur to keep the indigo text legible over images.

## Shapes
The shape language is defined by **Rounded** corners (0.5rem base), which soften the high-contrast color palette and give the UI its "playful" touch. 

- **Cards:** Use `rounded-lg` (1rem) for a friendly, approachable container.
- **Images:** Use `rounded-xl` (1.5rem) to make visual work feel like polished objects.
- **Buttons:** Use a hybrid approach; standard buttons are rounded (0.5rem), while tags or status chips use pill-shapes (full radius) to distinguish them from actionable primary buttons.

## Components
- **Buttons:** Primary buttons are Solid Indigo with white text. Secondary buttons use a Pastel Pink background with Indigo text for a softer, playful call to action.
- **Cards:** Minimalist layout. Title in Playfair Display, category label in Inter (Uppercase). No borders; depth is strictly shadow-based.
- **Input Fields:** Bottom-border only or very light Indigo outlines. Focus states transition the border to Pastel Pink with a soft outer glow.
- **Chips/Tags:** Pill-shaped, using low-opacity Pastel Pink backgrounds with Indigo text for categorizing project types.
- **Portfolio Grid:** Alternating aspect ratios (e.g., 4:3 and 3:4) to create a rhythmic, gallery-like experience.
- **Navigation:** Simple text-based links in Indigo with a "thick" Pastel Pink underline that appears on hover.