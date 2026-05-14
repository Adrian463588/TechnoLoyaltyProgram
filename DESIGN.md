# DESIGN.md — Berijalan Employee Loyalty Portal
> Design System Reference for AI Vibecoders and Human Engineers
> Version 1.0 · May 2026 · Modern Dark Tech Theme

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Glassmorphism Specification](#4-glassmorphism-specification)
5. [Bento Grid System](#5-bento-grid-system)
6. [Micro-Interactions & Motion](#6-micro-interactions--motion)
7. [Component Library](#7-component-library)
8. [Breadcrumb Navigation](#8-breadcrumb-navigation)
9. [Skeleton Screens](#9-skeleton-screens)
10. [Iconography & Spacing](#10-iconography--spacing)
11. [Responsive Behavior](#11-responsive-behavior)
12. [Accessibility Standards](#12-accessibility-standards)
13. [Dark Mode Architecture](#13-dark-mode-architecture)
14. [Implementation Tokens (CSS Variables)](#14-implementation-tokens-css-variables)
15. [AI Vibecoder Prompt Patterns](#15-ai-vibecoder-prompt-patterns)

---

## 1. Design Philosophy

### Core Direction: **Modern Dark Tech — Frosted Spatial Depth**

The portal operates as an internal operational hub where clarity and trust are non-negotiable. The design language marries **Bento Grid structure** (organized, scannable, modular) with **Glassmorphism depth** (layered, premium, futuristic) against a deep navy mesh-lit canvas.

> **The one thing a user will remember:** Numbers that glow green inside frosted glass panels — their token count immediately legible before they even fully load the page.

### Guiding Principles

| Principle | Implementation |
|-----------|---------------|
| **Spatial Depth** | Background mesh gradients create Z-axis illusion; cards float via blur layers |
| **Signal over Noise** | Critical numbers (tokens, tier, eligibility) are always largest on screen |
| **Green as Trust** | `#6BCE53` is reserved exclusively for positive actions and CTA — never decorative |
| **Motion with Purpose** | Every animation answers a user question: "Did it work? Is it loading? Did my tier change?" |
| **Frosted Transparency** | Cards are windows into data, not opaque boxes — backdrop blur reinforces this |

---

## 2. Color System

### Primary Palette

```css
/* === BACKGROUNDS === */
--color-bg-base:        #1E2938;   /* Deep navy — main page canvas */
--color-bg-deep:        #0F172A;   /* Darker variant for modals, drawers */
--color-bg-surface:     rgba(45, 55, 72, 0.25);  /* Card glass layer (25% opacity) */
--color-bg-surface-md:  rgba(45, 55, 72, 0.35);  /* Medium glass — hover state */
--color-bg-surface-hi:  rgba(45, 55, 72, 0.50);  /* Heavy glass — focused/active card */

/* === TEXT === */
--color-text-primary:   #F8FAFC;   /* Off-white — headings, key numbers */
--color-text-secondary: #94A3B8;   /* Muted slate — labels, metadata, captions */
--color-text-disabled:  #475569;   /* Dimmed — placeholder text, inactive items */

/* === ACCENT / ACTION === */
--color-accent:         #6BCE53;   /* Neon green — CTA, success, active states */
--color-accent-hover:   #57B241;   /* Darker green — hover/pressed CTA */
--color-accent-muted:   rgba(107, 206, 83, 0.15); /* Ghost green — soft highlights */
--color-accent-glow:    rgba(107, 206, 83, 0.30); /* Glow ring for glowing buttons */

/* === BRAND BLUE === */
--color-brand:          #063175;   /* Dark blue — secondary brand element */
--color-brand-hover:    #0A45A3;   /* Bright blue — hover state for blue elements */

/* === SEMANTIC === */
--color-error:          #EF4444;   /* Red — validation errors, rejected states */
--color-warning:        #F59E0B;   /* Amber — warnings, pending states */
--color-info:           #3B82F6;   /* Blue — informational banners */
--color-success:        #6BCE53;   /* Same as accent — consistent success signal */

/* === BORDERS === */
--color-border-glass:   rgba(255, 255, 255, 0.10); /* Frosted card border */
--color-border-subtle:  rgba(255, 255, 255, 0.06); /* Very subtle dividers */
--color-border-accent:  rgba(107, 206, 83, 0.40);  /* Green-tinted border on focus */
```

### Mesh Gradient Background

The page canvas uses a layered radial gradient mesh that simulates ambient studio lighting. This is applied to the `<body>` or root layout only — never repeated in components.

```css
body {
  background-color: var(--color-bg-base);
  background-image:
    radial-gradient(ellipse 80% 60% at 10% 20%, rgba(107, 206, 83, 0.08) 0%, transparent 60%),
    radial-gradient(ellipse 60% 80% at 90% 80%, rgba(6, 49, 117, 0.25) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 50% 10%, rgba(107, 206, 83, 0.05) 0%, transparent 50%);
  background-attachment: fixed;
}
```

> **Rule:** Never add `background-image` to individual cards or sections — the mesh must bleed through glass surfaces for spatial depth to work.

---

## 3. Typography

### Font Stack

```css
/* Display / Headings — Geometric authority */
--font-display: 'Syne', 'Space Grotesk', sans-serif;

/* Body / UI — Clean legibility at small sizes */
--font-body: 'DM Sans', 'Geist', sans-serif;

/* Mono / Data — Numbers, codes, tokens */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

> Install via Google Fonts or Fontsource. Syne is the differentiator — its wide geometric letterforms give the dashboard a tech-editorial feel that Inter cannot.

### Type Scale

```css
--text-xs:   0.75rem;    /* 12px — badges, timestamps */
--text-sm:   0.875rem;   /* 14px — labels, secondary info */
--text-base: 1rem;       /* 16px — body, table cells */
--text-lg:   1.125rem;   /* 18px — card subtitles */
--text-xl:   1.25rem;    /* 20px — section headings */
--text-2xl:  1.5rem;     /* 24px — card metric values */
--text-3xl:  1.875rem;   /* 30px — dashboard hero numbers */
--text-4xl:  2.25rem;    /* 36px — page headings */
--text-5xl:  3rem;       /* 48px — total token hero stat */
```

### Type Rules

```css
/* Hero metric — token count, etc. */
.text-metric-hero {
  font-family: var(--font-mono);
  font-size: var(--text-5xl);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-accent);
  line-height: 1;
}

/* Card heading */
.text-card-heading {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

/* Label / metadata */
.text-label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text-secondary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

---

## 4. Glassmorphism Specification

### Core Glass Recipe

```css
/* === BASE GLASS CARD === */
.glass-card {
  background: rgba(45, 55, 72, 0.25);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 16px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.25),
    0 1px 0px rgba(255, 255, 255, 0.05) inset;
}

/* === HOVER STATE === */
.glass-card:hover {
  background: rgba(45, 55, 72, 0.40);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(107, 206, 83, 0.12),
    0 1px 0px rgba(255, 255, 255, 0.08) inset;
  transform: translateY(-2px);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* === ACCENT GLASS (active/highlighted card) === */
.glass-card--accent {
  background: rgba(107, 206, 83, 0.08);
  border-color: rgba(107, 206, 83, 0.25);
  box-shadow:
    0 4px 24px rgba(107, 206, 83, 0.10),
    0 0 40px rgba(107, 206, 83, 0.05) inset;
}

/* === ELEVATED GLASS (modals, dropdowns) === */
.glass-elevated {
  background: rgba(45, 55, 72, 0.70);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.50);
}
```

### Glass Variants Reference

| Variant | Use Case | Opacity | Blur |
|---------|----------|---------|------|
| `glass-card` | Standard bento cards | 25% | 16px |
| `glass-card--accent` | Token/tier highlight cards | 8% green tint | 16px |
| `glass-card:hover` | Interactive card hover | 40% | 16px |
| `glass-elevated` | Modals, command palette | 70% | 24px |
| `glass-nav` | Top navbar | 15% | 20px |
| `glass-tooltip` | Tooltips | 80% | 12px |

### Navbar Glass

```css
.glass-nav {
  background: rgba(30, 41, 56, 0.80);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: 50;
}
```

---

## 5. Bento Grid System

### Grid Philosophy

The Bento Grid treats the dashboard as a **magazine layout** — not a list of cards. Each card has semantic size based on the importance of its content, not arbitrary column counts.

### Base Grid

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: minmax(120px, auto);
  gap: 16px;
  padding: 24px;
}
```

### Standard Bento Sizes (Tailwind)

```
col-span-12        → Full width    — page title, primary alerts
col-span-8         → 2/3 width     — main activity chart, upload table
col-span-6         → Half width    — token summary, tier progress
col-span-4         → 1/3 width     — quick stats (tokens, tier badge, eligibility)
col-span-3         → 1/4 width     — micro-stats, streak counters
col-span-4 row-span-2 → Tall card  — redemption history, team leaderboard
```

### Employee Dashboard Layout Blueprint

```
┌─────────────────────────────────────────────────────────┐
│  col-12 · WELCOME BANNER + period status                │
├──────────────┬──────────────┬───────────────────────────┤
│  col-4       │  col-4       │  col-4                    │
│  TOTAL       │  CURRENT     │  CAN REDEEM?              │
│  TOKENS      │  TIER        │  YES / NO + reason        │
│  [hero num]  │  [badge]     │  [CTA button]             │
├──────────────┴──────────────┼───────────────────────────┤
│  col-8 · TOKEN HISTORY      │  col-4 · UPCOMING         │
│  Sparkline or bar chart     │  REWARDS                  │
│  over last 6 months         │  Scrollable mini-catalog  │
│                             │  (row-span-2)             │
├─────────────────────────────┤                           │
│  col-8 · TIER PROGRESS BAR  │                           │
│  Progress toward next tier  │                           │
│  + milestone breakdown      │                           │
└─────────────────────────────┴───────────────────────────┘
```

### Admin Dashboard Layout Blueprint

```
┌──────────────────────────────────────────────────────────┐
│  col-12 · ACTIVE PERIOD STATUS + snapshot indicator      │
├──────────┬───────────┬───────────┬───────────────────────┤
│ col-3    │ col-3     │ col-3     │ col-3                 │
│ Uploads  │ Pending   │ Active    │ This Period           │
│ This Mo  │ Redeem    │ Partners  │ Tokens Issued         │
├──────────┴───────────┴───────────┴───────────────────────┤
│  col-8 · RECENT UPLOAD ACTIVITY (table)                  │
│  col-4 · QUICK ACTIONS panel (Upload / Process / Export) │
├──────────────────────────────────────────────────────────┤
│  col-12 · REDEMPTION QUEUE (tabbed table)                │
└──────────────────────────────────────────────────────────┘
```

### Bento Card Anatomy

```
┌─────────────────────────────────────┐  ← 1px white/10% border
│  [ICON]  Card Label          [···]  │  ← Label (text-label) + overflow menu
│                                     │
│  ████████████████                   │  ← Hero metric (text-metric-hero)
│  Sub-value or delta badge           │
│                                     │
│  ─────────────────────────────────  │  ← 1px border-subtle divider
│  Supporting info or sparkline       │  ← text-secondary
└─────────────────────────────────────┘  ← border-radius: 16px
```

---

## 6. Micro-Interactions & Motion

### Motion Principles

1. **Purposeful** — every animation communicates a state change, not decoration.
2. **Fast defaults** — most transitions under 250ms; enter animations up to 400ms.
3. **Spring physics** — use `cubic-bezier(0.34, 1.56, 0.64, 1)` for elements that "arrive" (cards, modals).
4. **Ease-out exits** — departing elements use `cubic-bezier(0.4, 0, 1, 1)` — no bounce on close.

### Easing Reference

```css
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);  /* Bouncy arrival */
--ease-smooth:   cubic-bezier(0.4, 0, 0.2, 1);        /* Standard smooth */
--ease-in:       cubic-bezier(0.4, 0, 1, 1);           /* Departing elements */
--ease-out:      cubic-bezier(0, 0, 0.2, 1);           /* Arriving elements */
```

### Button Hover States

```css
/* === PRIMARY CTA BUTTON (Green) === */
.btn-primary {
  background: var(--color-accent);
  color: #0F172A;
  font-family: var(--font-display);
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition:
    background 0.2s var(--ease-smooth),
    box-shadow 0.2s var(--ease-smooth),
    transform 0.15s var(--ease-spring);
}

.btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0);
  transition: background 0.2s var(--ease-smooth);
}

.btn-primary:hover {
  background: var(--color-accent-hover);
  box-shadow: 0 0 0 4px var(--color-accent-glow), 0 4px 16px rgba(107, 206, 83, 0.35);
  transform: translateY(-1px);
}

.btn-primary:hover::before {
  background: rgba(255, 255, 255, 0.06);
}

.btn-primary:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 0 0 2px var(--color-accent-glow);
  transition-duration: 0.08s;
}

/* === GHOST BUTTON (Glass surface) === */
.btn-ghost {
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-glass);
  padding: 10px 24px;
  border-radius: 10px;
  cursor: pointer;
  transition:
    background 0.2s var(--ease-smooth),
    border-color 0.2s var(--ease-smooth),
    transform 0.15s var(--ease-spring);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.10);
  border-color: rgba(255, 255, 255, 0.20);
  transform: translateY(-1px);
}

.btn-ghost:active {
  transform: scale(0.97);
  transition-duration: 0.08s;
}

/* === DESTRUCTIVE BUTTON === */
.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #FCA5A5;
  border: 1px solid rgba(239, 68, 68, 0.30);
  transition: all 0.2s var(--ease-smooth);
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.50);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.15);
}

/* === ICON BUTTON === */
.btn-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    background 0.15s var(--ease-smooth),
    color 0.15s var(--ease-smooth),
    border-color 0.15s var(--ease-smooth),
    transform 0.15s var(--ease-spring);
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--color-border-glass);
  color: var(--color-text-primary);
  transform: scale(1.05);
}
```

### Card Hover (Full Specification)

```css
.bento-card {
  /* Base glass */
  background: var(--color-bg-surface);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid var(--color-border-glass);
  border-radius: 16px;

  /* Transition all interactive properties */
  transition:
    background 0.25s var(--ease-smooth),
    border-color 0.25s var(--ease-smooth),
    box-shadow 0.25s var(--ease-smooth),
    transform 0.25s var(--ease-spring);
  
  will-change: transform;
  cursor: default;
}

