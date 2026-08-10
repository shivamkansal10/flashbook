---
name: Kinetic Clarity
colors:
  surface: '#fdf8f8'
  surface-dim: '#ddd9d8'
  surface-bright: '#fdf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3f2'
  surface-container: '#f1edec'
  surface-container-high: '#ebe7e6'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#444748'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#9d4300'
  on-secondary: '#ffffff'
  secondary-container: '#fd761a'
  on-secondary-container: '#5c2400'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1d1b1a'
  on-tertiary-container: '#868381'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#e6e1df'
  tertiary-fixed-dim: '#cac6c3'
  on-tertiary-fixed: '#1d1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#fdf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: '0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  unit-xs: 4px
  unit-sm: 8px
  unit-md: 16px
  unit-lg: 24px
  unit-xl: 48px
---

## Brand & Style
The design system embodies a high-end SaaS-marketplace aesthetic defined by **Kinetic Minimalism**. It balances the stark precision of Swiss design with the approachable warmth of modern consumer tech. The interface should feel spacious, fast, and authoritative. 

The strategy relies on a high-contrast foundation (Black/White) punctuated by a singular, high-energy orange accent. This creates a clear hierarchy where the user's attention is directed toward specific calls to action and key data points. The emotional response is one of reliability, speed, and premium quality.

## Colors
The palette is intentionally restrained to maximize the impact of the accent color.

- **Foundational Neutrals:** Use #FAFAFA for page backgrounds to provide a soft contrast against #FFFFFF surface containers. 
- **Accent Logic:** The orange (#F97316) is a "precision tool." Use it for exactly one keyword in hero headlines, active states in icons, or notification pips. Never use it for large background surfaces.
- **Interactive:** Primary actions use the near-black (#111111) to ground the UI with a sense of permanence and strength.

## Typography
The system uses a dual-font approach. **Plus Jakarta Sans** provides a geometric, modern personality for headlines and branding, while **Inter** ensures maximum utility and legibility for body copy and data-heavy interfaces.

- **Headlines:** Use tight line-heights and negative letter-spacing for the largest scales to create a "locked-in" editorial feel.
- **Body:** Content should always use #6B7280 to reduce visual vibration against the white background, improving long-form readability.
- **Accent Keywords:** Within headlines, wrap specific words in the primary accent color and the same extra-bold weight as the surrounding text.

## Layout & Spacing
The layout uses a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

- **Horizontal Rhythm:** Generous side margins (64px) on desktop ensure the content feels premium and focused. 
- **Vertical Rhythm:** Use 8px increments. Components like buttons and inputs use 12px or 16px of vertical padding to maintain a "breathable" SaaS feel. 
- **Content Density:** Elements in the marketplace (cards) should use a 24px gutter to prevent the UI from feeling cluttered.

## Elevation & Depth
Depth is conveyed through a combination of **Tonal Layering** and **Soft Ambient Shadows**.

- **Level 0 (Background):** #FAFAFA. Used for the main canvas.
- **Level 1 (Surface):** #FFFFFF with a 1px solid border (#E5E7EB). Used for standard cards.
- **Level 2 (Floating):** #FFFFFF with a soft, diffused shadow (0px 10px 15px -3px rgba(0, 0, 0, 0.05)). Used for floating badges, dropdowns, and active cards.
- **Overlays:** Use a subtle background blur (8px) behind modals to maintain context while focusing the user's attention.

## Shapes
The design system utilizes a tiered rounding strategy to differentiate between structural elements and interactive elements.

- **Structural (Cards, Inputs, Modals):** Use `rounded-2xl` (1.5rem / 24px) to create a soft, friendly frame.
- **Interactive (Buttons, Chips, Badges):** Use `pill-shaped` (9999px) for all primary and secondary buttons to make them feel "touchable" and distinct from layout containers.
- **Iconography:** Use a consistent 2px stroke weight with rounded caps and joins to match the typography's softness.

## Components
Consistent implementation of these core components ensures the design system's integrity:

- **Buttons:** 
  - *Primary:* Pill-shaped, #111111 background, white text. No shadow.
  - *Secondary:* Pill-shaped, #FFFFFF background, #111111 1px border.
- **Inputs:** `rounded-xl` (12px), #E5E7EB border. On focus, use a 2px #111111 ring with no offset.
- **Cards:** White background, `rounded-2xl`, 1px #E5E7EB border, and the "Level 2" soft shadow.
- **Floating Info Badge:** A small `rounded-2xl` white card containing a 32px avatar or icon on the left, followed by a bold label and secondary subtext.
- **Status Chips:** Pill-shaped with a light gray background. Include a 6px circular dot using the functional status colors (Success, Error, etc.) next to the label.
- **Browser Mockup:** A specialized container for screenshots. `rounded-xl` with a thin top bar (#F3F4F6) and three 8px "traffic light" dots in neutral gray.