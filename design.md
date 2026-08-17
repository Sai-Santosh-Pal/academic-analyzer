# Design System Inspired by Notion

## 1. Visual Theme & Atmosphere

Notion's design system embodies a clean, minimalist aesthetic that prioritizes clarity and flexibility. The visual language combines calm, professional neutrals with vibrant accent colors that inject personality and energy into the interface. The system embraces generous whitespace, thoughtful typography, and subtle elevation to create a sense of openness and approachability. This is an AI-forward workspace design that feels both enterprise-grade and delightfully human—supported by playful character illustrations and a diverse color palette that celebrates individual expression. The overall mood is confident yet inviting, balancing productivity with creative possibility.

**Key Characteristics**
- Minimalist, spacious layouts with generous whitespace
- Bold, expressive color accents with muted neutral foundation
- Clean typography with strong hierarchical contrast
- Subtle shadows and elevation for spatial clarity
- Playful character illustrations and approachable visual language
- Flexible, component-driven architecture
- Professional yet personable tone
- Focus on clarity and actionable information

## 2. Color Palette & Roles

### Primary
- **Primary Blue** (`#097FE8`): Main call-to-action buttons, primary navigation elements, primary links, and key interactive states
- **Deep Blue** (`#0075DE`): Secondary primary actions, enhanced contrast contexts, emphasis in secondary CTAs

### Accent Colors
- **Purple** (`#9849E8`): Agent and feature highlights, AI-related interface elements, secondary emphasis
- **Teal** (`#27918D`): Tertiary accents, data visualization highlights, status indicators
- **Orange** (`#FF6D00`): High-energy accents, urgent highlights, vibrant feature callouts
- **Brown** (`#9C7054`): Warm secondary accent, character illustrations, warm brand touches
- **Amber** (`#FFC95E`): Soft highlights, subtle background accents, warm notices
- **Cream** (`#FFF5E0`): Soft background tint for warm contexts, light notification backgrounds

### Interactive
- **Primary CTA** (`#097FE8`): Button backgrounds for primary actions, active link states
- **Hover Overlay** (`#097FE8` at `0.42` opacity): Hover state overlays for interactive elements
- **Ghost Button Text** (`#000000` at `0.898` opacity): Text in transparent button variants

### Neutral Scale
- **Black** (`#000000`): Primary text, dominant interface text (779 uses across site)
- **Dark Gray** (`#31302E`): Secondary text, subheadings, de-emphasized content
- **Medium Gray** (`#78736F`): Tertiary text, helper text, muted labels
- **White** (`#FFFFFF`): Primary background, card backgrounds, clean surfaces

### Surface & Borders
- **Cream Background** (`#FCF8F5`): Warm subtle background tint
- **Light Cream** (`#FFF5ED`): Warmer secondary surface tint
- **Pale Pink** (`#FEF3F1`): Soft pink background tint for delicate contexts
- **Light Purple** (`#F8F5FC`): Subtle purple-tinted background surface
- **Border Gray** (`#000000` at `0.08` opacity): Input borders, subtle dividers, light separators

### Semantic / Status
- **Error / Danger** (`#F64932`): Error states, destructive actions, critical alerts
- **Warning** (`#FFB110`): Warning messages, cautionary states, pending actions

## 3. Typography Rules

### Font Family
**Primary Font:** NotionInter (with fallback stack: `NotionInter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`)

**Secondary Font:** System stack for code contexts: `'SF Mono', Monaco, 'Cascadia Code', Roboto Mono, Consolas, monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display / H1 | NotionInter | 96px | 600 | 100px | 0px | Maximum emphasis, hero sections, page title |
| Heading 1 / H2 | NotionInter | 54px | 700 | 56px | 0px | Section headers, major divisions |
| Heading 3 | NotionInter | 14px | 400 | 20px | 0px | Small section headers, card titles |
| Body Text | NotionInter | 20px | 400 | 28px | 0px | Primary content, paragraph text |
| Span / Label | NotionInter | 14px | 500 | 20px | 0px | Labels, badges, meta information |
| Link | NotionInter | 16px | 400 | 24px | 0px | Hyperlinks, navigation text |
| Button | NotionInter | 16px | 400 | 24px | 0px | Button labels, interactive text |
| Caption | NotionInter | 12px | 400 | 16px | 0px | Helper text, captions, small text |

### Principles
- Establish clear hierarchy through size and weight rather than color alone
- Use 20px as the baseline for body content; scale up for emphasis, down for secondary information
- Maintain consistent line-height ratios (1.2–1.4x font size) for readability
- Reserve weight 700 for primary headings only; use 600 for display, 400/500 for body and UI
- Link text should be underlined or otherwise differentiated from regular body text via color or styling
- Code and monospace contexts use system monospace font at 13–14px with 1.5 line-height

## 4. Component Stylings

### Buttons

#### Primary Button
- **Background:** `#097FE8`
- **Text Color:** `#FFFFFF`
- **Padding:** `11px 24px`
- **Border Radius:** `4px`
- **Border:** `0px solid transparent`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Line Height:** `24px`
- **Height:** `auto`
- **Hover State:** Background `#0075DE`, opacity `1.0`
- **Active State:** Background `#0075DE`
- **Disabled State:** Background `#000000` with opacity `0.08`, text opacity `0.4`

