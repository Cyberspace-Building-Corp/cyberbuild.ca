# cyberbuild.ca

Interactive 3D corporate website for Cyberspace Building Corp.

## Stack

- **Vite** — Build tool & dev server
- **TypeScript** — Type-safe JS
- **Three.js** — 3D scene (WebGL)
- **CSS Custom Properties** — Theming via design tokens (no Sass/Tailwind needed)
- **JSON** — Service data, graph layout, contact info

## Project Structure

```
cyberbuild-project/
├── public/                    # Static assets (favicon, og-image, etc.)
├── src/
│   ├── assets/                # Images, fonts if self-hosted
│   ├── components/            # UI components (if migrating to React later)
│   │   └── Logo.tsx           # Animated logo (React + Framer Motion)
│   ├── data/
│   │   ├── services.json      # Service definitions (label, tech, descriptions)
│   │   ├── graph-layout.json  # Node positions, edges, camera, colors
│   │   └── contact.json       # Contact info, regions
│   ├── lib/
│   │   ├── types.ts           # TypeScript interfaces
│   │   ├── icons.ts           # Canvas-based icon drawing for each service
│   │   ├── search.ts          # Search index builder & query engine
│   │   └── scene.ts           # Three.js scene setup (TODO: extract from main)
│   ├── styles/
│   │   ├── tokens.css         # Design tokens (CSS custom properties)
│   │   ├── base.css           # Reset, fonts, root sizing
│   │   ├── nav.css            # Navigation + logo animation
│   │   ├── scene.css          # Canvas, tooltip, hint
│   │   ├── overlay.css        # Service card overlay
│   │   ├── search.css         # Search results dropdown
│   │   └── main.css           # Entry point (imports all above)
│   └── main.ts                # App entry — wires everything together
├── index.html                 # Shell HTML
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Architecture Decisions

### Why not Sass?
CSS custom properties (variables) handle theming natively. Sass nesting is now
available in native CSS (`@nest` / nesting selector). For a site this size,
Sass adds build complexity with no real benefit.

### Why not Tailwind?
The cyberpunk aesthetic requires very specific custom values (colors, glows,
backdrop-filters) that don't map well to utility classes. Custom CSS with
design tokens is more expressive here.

### Why JSON over YAML for data?
JSON imports natively in TypeScript with zero parsing overhead. YAML requires
a build-time parser. For 5 services, the readability difference is negligible.
JSON is also better for interoperability if the data is consumed by other tools.

### Why Vite over Next.js?
This is a single-page site with no SSR needs, no routing, no API routes.
Vite is lighter, faster, and sufficient. If multi-page routing later, Next.js makes 
sense for that separate project.

### Future: React migration
The Logo component already exists as React + Framer Motion. When ready to
migrate the full site, the data layer (JSON), styles (CSS), and utilities
(search, icons) are all framework-agnostic and can be imported directly
into React components.

## Development

```bash
bun install
bun run dev     # Start dev server
bun run build   # Production build → dist/
bun run preview # Preview production build
```

All required dependencies and types are declared in `package.json`, so `bun install` should be enough.

## Deployment

Static site — deploy `dist/` to any CDN (Vercel, Cloudflare Pages, etc.)
```