.bento-card[data-interactive="true"] {
  cursor: pointer;
}

.bento-card[data-interactive="true"]:hover {
  background: var(--color-bg-surface-md);
  border-color: rgba(107, 206, 83, 0.20);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.30),
    0 0 0 1px rgba(107, 206, 83, 0.08);
  transform: translateY(-3px);
}

/* Subtle green top-border glow on hover */
.bento-card[data-interactive="true"]:hover::before {
  content: '';
  position: absolute;
  top: 0; left: 10%; right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  opacity: 0.6;
}
```

### Form Input States

```css
/* Base input */
.input-field {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--color-border-glass);
  border-radius: 10px;
  color: var(--color-text-primary);
  padding: 10px 14px;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  width: 100%;
  transition:
    background 0.2s var(--ease-smooth),
    border-color 0.2s var(--ease-smooth),
    box-shadow 0.2s var(--ease-smooth);
}

.input-field::placeholder {
  color: var(--color-text-disabled);
}

/* Focus */
.input-field:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-muted);
}

/* Error */
.input-field--error {
  border-color: rgba(239, 68, 68, 0.60);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}

/* Filled */
.input-field:not(:placeholder-shown) {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.14);
}
```

### Row Hover (Tables)

```css
.table-row {
  transition: background 0.12s var(--ease-smooth);
  cursor: pointer;
}

