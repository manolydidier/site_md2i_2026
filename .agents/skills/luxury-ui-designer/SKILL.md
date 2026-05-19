---
name: luxury-ui-designer
description: Use this skill when building or redesigning frontend UI in React, Next.js, Vite, or similar web apps. Trigger for requests involving beautiful interfaces, premium UI, advanced UI design, landing pages, dashboards, SaaS pages, portfolio pages, animations, Framer Motion, Motion for React, Tailwind CSS, shadcn/ui, Radix UI, modern components, refined visual hierarchy, micro-interactions, responsive design, or high-end product design.
---

# Luxury UI Designer

Use this skill to create production-quality frontend interfaces that feel premium, modern, clean, animated, and highly polished.

## Core output standard

Always produce UI that feels:
- elegant, minimal, refined, and intentional
- visually distinctive rather than generic
- responsive across mobile, tablet, and desktop
- accessible by default
- production-ready, not demo-looking
- rich in micro-interactions without being noisy

Avoid generic SaaS templates, flat white cards everywhere, overused gradients, weak typography, random spacing, and stock-looking layouts.

## Preferred stack

When the project supports it, prefer:
- React or Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui or Radix primitives
- Motion for React, imported with `import { motion, AnimatePresence } from "motion/react"`
- Lucide React for icons
- CSS variables for themes
- componentized architecture

If the existing project already uses `framer-motion`, keep using the existing dependency and import style unless the user asks to migrate.

## Dependency handling

Before adding dependencies, inspect the project:
- package manager: npm, pnpm, yarn, or bun
- framework: Next.js, Vite, Remix, Astro, etc.
- styling system: Tailwind, CSS modules, vanilla CSS, styled-components, etc.
- existing component library

If Motion is missing and the project can install packages, propose or apply:
```bash
npm install motion
```
