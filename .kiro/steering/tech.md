# Tech Stack & Build System

## Core Framework
- Next.js 16 (App Router with React Server Components)
- React 19
- TypeScript 5 (strict mode enabled)

## Styling
- Tailwind CSS 4 with PostCSS
- tw-animate-css for animations
- CSS custom properties for theming (oklch color space)
- Dark theme by default

## UI Components
- shadcn/ui (new-york style variant)
- Radix UI primitives (@radix-ui/react-separator, @radix-ui/react-slot)
- class-variance-authority (cva) for component variants
- lucide-react for icons (supplemented with custom SVG icons)

## Utilities
- clsx + tailwind-merge via `cn()` helper in `@/lib/utils`

## Development Tools
- ESLint 9 with next/core-web-vitals and next/typescript configs
- Geist font family (sans and mono)

## Common Commands
```bash
# Development
npm run dev      # Start dev server at localhost:3000

# Production
npm run build    # Build for production
npm run start    # Start production server

# Code Quality
npm run lint     # Run ESLint
```

## Path Aliases
- `@/*` maps to `./src/*`