.table-row:hover {
  background: rgba(107, 206, 83, 0.05);
}

.table-row:hover .table-cell-action {
  opacity: 1;
  transform: translateX(0);
}

.table-cell-action {
  opacity: 0;
  transform: translateX(8px);
  transition:
    opacity 0.15s var(--ease-smooth),
    transform 0.15s var(--ease-out);
}
```

### Status Badge Pulse (Active / Live indicators)

```css
.badge-live {
  position: relative;
}

.badge-live::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: pulse-ring 2s ease-out infinite;
}

@keyframes pulse-ring {
  0%   { transform: scale(0.8); opacity: 0.8; }
  70%  { transform: scale(1.6); opacity: 0; }
  100% { transform: scale(1.6); opacity: 0; }
}
```

### Number Count-Up Animation

Use on hero metrics (total tokens, etc.) when data loads.

```typescript
// React hook
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(easeOut(progress) * target));
      if (progress < 1) requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }, [target, duration]);

  return count;
}
```

---

## 7. Component Library

### Tier Badge

```tsx
type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

const tierConfig: Record<Tier, { color: string; bg: string; glow: string }> = {
  Bronze:   { color: '#CD7F32', bg: 'rgba(205, 127, 50, 0.15)',  glow: 'rgba(205, 127, 50, 0.30)' },
  Silver:   { color: '#C0C0C0', bg: 'rgba(192, 192, 192, 0.15)', glow: 'rgba(192, 192, 192, 0.30)' },
  Gold:     { color: '#FFD700', bg: 'rgba(255, 215, 0, 0.15)',   glow: 'rgba(255, 215, 0, 0.30)' },
  Platinum: { color: '#6BCE53', bg: 'rgba(107, 206, 83, 0.15)',  glow: 'rgba(107, 206, 83, 0.30)' },
};

