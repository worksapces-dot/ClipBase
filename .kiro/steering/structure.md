# Project Structure

```
clipblaze/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with fonts and metadata
│   │   ├── page.tsx            # Landing page (composes section components)
│   │   ├── globals.css         # Global styles, CSS variables, custom animations
│   │   └── favicon.ico
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui primitives (button, card, badge, etc.)
│   │   ├── icons.tsx           # Custom SVG icon components
│   │   ├── navbar.tsx          # Navigation header
│   │   ├── hero.tsx            # Hero section
│   │   ├── features.tsx        # Features grid
│   │   ├── how-it-works.tsx    # Process steps
│   │   ├── stats.tsx           # Statistics section
│   │   ├── cta.tsx             # Call-to-action section
│   │   └── footer.tsx          # Footer
│   │
│   └── lib/
│       └── utils.ts            # cn() helper for className merging
│
├── public/                     # Static assets
├── components.json             # shadcn/ui configuration
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── eslint.config.mjs           # ESLint flat config
└── postcss.config.mjs          # PostCSS configuration
```

## Architecture Patterns

### Component Organization
- **Page components**: Compose section components in `app/page.tsx`
- **Section components**: Self-contained landing page sections in `components/`
- **UI primitives**: Reusable shadcn/ui components in `components/ui/`
- **Icons**: Custom SVG icons as React components in `components/icons.tsx`

### Styling Conventions
- Use `cn()` utility for conditional/merged classNames
- Glass morphism effects via `.glass-card` utility class
- Custom animations defined in `globals.css` (float, pulse-glow, gradient-shift)
- Semantic color tokens via CSS custom properties

### Client Components
- Mark interactive components with `"use client"` directive
- Keep server components as default where possible