#### Secondary Button
- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `rgba(0, 0, 0, 0.898)`
- **Padding:** `5px 10px`
- **Border Radius:** `4px`
- **Border:** `1px solid rgba(0, 0, 0, 0.12)`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Line Height:** `24px`
- **Height:** `30px`
- **Hover State:** Background `rgba(0, 0, 0, 0.04)`, border `rgba(0, 0, 0, 0.15)`
- **Active State:** Background `rgba(0, 0, 0, 0.08)`

#### Ghost Button
- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `rgba(0, 0, 0, 0.95)`
- **Padding:** `4px 8px`
- **Border Radius:** `4px`
- **Border:** `0px solid transparent`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Line Height:** `24px`
- **Height:** `auto`
- **Hover State:** Background `rgba(0, 0, 0, 0.06)`
- **Active State:** Background `rgba(0, 0, 0, 0.12)`

#### Icon Button (Circular)
- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `rgba(0, 0, 0, 0.898)`
- **Padding:** `11px`
- **Border Radius:** `50%`
- **Border:** `0px solid transparent`
- **Font Size:** `16px`
- **Width:** `auto`
- **Height:** `auto`
- **Hover State:** Background `rgba(0, 0, 0, 0.06)`

### Cards & Containers

#### Standard Card
- **Background:** `#FFFFFF`
- **Border:** `0px solid transparent`
- **Border Radius:** `12px`
- **Padding:** `24px`
- **Box Shadow:** `rgba(0, 0, 0, 0.01) 0px 0.175px 1.041px 0px, rgba(0, 0, 0, 0.02) 0px 0.8px 2.925px 0px, rgba(0, 0, 0, 0.027) 0px 2.025px 7.847px 0px, rgba(0, 0, 0, 0.04) 0px 4px 18px 0px`
- **Text Color:** `rgba(0, 0, 0, 0.898)`
- **Font Size:** `16px`

#### Card Header
- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Border Radius:** `0px`
- **Padding:** `0px 0px 16px 0px`
- **Font Size:** `22px`
- **Font Weight:** `700`
- **Line Height:** `28px`
- **Text Color:** `#000000`
- **Border Bottom:** `1px solid rgba(0, 0, 0, 0.08)`

#### Card Section
- **Padding:** `16px 0px`
- **Border:** `0px`
- **Background:** `transparent`

### Inputs & Forms

#### Text Input
- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Border:** `1px solid rgba(0, 0, 0, 0.08)`
- **Border Radius:** `5px`
- **Padding:** `7px 10px 7px 30px`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Line Height:** `24px`
- **Text Color:** `rgba(0, 0, 0, 0.95)`
- **Height:** `auto` (min-height `36px`)
- **Focus State:** Border `#097FE8` at `1px solid`, box-shadow `0px 0px 0px 3px rgba(9, 127, 232, 0.1)`
- **Placeholder Color:** `rgba(0, 0, 0, 0.4)`
- **Disabled State:** Background `rgba(0, 0, 0, 0.04)`, border `rgba(0, 0, 0, 0.08)`, text opacity `0.4`

#### Input Label
- **Font Size:** `14px`
- **Font Weight:** `500`
- **Line Height:** `20px`
- **Text Color:** `rgba(0, 0, 0, 0.898)`
- **Margin Bottom:** `8px`

#### Input Helper Text
- **Font Size:** `12px`
- **Font Weight:** `400`
- **Line Height:** `16px`
- **Text Color:** `#78736F`
- **Margin Top:** `4px`