// Style:
// border-radius: 99px; padding: 4px 12px; font-size: var(--text-xs);
// font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
// background: tierConfig[tier].bg; color: tierConfig[tier].color;
// box-shadow: 0 0 12px tierConfig[tier].glow;
```

### Redemption Status Chip

```
Status              Background                  Text Color
─────────────────────────────────────────────────────────
Draft               rgba(148, 163, 184, 0.15)   #94A3B8
Pending Verify      rgba(245, 158, 11, 0.15)    #FCD34D
Verified            rgba(59, 130, 246, 0.15)    #93C5FD
Rejected            rgba(239, 68, 68, 0.15)     #FCA5A5
Purchased           rgba(107, 206, 83, 0.10)    #86EFAC
Pickup Scheduled    rgba(107, 206, 83, 0.18)    #6BCE53
Completed           rgba(107, 206, 83, 0.25)    #6BCE53
Cancelled           rgba(71, 85, 105, 0.25)     #475569
```

### Progress Bar (Tier Advancement)

```css
.progress-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 99px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #57B241, #6BCE53, #8EE56C);
  box-shadow: 0 0 8px rgba(107, 206, 83, 0.50);
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

/* Shimmer sweep on progress bar */
.progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%);
  animation: shimmer-sweep 2s ease-in-out infinite;
  background-size: 200% 100%;
}

