---
description: Apply the high-end 'Factory' dark aesthetic (Orange/Zinc) to a Next.js/Tailwind project.
---

# Factory UI Design System

This workflow applies a premium, "agent-native" aesthetic characterized by deep black backgrounds, technical typography, and vibrant orange accents.

## 1. Core Design Principles
- **Theme**: Ultra-dark (Zinc 950/Black) with high contrast.
- **Primary Color**: Vibrant Orange (`#ea580c`) for actions and highlights.
- **Typography**: Sans-serif for main text (Geist/Inter), Monospace for data/labels (Geist Mono/JetBrains Mono).
- **Components**: Minimal, transparent backgrounds with subtle borders. No heavy shadows.
- **Vibe**: Technical, precise, "software for software".

## 2. CSS Variables (`globals.css`)

Replace the `:root` and `.dark` variables in `src/app/globals.css` with this palette:

```css
:root {
  --radius: 0.625rem;
  --background: #050505;
  --foreground: #fafafa;
  --card: #0a0a0a;
  --card-foreground: #fafafa;
  --popover: #0a0a0a;
  --popover-foreground: #fafafa;
  --primary: #ea580c; /* Orange-600 */
  --primary-foreground: #fafafa;
  --secondary: #27272a;
  --secondary-foreground: #fafafa;
  --muted: #27272a;
  --muted-foreground: #a1a1aa;
  --accent: #27272a;
  --accent-foreground: #fafafa;
  --destructive: #7f1d1d;
  --border: #27272a;
  --input: #27272a;
  --ring: #ea580c;
  --chart-1: #ea580c;
  --chart-2: #27272a;
  --chart-3: #52525b;
  --chart-4: #71717a;
  --chart-5: #a1a1aa;
  --sidebar: #050505;
  --sidebar-foreground: #fafafa;
  --sidebar-primary: #ea580c;
  --sidebar-primary-foreground: #fafafa;
  --sidebar-accent: #27272a;
  --sidebar-accent-foreground: #fafafa;
  --sidebar-border: #27272a;
  --sidebar-ring: #ea580c;
}

.dark {
  /* Same as root for this specific dark-first theme */
  --background: #050505;
  --foreground: #fafafa;
  --card: #0a0a0a;
  --card-foreground: #fafafa;
  --popover: #0a0a0a;
  --popover-foreground: #fafafa;
  --primary: #ea580c;
  --primary-foreground: #fafafa;
  --secondary: #27272a;
  --secondary-foreground: #fafafa;
  --muted: #27272a;
  --muted-foreground: #a1a1aa;
  --accent: #27272a;
  --accent-foreground: #fafafa;
  --destructive: #7f1d1d;
  --border: #27272a;
  --input: #27272a;
  --ring: #ea580c;
  --chart-1: #ea580c;
  --chart-2: #27272a;
  --chart-3: #52525b;
  --chart-4: #71717a;
  --chart-5: #a1a1aa;
  --sidebar: #050505;
  --sidebar-foreground: #fafafa;
  --sidebar-primary: #ea580c;
  --sidebar-primary-foreground: #fafafa;
  --sidebar-accent: #27272a;
  --sidebar-accent-foreground: #fafafa;
  --sidebar-border: #27272a;
  --sidebar-ring: #ea580c;
}
```

## 3. Component Styling Guidelines

### Buttons
- Use `font-mono` for technical actions.
- Uppercase text with `tracking-wider`.
- Minimal borders or solid primary colors.
- Example: `className="font-mono text-xs uppercase tracking-wider h-12 bg-primary hover:bg-primary/90"`

### Cards
- Transparent or semi-transparent backgrounds (`bg-card/50 backdrop-blur-sm`).
- Subtle borders (`border-primary/10`).
- Hover effects that glow (`hover:border-primary/30`).

### Typography
- **Headings**: Large, bold, tracking-tight (`text-5xl font-bold tracking-tighter`).
- **Labels**: Small, mono, uppercase (`text-xs font-mono uppercase tracking-widest text-muted-foreground`).
- **Accents**: Use the primary color for periods, carets, or status dots.

## 4. Reusable Prompt Template

Use this prompt to apply this style to other projects:

> "Revamp the UI to match a 'Factory' technical aesthetic.
> 
> **Design Rules:**
> 1. **Color Palette**: Use a deep dark theme (#050505 background) with a vibrant Orange (#ea580c) primary accent. Use Zinc (#27272a) for borders and secondary elements.
> 2. **Typography**: Use a Sans-serif (Geist/Inter) for headings and body, but strictly use Monospace (Geist Mono) for all data, labels, buttons, and small UI elements.
> 3. **Components**:
>    - **Cards**: Minimal, `bg-card/50`, `backdrop-blur-sm`, with subtle `border-primary/10`.
>    - **Buttons**: Uppercase, `tracking-wider`, `font-mono`, square or slightly rounded corners.
>    - **Badges**: Outline style, mono font, colored dot indicators.
> 4. **Layout**: Spacious, using large typography for page titles (e.g., text-6xl tracking-tighter).
> 5. **Vibe**: Professional, developer-focused, 'agent-native', high-performance."

## 5. Status Colors (Reference)
- **Active/Positive**: Orange shades (`#ea580c`, `#f97316`, `#fb923c`)
- **Neutral/Inactive**: Zinc shades (`#a1a1aa`, `#3f3f46`, `#27272a`)
