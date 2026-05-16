# DESIGN.md — Berijalan Employee Loyalty Portal

> Design System Reference for AI Vibecoders and Human Engineers  
> Version 2.0 · May 2026 · Modern Clean Professional · Bento Card System

---

## Table of Contents

1. [Design Direction](#1-design-direction)
2. [Color System — The Midnight Arctic](#2-color-system--the-midnight-arctic)
3. [Typography](#3-typography)
4. [Layout Foundation](#4-layout-foundation)
5. [Bento Grid System](#5-bento-grid-system)
6. [Component Library](#6-component-library)
7. [Micro-Interactions & Motion](#7-micro-interactions--motion)
8. [Responsive Web App Rules](#8-responsive-web-app-rules)
9. [Skeleton Screens](#9-skeleton-screens)
10. [Navigation & Breadcrumbs](#10-navigation--breadcrumbs)
11. [Accessibility Standards](#11-accessibility-standards)
12. [Dark Mode Architecture](#12-dark-mode-architecture)
13. [Implementation Tokens](#13-implementation-tokens)
14. [Tailwind Config Extension](#14-tailwind-config-extension)
15. [AI Vibecoder Prompt Patterns](#15-ai-vibecoder-prompt-patterns)
16. [Quick Reference Cheat Sheet](#16-quick-reference-cheat-sheet)

---

## 1. Design Direction

### Core Theme: **Functional Elegance — Modern Clean Bento**

Berijalan Employee Loyalty Portal is an operational dashboard. The interface must feel calm, premium, trustworthy, and fast. The visual direction moves away from heavy glassmorphism and decorative dark gradients into a cleaner professional product language:

- **Light-first canvas** with strong hierarchy and generous negative space.
- **Bento cards** for dense operational information that remains scannable.
- **Electric Indigo** for primary actions and brand moments.
- **Cyan Glow** only for small active/hover highlights, never large surfaces.
- **Dark slate text** for professional credibility and high readability.
- **Motion that feels tactile**, not flashy.

### The One Thing Users Should Remember

> “My token balance, tier status, and redemption eligibility are instantly clear inside clean bento cards.”

### Guiding Principles

| Principle | Implementation |
| --- | --- |
| **Clarity first** | Key numbers are large, labels are short, and supporting copy is muted. |
| **Bento hierarchy** | Card size reflects importance: balance and eligibility get larger cards. |
| **Accessible polish** | Minimum contrast targets, visible focus rings, 48px touch targets. |
| **Quiet confidence** | No heavy neon, no excessive glow, no over-animated UI. |
| **Professional rhythm** | Spacing follows an 8px scale; border radius and shadows are consistent. |

---

## 2. Color System — The Midnight Arctic

This palette combines the professionalism of dark slate with the freshness of electric indigo and cyan. It is designed for SaaS dashboards, corporate portals, and modern internal tools.

### Brand Palette

| Token | Name | Hex | Usage |
| --- | --- | --- | --- |
| `--color-primary` | Electric Indigo | `#4F46E5` | CTA, active navigation, brand identity |
| `--color-primary-hover` | Indigo Pulse | `#4338CA` | CTA hover and pressed action |
| `--color-secondary` | Arctic Frost | `#F8FAFC` | Main app background |
| `--color-accent` | Cyan Glow | `#06B6D4` | Hover accent, info highlight, decorative micro-line |
| `--color-text-primary` | Ink Deep | `#0F172A` | Headings, key labels, primary text |
| `--color-text-secondary` | Slate Mist | `#64748B` | Body copy, descriptions, icons |
| `--color-surface` | Pure White | `#FFFFFF` | Cards, modals, navigation |
| `--color-border` | Frost Border | `#E2E8F0` | Dividers and card borders |

### Semantic Colors

| Token | Hex | Usage |
| --- | --- | --- |
| `--color-success` | `#16A34A` | Approved, completed, eligible |
| `--color-warning` | `#D97706` | Pending, attention needed |
| `--color-error` | `#DC2626` | Rejected, destructive action |
| `--color-info` | `#0284C7` | Informational states |

### Core CSS Variables

```css
:root {
  /* Canvas */
  --color-bg: #f8fafc;
  --color-bg-subtle: #f1f5f9;
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;
  --color-surface-muted: #f8fafc;

  /* Text */
  --color-text-primary: #0f172a;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;
  --color-text-disabled: #cbd5e1;
  --color-text-inverse: #ffffff;

  /* Brand */
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-primary-pressed: #3730a3;
  --color-primary-soft: rgba(79, 70, 229, 0.10);
  --color-primary-ring: rgba(79, 70, 229, 0.22);

  /* Accent */
  --color-accent: #06b6d4;
  --color-accent-hover: #0891b2;
  --color-accent-soft: rgba(6, 182, 212, 0.10);
  --color-accent-ring: rgba(6, 182, 212, 0.22);

  /* Semantic */
  --color-success: #16a34a;
  --color-success-soft: rgba(22, 163, 74, 0.10);
  --color-warning: #d97706;
  --color-warning-soft: rgba(217, 119, 6, 0.12);
  --color-error: #dc2626;
  --color-error-soft: rgba(220, 38, 38, 0.10);
  --color-info: #0284c7;
  --color-info-soft: rgba(2, 132, 199, 0.10);

  /* Borders */
  --color-border: #e2e8f0;
  --color-border-subtle: #edf2f7;
  --color-border-strong: #cbd5e1;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 4px 12px rgba(15, 23, 42, 0.06);
  --shadow-md: 0 10px 24px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 18px 48px rgba(15, 23, 42, 0.10);
}
```

### Page Background

Use a subtle arctic gradient on the root layout only. Do not repeat it inside cards.

```css
body {
  color: var(--color-text-secondary);
  background:
    radial-gradient(circle at 10% 0%, rgba(79, 70, 229, 0.08), transparent 28rem),
    radial-gradient(circle at 95% 10%, rgba(6, 182, 212, 0.10), transparent 26rem),
    linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  background-attachment: fixed;
}
```

### Color Rules

- Use `--color-bg` for the main canvas.
- Use `--color-surface` for cards, navigation, drawers, and modals.
- Use `--color-primary` for the most important action only.
- Use `--color-accent` for hover lines, active chips, chart highlights, and small decorative details.
- Use semantic soft backgrounds for alerts instead of saturated blocks.
- Never use cyan and indigo at full saturation in the same large surface.
- Avoid pure black text. Use `Ink Deep` for a softer professional look.

---

## 3. Typography

### Font Stack

Use a variable font stack for performance and flexibility.

```css
:root {
  --font-display: "Plus Jakarta Sans", "Inter Tight", system-ui, sans-serif;
  --font-body: "Plus Jakarta Sans", Inter, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
}
```

### Fluid Type Scale

Use `clamp()` for responsive typography. This avoids hard jumps between breakpoints and keeps headings balanced across screens.

```css
:root {
  --text-xs: clamp(0.75rem, 0.72rem + 0.10vw, 0.8125rem);
  --text-sm: clamp(0.875rem, 0.84rem + 0.12vw, 0.9375rem);
  --text-base: clamp(1rem, 0.95rem + 0.18vw, 1.0625rem);
  --text-lg: clamp(1.125rem, 1.04rem + 0.28vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.12rem + 0.42vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.28rem + 0.78vw, 2rem);
  --text-3xl: clamp(1.875rem, 1.48rem + 1.35vw, 2.75rem);
  --text-4xl: clamp(2.25rem, 1.65rem + 2vw, 4.5rem);
}
```

### Typography Classes

```css
.text-hero {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  line-height: 0.98;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--color-text-primary);
}

.text-section-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--color-text-primary);
}

.text-card-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: var(--color-text-primary);
}

.text-body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.65;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.text-label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.text-metric {
  font-family: var(--font-mono);
  font-size: clamp(2rem, 1.5rem + 2vw, 4rem);
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.05em;
  color: var(--color-text-primary);
}
```

### Type Rules

- H1 should be large but not decorative.
- Body text line-height should stay between `1.55` and `1.7`.
- Metric numbers use mono for alignment and data confidence.
- Labels are uppercase only when short: max 2–3 words.
- Avoid more than two font families in actual UI rendering.

---

## 4. Layout Foundation

### Spacing Scale

All layout values must use multiples of 8px.

| Token | Value | Usage |
| --- | ---: | --- |
| `--space-1` | 4px | Micro gap, icon offset |
| `--space-2` | 8px | Small chip padding |
| `--space-3` | 12px | Button inner gap |
| `--space-4` | 16px | Mobile card padding |
| `--space-6` | 24px | Desktop card padding |
| `--space-8` | 32px | Bento grid gap / section padding |
| `--space-12` | 48px | Page section gap |
| `--space-16` | 64px | Large page spacing |

### Radius

```css
:root {
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}
```

Rules:

- Cards: `16px`
- Modals / drawers: `24px`
- Buttons / inputs: `12px`
- Chips / badges: `9999px`
- Avoid ultra-rounded cards unless the component is intentionally playful.

### Border & Shadow

```css
.card-border {
  border: 1px solid var(--color-border);
}

.card-shadow {
  box-shadow: var(--shadow-sm);
}

.card-shadow-hover {
  box-shadow: var(--shadow-md);
}
```

Use shadows only for elevated or interactive surfaces. Static cards can rely on border and background.

---

## 5. Bento Grid System

### Grid Philosophy

A bento grid is not a generic card wall. It is a hierarchy system. Important information receives larger cards and stronger placement.

### Base Grid

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: clamp(1rem, 1.5vw, 2rem);
  container-type: inline-size;
}

.bento-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 94%, white 6%);
  box-shadow: var(--shadow-xs);
  transition:
    transform 220ms var(--ease-smooth),
    border-color 220ms var(--ease-smooth),
    box-shadow 220ms var(--ease-smooth),
    background 220ms var(--ease-smooth);
}

.bento-card[data-interactive="true"] {
  cursor: pointer;
}

.bento-card[data-interactive="true"]:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--color-primary) 32%, var(--color-border));
  box-shadow: var(--shadow-md);
}

.bento-card[data-featured="true"]::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
}
```

### Bento Size Utilities

```css
.bento-span-12 { grid-column: span 12; }
.bento-span-8 { grid-column: span 8; }
.bento-span-6 { grid-column: span 6; }
.bento-span-4 { grid-column: span 4; }
.bento-span-3 { grid-column: span 3; }
.bento-row-2 { grid-row: span 2; }

@media (max-width: 1023px) {
  .bento-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .bento-span-8,
  .bento-span-6,
  .bento-span-4,
  .bento-span-3 { grid-column: span 6; }
}

@media (max-width: 639px) {
  .bento-grid { grid-template-columns: 1fr; }
  .bento-span-12,
  .bento-span-8,
  .bento-span-6,
  .bento-span-4,
  .bento-span-3 { grid-column: 1 / -1; }
}
```

### Employee Dashboard Blueprint

```text
┌──────────────────────────────────────────────────────────────┐
│ col-12 · Welcome Banner + Current Period                      │
├──────────────────────┬──────────────────────┬────────────────┤
│ col-4 · Total Tokens │ col-4 · Current Tier │ col-4 · Redeem? │
│ large metric         │ badge + progress     │ CTA + reason    │
├──────────────────────┴──────────────────────┬────────────────┤
│ col-8 · Token History Chart                  │ col-4 row-2    │
│ monthly trend + delta                         │ Reward Preview │
├──────────────────────────────────────────────┤ quick catalog   │
│ col-8 · Tier Progress                         │                │
│ milestones + next requirement                 │                │
└──────────────────────────────────────────────┴────────────────┘
```

### Admin Dashboard Blueprint

```text
┌───────────────────────────────────────────────────────────────┐
│ col-12 · Active Period Status + Snapshot                       │
├───────────────┬───────────────┬───────────────┬───────────────┤
│ col-3 Uploads │ col-3 Pending │ col-3 Active  │ col-3 Tokens  │
├───────────────┴───────────────┴───────────────┬───────────────┤
│ col-8 · Recent Upload Activity Table           │ col-4 Actions │
├────────────────────────────────────────────────┴───────────────┤
│ col-12 · Redemption Queue                                      │
└────────────────────────────────────────────────────────────────┘
```

### Bento Card Anatomy

```text
┌───────────────────────────────────────┐
│ [Icon] Label                    [···] │
│                                       │
│ Main metric / title                   │
│ Supporting explanation                │
│                                       │
│ ───────────────────────────────────── │
│ Footer insight, progress, or CTA      │
└───────────────────────────────────────┘
```

---

## 6. Component Library

### Primary Button

```css
.btn-primary {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 0;
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  font: 700 var(--text-sm) / 1 var(--font-body);
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.18);
  transition:
    transform 180ms var(--ease-smooth),
    background 180ms var(--ease-smooth),
    box-shadow 180ms var(--ease-smooth);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(79, 70, 229, 0.24);
}

.btn-primary:active {
  transform: scale(0.97);
  background: var(--color-primary-pressed);
}

.btn-primary:disabled {
  opacity: 0.48;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

### Secondary Button

```css
.btn-secondary {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  padding: 0.75rem 1rem;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font: 700 var(--text-sm) / 1 var(--font-body);
  box-shadow: var(--shadow-xs);
  transition:
    transform 180ms var(--ease-smooth),
    border-color 180ms var(--ease-smooth),
    background 180ms var(--ease-smooth),
    box-shadow 180ms var(--ease-smooth);
}

.btn-secondary:hover {
  transform: translateY(-1px);
  border-color: var(--color-border-strong);
  background: var(--color-surface-muted);
  box-shadow: var(--shadow-sm);
}
```

### Metric Card

```tsx
interface MetricCardProps {
  label: string;
  value: string;
  description?: string;
  trend?: string;
  featured?: boolean;
}

export function MetricCard({ label, value, description, trend, featured }: MetricCardProps) {
  return (
    <section
      className="bento-card p-6"
      data-featured={featured ? "true" : undefined}
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-label">{label}</p>
        {trend ? <span className="status-chip status-chip--success">{trend}</span> : null}
      </div>
      <p className="text-metric mt-6">{value}</p>
      {description ? <p className="text-body mt-3 max-w-prose">{description}</p> : null}
    </section>
  );
}
```

### Status Chip

```css
.status-chip {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  gap: 0.375rem;
  border-radius: var(--radius-full);
  padding: 0.25rem 0.625rem;
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid transparent;
}

.status-chip--success {
  color: var(--color-success);
  background: var(--color-success-soft);
  border-color: color-mix(in srgb, var(--color-success) 22%, transparent);
}

.status-chip--warning {
  color: var(--color-warning);
  background: var(--color-warning-soft);
  border-color: color-mix(in srgb, var(--color-warning) 22%, transparent);
}

.status-chip--error {
  color: var(--color-error);
  background: var(--color-error-soft);
  border-color: color-mix(in srgb, var(--color-error) 22%, transparent);
}

.status-chip--info {
  color: var(--color-info);
  background: var(--color-info-soft);
  border-color: color-mix(in srgb, var(--color-info) 22%, transparent);
}
```

### Form Input

```css
.input-field {
  min-height: 44px;
  width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 0.75rem 0.875rem;
  color: var(--color-text-primary);
  font: 500 var(--text-sm) / 1.35 var(--font-body);
  transition:
    border-color 180ms var(--ease-smooth),
    box-shadow 180ms var(--ease-smooth),
    background 180ms var(--ease-smooth);
}

.input-field::placeholder {
  color: var(--color-text-muted);
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-ring);
}

.input-field[aria-invalid="true"] {
  border-color: var(--color-error);
  box-shadow: 0 0 0 4px var(--color-error-soft);
}
```

### Progress Bar

```css
.progress-track {
  height: 8px;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: var(--color-bg-subtle);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  transition: width 700ms var(--ease-spring);
}
```

---

## 7. Micro-Interactions & Motion

### Motion Tokens

```css
:root {
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 140ms;
  --duration-base: 220ms;
  --duration-slow: 360ms;
}
```

### Motion Rules

- Animate `transform` and `opacity` by default.
- Avoid animating `width`, `height`, `top`, `left`, and layout-heavy properties unless using controlled layout transitions.
- Keep most interactions between `140ms` and `260ms`.
- Use `prefers-reduced-motion` to disable non-essential movement.
- No infinite decorative animations except skeleton shimmer and live indicators.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Tactile Button with Motion

```tsx
import { motion } from "motion/react";

export function TactileButton({ children, ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className="btn-primary"
      {...props}
    >
      {children}
    </motion.button>
  );
}
```

### Bento Card Entrance

```tsx
const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0, 0, 0.2, 1] },
  },
};
```

### Shared Element Transitions

Use `layoutId` for transitions between list/detail views, especially reward catalog cards.

```tsx
<motion.img layoutId={`reward-image-${reward.id}`} src={reward.imageUrl} alt="" />
```

Use shared elements only for meaningful context continuity. Do not apply `layoutId` everywhere.

---

## 8. Responsive Web App Rules

### Breakpoints

```text
sm  640px   large phone / small tablet
md  768px   tablet
lg  1024px  desktop layout starts
xl  1280px  wide desktop
2xl 1536px  dashboard max-width
```

### Container Queries

Use container queries for reusable cards that can live in different contexts.

```css
.card-container {
  container-type: inline-size;
}

@container (min-width: 420px) {
  .metric-card-layout {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: end;
  }
}
```

### Touch-First Rules

- Minimum touch target: `44px`, recommended `48px`.
- Important mobile actions should be reachable near the bottom half of the screen.
- Hover states must not be the only way to reveal critical actions.
- Swipe actions need visible fallback buttons.

### Mobile Bento Priority

On mobile, order cards by task importance:

1. Total Tokens
2. Eligibility / Can Redeem
3. Current Tier
4. Next Tier Progress
5. Reward Preview
6. Token History Chart
7. Activity Tables

---

## 9. Skeleton Screens

Skeletons must mirror the final layout. Avoid full-page spinners for data-heavy views.

### Skeleton Base

```css
.skeleton {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: #e2e8f0;
}

.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.72),
    transparent
  );
  animation: skeleton-sweep 1.5s ease-in-out infinite;
}

@keyframes skeleton-sweep {
  100% {
    transform: translateX(100%);
  }
}
```

### Dashboard Skeleton

```tsx
export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading loyalty dashboard" aria-busy="true" className="bento-grid">
      <div className="bento-card bento-span-12 p-6 space-y-3">
        <div className="skeleton h-7 w-72" />
        <div className="skeleton h-4 w-96 max-w-full" />
      </div>

      {[0, 1, 2].map((item) => (
        <div key={item} className="bento-card bento-span-4 p-6 space-y-5">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-12 w-40" />
          <div className="skeleton h-4 w-56 max-w-full" />
        </div>
      ))}

      <div className="bento-card bento-span-8 p-6 space-y-4">
        <div className="skeleton h-5 w-44" />
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>

      <div className="bento-card bento-span-4 bento-row-2 p-6 space-y-4">
        <div className="skeleton h-5 w-40" />
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-3">
            <div className="skeleton h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 10. Navigation & Breadcrumbs

### Sticky Top Navigation

Use a clean white navigation bar with subtle blur only when content scrolls underneath.

```css
.app-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px);
}
```

### Breadcrumb Design

```text
Dashboard / Rewards / Item Name
```

Rules:

- Separator: `/`
- Ancestors: `--color-text-secondary`
- Current page: `--color-text-primary`
- Hover: underline and primary text color
- No scale or movement on breadcrumb links

```tsx
function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 py-3 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.label}>
            {index > 0 && <span className="text-slate-300">/</span>}
            {isLast ? (
              <span aria-current="page" className="font-semibold text-slate-950">
                {item.label}
              </span>
            ) : (
              <a href={item.href} className="text-slate-500 underline-offset-4 hover:text-slate-950 hover:underline">
                {item.label}
              </a>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
```

---

## 11. Accessibility Standards

Target WCAG 2.2 AA.

### Contrast Targets

| UI Element | Minimum Ratio |
| --- | ---: |
| Normal text | 4.5:1 |
| Large text | 3:1 |
| Icons, borders, controls | 3:1 |
| Focus indicator | Must be clearly visible against adjacent colors |

### Focus Ring

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}

:focus:not(:focus-visible) {
  outline: none;
}
```

### ARIA Patterns

```tsx
<span role="status" aria-label={`Status: ${status}`} className="status-chip">
  {status}
</span>

<p aria-label={`${tokens.toLocaleString()} tokens`} className="text-metric">
  {tokens.toLocaleString()}
</p>

<div role="status" aria-label="Loading loyalty data" aria-busy="true">
  <DashboardSkeleton />
</div>
```

### Accessibility Rules

- Never use color alone to communicate state.
- Every icon-only button needs an `aria-label`.
- Every table needs clear column headers.
- Error messages should be connected to fields with `aria-describedby`.
- Loading regions should use `aria-busy="true"`.

---

## 12. Dark Mode Architecture

Light mode is the default. Dark mode is token-driven only. Do not duplicate components.

```css
[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-bg-subtle: #111827;
  --color-surface: #111827;
  --color-surface-raised: #1e293b;
  --color-surface-muted: #0b1220;

  --color-text-primary: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-text-muted: #94a3b8;
  --color-text-disabled: #64748b;
  --color-text-inverse: #ffffff;

  --color-border: rgba(226, 232, 240, 0.14);
  --color-border-subtle: rgba(226, 232, 240, 0.08);
  --color-border-strong: rgba(226, 232, 240, 0.22);

  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.28);
  --shadow-sm: 0 8px 24px rgba(0, 0, 0, 0.30);
  --shadow-md: 0 16px 40px rgba(0, 0, 0, 0.34);
  --shadow-lg: 0 24px 64px rgba(0, 0, 0, 0.42);
}
```

Dark mode rules:

- Keep the same brand colors, but use softer backgrounds.
- Do not use pure black backgrounds.
- Increase border visibility slightly because shadows are less readable on dark surfaces.
- Use `data-theme="dark"` at the document root.

---

## 13. Implementation Tokens

Add to `src/app/globals.css`.

```css
:root {
  --color-bg: #f8fafc;
  --color-bg-subtle: #f1f5f9;
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;
  --color-surface-muted: #f8fafc;

  --color-text-primary: #0f172a;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;
  --color-text-disabled: #cbd5e1;
  --color-text-inverse: #ffffff;

  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-primary-pressed: #3730a3;
  --color-primary-soft: rgba(79, 70, 229, 0.10);
  --color-primary-ring: rgba(79, 70, 229, 0.22);

  --color-accent: #06b6d4;
  --color-accent-hover: #0891b2;
  --color-accent-soft: rgba(6, 182, 212, 0.10);
  --color-accent-ring: rgba(6, 182, 212, 0.22);

  --color-success: #16a34a;
  --color-success-soft: rgba(22, 163, 74, 0.10);
  --color-warning: #d97706;
  --color-warning-soft: rgba(217, 119, 6, 0.12);
  --color-error: #dc2626;
  --color-error-soft: rgba(220, 38, 38, 0.10);
  --color-info: #0284c7;
  --color-info-soft: rgba(2, 132, 199, 0.10);

  --color-border: #e2e8f0;
  --color-border-subtle: #edf2f7;
  --color-border-strong: #cbd5e1;

  --font-display: "Plus Jakarta Sans", "Inter Tight", system-ui, sans-serif;
  --font-body: "Plus Jakarta Sans", Inter, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 4px 12px rgba(15, 23, 42, 0.06);
  --shadow-md: 0 10px 24px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 18px 48px rgba(15, 23, 42, 0.10);

  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 14. Tailwind Config Extension

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-bg)",
        surface: "var(--color-surface)",
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        ink: "var(--color-text-primary)",
        muted: "var(--color-text-secondary)",
        border: "var(--color-border)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      transitionTimingFunction: {
        smooth: "var(--ease-smooth)",
        spring: "var(--ease-spring)",
      },
      keyframes: {
        "skeleton-sweep": {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "skeleton-sweep": "skeleton-sweep 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 15. AI Vibecoder Prompt Patterns

### Pattern A — Modern Clean Bento Card

```text
Create a React TypeScript bento card component for Berijalan Employee Loyalty Portal.

Design constraints:
- Theme: Modern Clean Professional, light-first, Bento Card System.
- Surface: #FFFFFF, border #E2E8F0, radius 16px, shadow 0 4px 12px rgba(15,23,42,0.06).
- Hover: translateY(-3px), border-color mixed with #4F46E5, shadow 0 10px 24px rgba(15,23,42,0.08).
- Text: primary #0F172A, secondary #64748B, muted #94A3B8.
- Primary action color: #4F46E5. Accent highlight: #06B6D4.
- Typography: Plus Jakarta Sans or Inter Tight; metric values use JetBrains Mono.
- Include aria-labels for metric values and icon-only buttons.
- Include skeleton state that mirrors the real layout.
- Use Tailwind classes where possible and CSS custom properties for theme tokens.

Card content: [DESCRIBE CONTENT]
```

### Pattern B — Professional CTA Button

```text
Create a CTA button component.

States:
- Rest: bg #4F46E5, text white, radius 12px, min-height 44px, font-weight 700.
- Hover: bg #4338CA, translateY(-1px), shadow 0 10px 24px rgba(79,70,229,0.24).
- Active: scale(0.97), bg #3730A3.
- Focus: outline 2px solid #4F46E5, outline-offset 3px, or box-shadow 0 0 0 4px rgba(79,70,229,0.22).
- Disabled: opacity 0.48, cursor not-allowed, no hover transform.

Export as <PrimaryButton label icon isLoading disabled onClick />.
When loading, show a small spinner and disable clicks.
```

### Pattern C — Dashboard Page Shell

```text
Scaffold a Next.js App Router dashboard page.

Layout:
- Root background: #F8FAFC with subtle radial gradients: indigo at top-left and cyan at top-right.
- Sticky white nav: rgba(255,255,255,0.82), blur(16px), border-bottom #E2E8F0.
- Breadcrumb below nav.
- Main max-width 1440px, mx-auto, px responsive.
- Bento grid: 12 columns desktop, 6 columns tablet, 1 column mobile.
- Cards: white surface, #E2E8F0 border, 16px radius, soft shadow.
- Show skeleton while loading.
- Stagger card entrance with opacity + y transform only.

Cards:
- Total Tokens: col-span-4, featured.
- Current Tier: col-span-4.
- Redemption Eligibility: col-span-4 with primary CTA.
- Token History: col-span-8.
- Reward Preview: col-span-4 row-span-2.
- Tier Progress: col-span-8.
```

### Pattern D — Skeleton Screen

```text
Generate a skeleton screen for [COMPONENT].

Rules:
- Mirror the final layout exactly.
- Use #E2E8F0 base and a white shimmer sweep.
- Do not use spinner or text placeholders.
- Use role="status", aria-label="Loading [content]", aria-busy="true".
- Respect prefers-reduced-motion.
```

---

## 16. Quick Reference Cheat Sheet

```text
THEME
Modern Clean Professional · Bento Card System · Light-first

COLORS
Canvas              #F8FAFC
Surface             #FFFFFF
Primary             #4F46E5
Primary hover       #4338CA
Accent              #06B6D4
Text primary        #0F172A
Text secondary      #64748B
Border              #E2E8F0

TYPOGRAPHY
Display/body        Plus Jakarta Sans or Inter Tight
Mono                JetBrains Mono
Hero                clamp(2.25rem, 1.65rem + 2vw, 4.5rem)
Body                clamp(1rem, 0.95rem + 0.18vw, 1.0625rem)
Line-height body    1.55–1.7

RADIUS
Button/input        12px
Card                16px
Modal/drawer        24px
Chip                9999px

MOTION
Standard duration   180–260ms
Entrance duration   320–360ms
Use                 transform + opacity
Avoid               width, height, top, left

BENTO
Desktop             12 columns
Tablet              6 columns
Mobile              1 column
Gap                 24–32px
Card padding        24px desktop, 16px mobile
```

---

_This document is the single source of design truth for the Berijalan Employee Loyalty Portal. When in doubt: clarity over decoration, bento hierarchy over generic grids, and accessibility over visual tricks._