@keyframes shimmer-sweep {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Upload Drop Zone

```css
.upload-zone {
  border: 2px dashed var(--color-border-glass);
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.02);
  transition:
    border-color 0.2s var(--ease-smooth),
    background 0.2s var(--ease-smooth);
  cursor: pointer;
}

.upload-zone:hover,
.upload-zone[data-dragging="true"] {
  border-color: var(--color-accent);
  background: var(--color-accent-muted);
  box-shadow: 0 0 0 4px var(--color-accent-glow);
}

/* Icon bounce on hover */
.upload-zone:hover .upload-icon {
  animation: bounce-gentle 0.6s var(--ease-spring);
}

@keyframes bounce-gentle {
  0%   { transform: translateY(0); }
  40%  { transform: translateY(-8px); }
  70%  { transform: translateY(-3px); }
  100% { transform: translateY(0); }
}
```

### Notification Toast

```css
.toast {
  background: rgba(45, 55, 72, 0.90);
  backdrop-filter: blur(16px);
  border: 1px solid var(--color-border-glass);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.40);

  /* Entrance animation */
  animation: toast-in 0.35s var(--ease-spring) forwards;
}

@keyframes toast-in {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes toast-out {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(-8px) scale(0.96); }
}
```

---

## 8. Breadcrumb Navigation

Breadcrumbs communicate page depth and allow users to quickly navigate back. Every page below the root dashboard must show a breadcrumb.

### Visual Design

```
Dashboard  /  Monthly Uploads  /  Upload #42 — January 2026
```

- Separator: `/` in `--color-text-disabled`, never `>` or `›`
- Active (current page): `--color-text-primary`, not a link
- Ancestors: `--color-text-secondary`, underlined on hover → `--color-text-primary`
- Container: sits below `<nav>` and above the page `<h1>`

### Implementation (React + Tailwind)

```tsx
interface BreadcrumbItem {
  label: string;
  href?: string;
}

function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 py-3">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <span className="text-[--color-text-disabled] text-sm select-none">
                /
              </span>
            )}
            {isLast ? (
              <span
                className="text-sm font-medium text-[--color-text-primary]"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                className="
                  text-sm text-[--color-text-secondary]
                  underline-offset-2 hover:underline
                  hover:text-[--color-text-primary]
                  transition-colors duration-150
                "
              >
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

### Micro-Interaction Rule

Each breadcrumb ancestor link has:
- `transition: color 150ms ease`
- On hover: text color transitions from secondary → primary
- On hover: `text-decoration: underline` appears (do not use `border-bottom` — breaks baseline)
- No transform/scale — breadcrumbs must feel stable, not playful

### Breadcrumb by Role

| Route | Breadcrumb |
|-------|-----------|
| `/dashboard` | Dashboard |
| `/rewards` | Dashboard / Rewards |
| `/rewards/[id]` | Dashboard / Rewards / Item Name |
| `/admin/uploads` | Admin / Monthly Uploads |
| `/admin/uploads/[id]` | Admin / Monthly Uploads / Upload #42 |
| `/admin/redemptions/[id]` | Admin / Redemption Requests / REQ-0042 |
| `/team/members/[id]` | Team Overview / Members / Employee Name |

---

## 9. Skeleton Screens

Skeleton screens must be used on every async data view. Never use a spinner alone for content areas.

### Design Rules

1. **Match the layout** — the skeleton must mirror the exact shape of loaded content.
2. **Animate with shimmer** — a single directional sweep, never pulsing opacity.
3. **Use the same spacing** — padding, gaps, and border-radius should match the real component.
4. **Neutral color** — skeletons use `rgba(255, 255, 255, 0.06)` base with shimmer at `rgba(255, 255, 255, 0.12)`.
5. **No text placeholders** — use blocks, never "Loading..." text inside skeleton shapes.

### Skeleton CSS Base

```css
.skeleton {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.08) 40%,
    rgba(255, 255, 255, 0.12) 50%,
    rgba(255, 255, 255, 0.08) 60%,
    transparent 100%
  );
  animation: skeleton-sweep 1.8s ease-in-out infinite;
  background-size: 200% 100%;
}