#### Input Error State
- **Border Color:** `#F64932`
- **Border Width:** `1px`
- **Helper Text Color:** `#F64932`

### Navigation

#### Top Navigation Bar
- **Background:** `#FFFFFF`
- **Border:** `0px none transparent`
- **Border Bottom:** `rgba(0, 0, 0, 0) 0px 1px 0px 0px` (subtle divider)
- **Height:** `64px`
- **Padding:** `0px 24px`
- **Box Shadow:** `rgba(0, 0, 0, 0) 0px 1px 0px 0px`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Line Height:** `24px`
- **Text Color:** `rgba(0, 0, 0, 0.898)`

#### Navigation Link (Hover)
- **Background:** `rgba(0, 0, 0, 0.04)`
- **Border Radius:** `4px`
- **Padding:** `8px 12px`
- **Text Color:** `rgba(0, 0, 0, 0.95)`

#### Navigation Link (Active)
- **Text Color:** `#097FE8`
- **Border Bottom:** `2px solid #097FE8`

### Badges

#### Status Badge (To-Do)
- **Background:** `#9849E8`
- **Text Color:** `#FFFFFF`
- **Padding:** `4px 12px`
- **Border Radius:** `12px`
- **Font Size:** `12px`
- **Font Weight:** `500`
- **Line Height:** `16px`

#### Status Badge (In Progress)
- **Background:** `#FFB110`
- **Text Color:** `#000000`
- **Padding:** `4px 12px`
- **Border Radius:** `12px`
- **Font Size:** `12px`
- **Font Weight:** `500`
- **Line Height:** `16px`

#### Status Badge (In Review)
- **Background:** `#097FE8`
- **Text Color:** `#FFFFFF`
- **Padding:** `4px 12px`
- **Border Radius:** `12px`
- **Font Size:** `12px`
- **Font Weight:** `500`
- **Line Height:** `16px`

#### Status Badge (Complete)
- **Background:** `#27918D`
- **Text Color:** `#FFFFFF`
- **Padding:** `4px 12px`
- **Border Radius:** `12px`
- **Font Size:** `12px`
- **Font Weight:** `500`
- **Line Height:** `16px`

## 5. Layout Principles

### Spacing System

The spacing system uses an 4px base unit with a modular scale. All spacing values should follow this progression to maintain consistency and visual rhythm.

- **4px:** Micro spacing, icon padding, tight adjacent elements
- **8px:** Compact spacing, small gaps between elements
- **12px:** Standard small spacing, label-to-input gaps
- **16px:** Standard spacing, padding in cards and sections, gaps between related groups
- **20px:** Medium spacing, gap between components
- **24px:** Comfortable spacing, card padding, section spacing
- **32px:** Large spacing, section dividers
- **36px:** Large gaps, major section breaks
- **60px:** Extra-large padding, hero section spacing
- **64px:** Major section gap, hero to content transition
- **80px:** Page-level margin, top/bottom spacing
- **96px:** Maximum padding, full-page section padding

**Usage Context:**
- Inputs and form elements: `12px` padding (top/bottom), `16px` padding (left/right)
- Cards: `24px` padding
- Sections: `64px` vertical gap, `96px` padding top/bottom on hero sections
- Components: `8px–16px` internal spacing

### Grid & Container

- **Max Width:** `1440px` for main content containers
- **Column Strategy:** 12-column flexible grid; responsive to viewport
- **Gutter:** `24px` horizontal gutter between columns
- **Section Pattern:** Full-width sections with `96px` vertical padding; content centered within `1440px` max-width

### Whitespace Philosophy

Notion's layout embraces breathing room. Whitespace is not empty space—it's intentional silence that improves focus and clarity. Sections are separated by substantial gaps (`64px`–`96px`) to allow visual rest between ideas. Internal component spacing is conservative (`16px`–`24px`) to maintain tightness within grouped content, while section-level spacing is generous to separate distinct conceptual blocks. This creates a rhythm: tight clusters, generous breaks, tight clusters again.

### Border Radius Scale

- **0px:** No radius; reserved for rectangular sections, full-width containers
- **4px:** Subtle rounding; buttons, small controls, secondary components
- **5px:** Input fields and form controls
- **8px:** Secondary cards, navigation items, dropdown menus
- **12px:** Primary cards, main content containers
- **50%:** Fully circular buttons, avatars, icon-only controls
- **9999px:** Pill-shaped elements, rounded-end buttons

### Border Widths