@keyframes skeleton-sweep {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Skeleton — Token Hero Card

```tsx
function TokenCardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      {/* Label */}
      <div className="skeleton h-3 w-24 rounded" />
      {/* Hero number */}
      <div className="skeleton h-12 w-40 rounded" />
      {/* Sub-value */}
      <div className="skeleton h-3 w-32 rounded" />
      {/* Divider */}
      <div className="skeleton h-px w-full rounded" />
      {/* Footer info */}
      <div className="skeleton h-3 w-48 rounded" />
    </div>
  );
}
```

### Skeleton — Table Row (Admin Upload List)

```tsx
function TableRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-[--color-border-subtle]">
          <td className="p-4"><div className="skeleton h-4 w-32 rounded" /></td>
          <td className="p-4"><div className="skeleton h-4 w-20 rounded" /></td>
          <td className="p-4"><div className="skeleton h-4 w-16 rounded" /></td>
          <td className="p-4"><div className="skeleton h-6 w-24 rounded-full" /></td>
          <td className="p-4"><div className="skeleton h-4 w-8 rounded ml-auto" /></td>
        </tr>
      ))}
    </>
  );
}
```

### Skeleton — Bento Grid (Full Dashboard)

```tsx
function DashboardSkeleton() {
  return (
    <div className="bento-grid">
      {/* Welcome banner */}
      <div className="col-span-12 glass-card p-6">
        <div className="skeleton h-6 w-64 rounded mb-2" />
        <div className="skeleton h-4 w-48 rounded" />
      </div>

      {/* Stat cards x3 */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="col-span-4 glass-card p-6 space-y-4">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-10 w-32 rounded" />
          <div className="skeleton h-3 w-28 rounded" />
        </div>
      ))}

      {/* Chart area */}
      <div className="col-span-8 glass-card p-6">
        <div className="skeleton h-4 w-40 rounded mb-4" />
        <div className="skeleton h-40 w-full rounded-lg" />
      </div>

      {/* Side panel */}
      <div className="col-span-4 glass-card p-6 space-y-3">
        <div className="skeleton h-4 w-32 rounded" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-lg shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Transition from Skeleton → Content

```tsx
// Fade in loaded content — skeleton fades out simultaneously
const contentVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0, 0, 0.2, 1],
      staggerChildren: 0.06, // stagger each bento card
    }
  }
};

// Wrap each card with motion.div using cardVariant
const cardVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};
```

---

## 10. Iconography & Spacing

### Icon Library

Use **Lucide React** as the primary icon set. It is already in the required stack via shadcn/ui and has consistent 24px optical sizing with 1.5px strokes — ideal for the dark glass aesthetic.

```tsx
import { Coins, Award, ShoppingBag, Upload, Users, TrendingUp } from 'lucide-react';

// Standard icon sizes
const iconSm  = { size: 14 };  // Badge icons, inline text
const iconMd  = { size: 18 };  // Button icons, table actions
const iconLg  = { size: 24 };  // Card labels, nav items
const iconXl  = { size: 32 };  // Feature section icons (with bg)
```

### Icon + Color Mapping

| Icon | Context | Color |
|------|---------|-------|
| `Coins` | Token count | `#6BCE53` |
| `Award` | Tier badge | Tier color (see tier config) |
| `ShoppingBag` | Rewards | `#93C5FD` |
| `Upload` | File upload | `#94A3B8` |
| `Users` | Team view | `#94A3B8` |
| `TrendingUp` | Token growth | `#6BCE53` |
| `AlertCircle` | Warnings | `#FCD34D` |
| `XCircle` | Errors / Rejected | `#FCA5A5` |
| `CheckCircle2` | Success / Verified | `#6BCE53` |

### Spacing Scale (Tailwind remapped)

```
4px   → gap-1, p-1    Micro: icon padding, chip padding
8px   → gap-2, p-2    Small: badge internal gap
12px  → gap-3, p-3    Base: button padding, input padding
16px  → gap-4, p-4    Card internal padding (mobile)
24px  → gap-6, p-6    Card internal padding (desktop)
32px  → gap-8, p-8    Section internal padding
48px  → gap-12, p-12  Section spacing
64px  → gap-16, p-16  Page padding
```

---

## 11. Responsive Behavior

### Breakpoints

```
sm  → 640px   Tablet portrait start
md  → 768px   Tablet landscape
lg  → 1024px  Desktop start
xl  → 1280px  Wide desktop
2xl → 1536px  Ultra-wide / dashboard max-width
```

### Bento Grid Collapse Rules

```
Default (mobile):  grid-cols-1    All cards full width, stacked
sm (640px):        grid-cols-2    2-col basic grid
lg (1024px):       grid-cols-12   Full bento layout
```

### Sidebar Navigation

| Breakpoint | Nav Behavior |
|------------|-------------|
| Mobile `< lg` | Hidden by default; hamburger icon opens a `glass-elevated` drawer from the left |
| Desktop `>= lg` | Fixed sidebar, 240px wide, glass surface |
| Desktop collapsed | 64px icon-only sidebar; labels revealed on hover via tooltip |

### Card Priority on Mobile

On mobile, bento cards reorder by priority:
1. Total tokens
2. Tier / Eligibility
3. Redemption CTA
4. Progress bar
5. Chart / History
6. Catalog preview

Use CSS `order` utilities or a priority data attribute to manage this.

---

## 12. Accessibility Standards

Every component must pass WCAG 2.1 AA at minimum.

### Contrast Ratios

| Combination | Ratio | Status |
|-------------|-------|--------|
| `#F8FAFC` on `#1E2938` | 11.5:1 | ✅ AAA |
| `#6BCE53` on `#1E2938` | 6.8:1 | ✅ AA |
| `#94A3B8` on `#1E2938` | 4.6:1 | ✅ AA |
| `#6BCE53` on `rgba(45,55,72,0.25)` | ≈5.2:1 | ✅ AA |
| `#475569` on `#1E2938` | 2.1:1 | ⚠️ Use only for truly decorative text |

### Focus Ring (Keyboard Navigation)

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: 4px;
}

/* Remove default outline for mouse users only */
:focus:not(:focus-visible) {
  outline: none;
}
```

### ARIA Patterns

```tsx
// Status chips must use role="status" for live updates
<span role="status" aria-label={`Status: ${status}`} className="status-chip">
  {status}
</span>

// Token count — screen reader should say "4,200 tokens"
<p aria-label={`${tokens} tokens`} className="text-metric-hero">
  {tokens.toLocaleString()}
</p>

// Skeleton must communicate loading state
<div role="status" aria-label="Loading loyalty data" aria-busy="true">
  <DashboardSkeleton />
</div>

// Breadcrumb nav landmark
<nav aria-label="Breadcrumb">...</nav>
```

---

## 13. Dark Mode Architecture

This portal targets **Dark Mode exclusively** as the primary and only mode in Phase 1 (per product context). Do not implement light mode toggles. Use `class="dark"` on `<html>` or rely on `prefers-color-scheme: dark` media query.

```css
/* tailwind.config.ts */
// darkMode: 'class'
// All glass/dark styles are defaults — no 'dark:' prefix needed
```

If Phase 2 introduces a light mode option for HC PM admin views, introduce a `data-theme="light"` attribute and override CSS variables only — no duplication of components.

---

## 14. Implementation Tokens (CSS Variables)

Add this to `src/app/globals.css` or the root layout:

```css
:root {
  /* Backgrounds */
  --color-bg-base:       #1E2938;
  --color-bg-deep:       #0F172A;
  --color-bg-surface:    rgba(45, 55, 72, 0.25);
  --color-bg-surface-md: rgba(45, 55, 72, 0.35);
  --color-bg-surface-hi: rgba(45, 55, 72, 0.50);

  /* Text */
  --color-text-primary:   #F8FAFC;
  --color-text-secondary: #94A3B8;
  --color-text-disabled:  #475569;

  /* Accent */
  --color-accent:         #6BCE53;
  --color-accent-hover:   #57B241;
  --color-accent-muted:   rgba(107, 206, 83, 0.15);
  --color-accent-glow:    rgba(107, 206, 83, 0.30);

  /* Brand */
  --color-brand:          #063175;
  --color-brand-hover:    #0A45A3;

  /* Semantic */
  --color-error:   #EF4444;
  --color-warning: #F59E0B;
  --color-info:    #3B82F6;
  --color-success: #6BCE53;

  /* Borders */
  --color-border-glass:  rgba(255, 255, 255, 0.10);
  --color-border-subtle: rgba(255, 255, 255, 0.06);
  --color-border-accent: rgba(107, 206, 83, 0.40);

  /* Typography */
  --font-display: 'Syne', sans-serif;
  --font-body:    'DM Sans', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  /* Type Scale */
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.125rem;
  --text-xl:   1.25rem;
  --text-2xl:  1.5rem;
  --text-3xl:  1.875rem;
  --text-4xl:  2.25rem;
  --text-5xl:  3rem;

  /* Motion */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in:     cubic-bezier(0.4, 0, 1, 1);
  --ease-out:    cubic-bezier(0, 0, 0.2, 1);

  /* Border radius */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
  --radius-xl:   20px;
  --radius-full: 9999px;

  /* Glass */
  --glass-blur:     blur(16px) saturate(180%);
  --glass-blur-lg:  blur(24px) saturate(200%);
  --glass-blur-sm:  blur(12px) saturate(160%);
}
```

### Tailwind Config Extension

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#1E2938',
          deep:    '#0F172A',
        },
        accent:    '#6BCE53',
        brand:     '#063175',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        glass: '16px',
        'glass-lg': '24px',
      },
      animation: {
        'skeleton-sweep':  'skeleton-sweep 1.8s ease-in-out infinite',
        'pulse-ring':      'pulse-ring 2s ease-out infinite',
        'shimmer-sweep':   'shimmer-sweep 2s ease-in-out infinite',
        'toast-in':        'toast-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'bounce-gentle':   'bounce-gentle 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 15. AI Vibecoder Prompt Patterns

Use these structured prompt patterns when generating components with an LLM coding assistant. They encode the design system constraints so generated output stays on-system.

### Pattern A — Bento Card Component

```
Create a React TypeScript bento card component for the Berijalan Loyalty Portal.