- **Thin (1px):** Default for inputs, subtle dividers, secondary borders
- **Standard:** Not explicitly used in system; all primary borders default to `1px`

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (No Elevation) | No shadow; `box-shadow: none` | Standard backgrounds, cards on white, base containers |
| Subtle (sm) | `rgba(0, 0, 0, 0.01) 0px 0.175px 1.041px 0px, rgba(0, 0, 0, 0.02) 0px 0.8px 2.925px 0px, rgba(0, 0, 0, 0.027) 0px 2.025px 7.847px 0px, rgba(0, 0, 0, 0.04) 0px 4px 18px 0px` | Dropdown menus, floating panels, subtle lift |
| Minimal (md) | `rgba(0, 0, 0, 0) 0px 1px 0px 0px` | Navigation bars, dividers, horizontal separators |
| Overlay | `rgba(0, 0, 0, 0.15) 0px 8px 24px 0px` | Modals, overlays, maximum prominence |

**Shadow Philosophy:**
Notion uses restrained shadows that suggest depth without creating visual noise. The subtle elevation system relies on layering and proximity rather than dramatic shadow casting. Shadows are reserved for elements that float above the baseline (dropdowns, modals, tooltips) or require clear separation from content. Most UI elements live at the same elevation, maintaining visual clarity.

### Opacity Levels

- **Full Opacity (1.0 or 100%):** Default state for all visible elements
- **Strong (0.80 or 80%):** Hover states, emphasis overlays
- **Medium (0.42 or 42%):** Overlay tints, interactive background overlays
- **Subtle (0.08 or 8%):** Border colors, dividers, very light tints
- **Disabled (0.4 or 40%):** Disabled text and interactive elements
- **Ghost (0.0 or 0%):** Transparent backgrounds for ghost components

### Z-index / Layering

- **Base (z-index: 1):** Standard card and component layer
- **Elevated (z-index: 2):** Slightly raised components, hovered cards
- **Floating (z-index: 3):** Dropdowns, popovers, floating toolbars
- **Modal (z-index: 4):** Modal overlays, dialog boxes
- **Sticky (z-index: 100):** Fixed headers, sticky navigation, always-on-top elements
- **Toast (z-index: 1000):** Toast notifications, temporary alerts (highest priority)

## 7. Do's and Don'ts

### Do
- Use the primary blue (`#097FE8`) for all primary call-to-action buttons and main interactive states
- Maintain consistent padding of `24px` inside cards and `16px` for internal sections
- Apply the subtle shadow (`sm` elevation) to floating elements like dropdowns and modals
- Keep typography sizes aligned to the established hierarchy; scale from base sizes, never arbitrary
- Use generous whitespace between sections (`64px`–`96px`) to create visual breathing room
- Implement focus states on all interactive elements with a `3px` colored ring (primary color at `0.1` opacity)
- Use the semantic error (`#F64932`) and warning (`#FFB110`) colors for status indicators
- Follow the 4px spacing grid for all padding, margins, and gaps
- Reserve weight 700 for headings; use 400–600 for all body and UI text
- Test color contrast ratios to ensure WCAG AA compliance on all text

### Don't
- Use shadows heavier than the `sm` level on standard UI; reserve heavy shadows for modals only
- Override established border-radius values; use only the defined scale (`0px`, `4px`, `5px`, `8px`, `12px`, `50%`, `9999px`)
- Mix font families; NotionInter is the only typeface used across all UI (system stack for fallback)
- Create custom colors outside the defined palette; use semantic colors for specific states
- Reduce padding below `8px` for user-facing content; maintain touch target minimums
- Use placeholder text as a substitute for labels; always include a visible, semantic label
- Apply opacity to text colors directly; use the opacity scale for consistent visibility
- Left-align body text at sizes below `14px`; use center alignment only for headings and special contexts
- Exceed `1440px` max-width for standard content; reserve full-width only for hero sections and special layouts

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | 360px–599px | Single column, full-width cards, 12px padding left/right, 16px padding top/bottom, stacked navigation, 48px min touch target |
| Tablet | 600px–1023px | 2-column grid, 20px horizontal padding, 24px section spacing, collapsible sections, 44px touch target |
| Desktop | 1024px+ | 3-column grid, 24px padding, full 12-column grid layout, sticky navigation, 40px touch target |
| Large Desktop | 1440px+ | Full layout with max-width container, sidebar navigation, 24px gutter |

### Touch Targets

- **Minimum Target Size:** `44px × 44px` for all touch-interactive elements (buttons, links, inputs)
- **Recommended Spacing:** `8px` minimum between adjacent touch targets
- **Icon Button:** `48px × 48px` minimum on mobile, `40px × 40px` on desktop
- **Text Links:** Increase padding to `8px × 4px` to meet minimum touch target when link text alone is insufficient
- **Form Fields:** Minimum height `44px` on mobile, `36px` on desktop

### Collapsing Strategy

- **Navigation:** Top nav collapses to hamburger menu at `< 768px`; drawer opens from left, overlay background `rgba(0, 0, 0, 0.4)` at z-index `99`
- **Cards:** At mobile, reduce from 3 columns to 1 column, maintain `24px` padding
- **Sections:** Stack vertically below tablet breakpoint; remove horizontal gaps
- **Sidebar:** Hide sidebar completely below `1024px` or collapse to icon-only at `600px`–`1023px`
- **Typography:** Reduce display heading from `96px` to `54px` on tablet, `36px` on mobile; maintain line-height ratios
- **Padding:** Reduce section padding from `96px` to `64px` on tablet, `32px` on mobile
- **Grid Columns:** 12 columns on desktop, 8 columns on tablet, 4 columns on mobile; adjust gutter from `24px` to `16px` to `12px`

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA:** Primary Blue (`#097FE8`)
- **Secondary CTA:** Deep Blue (`#0075DE`)
- **Accent (Purple):** `#9849E8` — Agent/AI features
- **Accent (Teal):** `#27918D` — Complete/success states
- **Accent (Orange):** `#FF6D00` — Urgent/high-energy highlights
- **Error/Danger:** `#F64932` — Error states, destructive actions
- **Warning:** `#FFB110` — Warning messages, caution states
- **Body Text:** `#000000`
- **Secondary Text:** `#31302E`
- **Tertiary Text:** `#78736F`
- **Background:** `#FFFFFF`
- **Surface Tints:** `#FCF8F5`, `#FFF5ED`, `#FEF3F1`, `#F8F5FC`
- **Border/Divider:** `rgba(0, 0, 0, 0.08)`

### Iteration Guide

1. **Color:** Use `#097FE8` as the primary interactive color for buttons, links, and focus states. Apply semantic reds/oranges (`#F64932`, `#FFB110`) strictly for error and warning contexts. All text defaults to `#000000` at full opacity; secondary text uses `#31302E` or `#78736F`.

2. **Typography:** All text uses NotionInter font. Body content defaults to `20px` regular weight with `28px` line-height. Headings scale: H1 `96px`/600 weight, H2 `54px`/700, labels `14px`/500. Never use weights outside 400–700 range.

3. **Spacing:** Base unit is `4px`. Most component padding is `16px` (inputs, sections) or `24px` (cards). Section gaps are `64px` vertical. Follow the spacing scale exactly; do not introduce custom values.

4. **Border Radius:** Apply `4px` to buttons, `5px` to inputs, `8px` to navigation items and secondary cards, `12px` to primary cards. Use `50%` for circular buttons and avatars, `9999px` for pill shapes. Never exceed this list.

5. **Elevation:** Use the `sm` shadow for floating elements (dropdowns, modals); use no shadow for standard cards. The `md` shadow is reserved for subtle dividers in navigation. Modals receive `rgba(0, 0, 0, 0.15) 0px 8px 24px 0px`.

6. **Responsive:** At `< 768px`, collapse to single column, hamburger menu, and increase touch targets to `48px`. Typography scales down: H1 becomes `36px`, body text `16px`. Section padding reduces to `32px`.

7. **Focus & Accessibility:** All interactive elements must have a visible focus state: a `3px` ring using primary color at `0.1` opacity. Disabled elements use `rgba(0, 0, 0, 0.08)` background with `0.4` text opacity. Maintain WCAG AA contrast on all text.

8. **Components:** Buttons come in primary (blue background, white text), secondary (transparent, dark border), and ghost (transparent, no border) variants. Cards use white background with `12px` border-radius, `24px` padding, and subtle `sm` shadow. Inputs use `1px` light border, `5px` border-radius, and focus ring on interaction.

9. **Z-index Stack:** Use z-index: `1` for standard components, `2` for elevated, `3` for floating (dropdowns), `4` for modals, `100` for sticky headers, `1000` for toasts. Never invent z-index values outside this range.