Design constraints:
- Background: rgba(45, 55, 72, 0.25) with backdrop-filter: blur(16px) saturate(180%)
- Border: 1px solid rgba(255, 255, 255, 0.10), border-radius: 16px
- Hover: translateY(-3px), border-color rgba(107,206,83,0.20), transition 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)
- Primary text: #F8FAFC, secondary: #94A3B8, accent numbers: #6BCE53
- Font: display headings use Syne, metric numbers use JetBrains Mono
- Skeleton prop: when isLoading=true, render shimmer skeleton matching card layout
- Use Tailwind utility classes. No inline styles except CSS custom properties.
- Include aria-label for screen readers on metric values.

Card contains: [DESCRIBE CONTENT]
```

### Pattern B — Glass Button

```
Create a CTA button component for the Loyalty Portal with these exact states:

Rest:   background #6BCE53, text #0F172A, border-radius 10px, font Syne 600
Hover:  background #57B241, box-shadow "0 0 0 4px rgba(107,206,83,0.30)", translateY(-1px)
Active: scale(0.98), reduced shadow, transition 80ms
Focus:  outline 2px solid #6BCE53, outline-offset 3px
Disabled: opacity 0.4, cursor not-allowed, no hover transform

All transitions: 0.2s cubic-bezier(0.4, 0, 0.2, 1)
Export as: <PrimaryButton onClick label disabled isLoading />
When isLoading: show a small spinner inside the button, disable click.
```

### Pattern C — Dashboard Page Shell

```
Scaffold a Next.js App Router page at /app/(employee)/dashboard/page.tsx.

Layout requirements:
- Body background: #1E2938 with radial mesh gradient (green 8% opacity at top-left, brand blue 25% at bottom-right)
- Sticky glass navbar at top: rgba(30,41,56,0.80) with blur(20px), border-bottom 1px rgba(255,255,255,0.08)
- Breadcrumb below navbar: text-sm, ancestors in #94A3B8, current page in #F8FAFC
- Bento grid: grid-cols-12 gap-4 p-6 (collapse to grid-cols-1 on mobile)
- Show DashboardSkeleton while data loads (Suspense boundary)
- Stagger card entrance: each card fades in from y:12 with 60ms delay per card

Include: total tokens hero card (col-span-4), tier card (col-span-4), eligibility card (col-span-4).
Use server component for data fetch. Client component only for count-up animation.
```

### Pattern D — Skeleton Screen

```
Generate a skeleton screen for [COMPONENT NAME] that:
- Mirrors the exact layout/spacing of the real component
- Uses base color rgba(255,255,255,0.06) with shimmer animation
- Shimmer: linear-gradient sweep from right to left, 1.8s infinite
- Border radius matches real component shapes
- Includes role="status" aria-label="Loading [content description]" aria-busy="true"
- No text, no spinners — only geometric block shapes
```

### Pattern E — Status Badge / Chip

```
Create a RedemptionStatusChip component for statuses:
Draft | Pending Verification | Verified | Rejected | Purchased | Pickup Scheduled | Completed | Cancelled

Each status has:
- Unique background (low-opacity colored tint on dark base)
- Matching text color (desaturated version of same hue)
- border-radius: 9999px, padding: 2px 10px, font-size: 12px, font-weight: 500
- UPPERCASE text with 0.06em letter-spacing
- No transitions needed (static display chip)
- Screen reader: role="status" aria-label="Status: [value]"
```

---

## Appendix: Quick Reference Cheat Sheet

```
COLOR           VALUE
────────────────────────────────────────────────────
Background      #1E2938
Surface card    rgba(45,55,72,0.25) + blur(16px)
Primary text    #F8FAFC
Secondary text  #94A3B8
Accent / CTA    #6BCE53
Accent hover    #57B241
Accent glow     rgba(107,206,83,0.30)
Brand blue      #063175
Error           #EF4444
Card border     rgba(255,255,255,0.10)

MOTION          VALUE
────────────────────────────────────────────────────
Spring          cubic-bezier(0.34, 1.56, 0.64, 1)
Smooth          cubic-bezier(0.4, 0, 0.2, 1)
Hover duration  0.25s
Active duration 0.08s
Skeleton cycle  1.8s

FONT            USE
────────────────────────────────────────────────────
Syne            Headings, labels, buttons
DM Sans         Body text, table cells, descriptions
JetBrains Mono  Token numbers, codes, stats

RADIUS          VALUE
────────────────────────────────────────────────────
sm              6px  (badges, chips)
md              10px (buttons, inputs)
lg              16px (bento cards)
xl              20px (modals, drawers)
full            9999px (status chips, avatars)
```

---

*This document is the single source of design truth for the Berijalan Loyalty Portal. When in doubt: glass over solid, green for action, numbers above the fold.*
