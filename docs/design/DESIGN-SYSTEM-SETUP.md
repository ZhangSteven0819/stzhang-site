# Design System Setup Guide

This document describes the design system foundation that has been set up for the Sound of Simone project.

## What's Been Added

The repository is now ready to receive design work with a complete design system foundation including:

### 1. Design Tokens (`src/styles/design-tokens.css`)
A comprehensive set of CSS custom properties defining:
- **Color palette**: Primary, neutral, semantic colors with full scales
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Consistent spacing scale (4px increments)
- **Borders**: Widths and radius values
- **Shadows**: Box shadow definitions
- **Transitions**: Timing and easing functions
- **Z-index**: Layering system

### 2. Global Styles (`src/styles/global.css`)
Base styling and resets:
- Modern CSS reset
- Semantic element styling (headings, paragraphs, links, lists, etc.)
- Consistent typography scales
- Accessibility features (focus states, reduced motion support)
- Responsive images and forms

### 3. Utility Classes (`src/styles/utilities.css`)
Ready-to-use utility classes for rapid development:
- Layout utilities (flex, grid, containers)
- Spacing utilities (margin, padding)
- Typography utilities (sizes, weights, colors)
- Display utilities
- Button styles (primary, secondary, outline variants)
- Card components
- Responsive utilities

### 4. TypeScript Configuration (`src/styles/design-system.ts`)
Programmatic access to design tokens for use in TypeScript/JavaScript code.

### 5. UI Components (`src/components/ui/`)
Base reusable components:
- **Button**: Flexible button with multiple variants and sizes
- **Card**: Container for content grouping
- **Container**: Responsive page container with max-width

### 6. Documentation
- `/src/styles/README.md`: Complete design system documentation
- `/src/components/ui/README.md`: UI components usage guide

## Integration

The design system is automatically loaded through the updated `Layout.astro`:

```astro
---
import '../styles/design-tokens.css';
import '../styles/global.css';
import '../styles/utilities.css';
---
```

All pages using `Layout.astro` now have access to:
- CSS custom properties (design tokens)
- Global base styles
- Utility classes
- UI components

## Usage Examples

### Using Design Tokens

```astro
<style>
  .my-component {
    color: var(--color-primary);
    padding: var(--space-4) var(--space-6);
    border-radius: var(--border-radius-lg);
    font-size: var(--font-size-lg);
    transition: all var(--transition-base) var(--ease-out);
  }
</style>
```

### Using Utility Classes

```astro
<div class="container py-8">
  <div class="flex flex-col gap-4 items-center">
    <h1 class="text-4xl font-bold text-primary">Welcome</h1>
    <p class="text-lg text-secondary text-center">
      This is styled with utility classes.
    </p>
    <button class="btn btn-primary">Get Started</button>
  </div>
</div>
```

### Using UI Components

```astro
---
import Button from '@/components/ui/Button.astro';
import Card from '@/components/ui/Card.astro';
import Container from '@/components/ui/Container.astro';
---

<Container>
  <Card>
    <h2 class="text-2xl font-bold mb-4">Card Title</h2>
    <p class="mb-4">Card content goes here.</p>
    <Button variant="primary">Learn More</Button>
  </Card>
</Container>
```

## Customization

To customize the design system for your brand:

1. **Update Colors**: Edit color values in `src/styles/design-tokens.css`
2. **Update Typography**: Modify font families, sizes, and weights in design tokens
3. **Add Components**: Create new components in `src/components/ui/`
4. **Extend Utilities**: Add new utility classes in `src/styles/utilities.css`

## Design Workflow

### For Designers:
1. Use the design tokens as your source of truth for colors, spacing, and typography
2. Components should align with the provided tokens
3. New design elements should fit within the existing system or extend it

### For Developers:
1. Use design tokens instead of hard-coded values
2. Prefer utility classes for common patterns
3. Create reusable components for repeated UI elements
4. Keep design tokens and components in sync

## Compatibility

✅ **Astro**: All styles work with Astro's component system
✅ **Decap CMS**: Content managed by CMS will use global styles
✅ **Cloudflare Pages**: Pure CSS, no build-time dependencies required
✅ **TypeScript**: Design tokens available programmatically

## Next Steps for Design Implementation

1. **Brand Customization**:
   - Update primary colors to match your brand
   - Set custom font families if needed
   - Adjust spacing and sizing scales

2. **Component Development**:
   - Add navigation components (Header, Nav)
   - Create form components (Input, Select, etc.)
   - Build layout components (Grid, Stack)

3. **Page Layouts**:
   - Design homepage layout
   - Create blog post template
   - Build about page design

4. **Theme Features**:
   - Consider dark mode support
   - Add animation utilities if needed
   - Create specialized components for your content

## File Structure

```
src/
├── styles/
│   ├── design-tokens.css    # CSS custom properties
│   ├── global.css           # Global styles and resets
│   ├── utilities.css        # Utility classes
│   ├── design-system.ts     # TypeScript config
│   └── README.md            # Design system docs
├── components/
│   ├── ui/
│   │   ├── Button.astro     # Button component
│   │   ├── Card.astro       # Card component
│   │   ├── Container.astro  # Container component
│   │   ├── index.ts         # Component exports
│   │   └── README.md        # Component docs
│   └── Welcome.astro        # Existing component
└── layouts/
    └── Layout.astro         # Base layout (updated)
```

## Best Practices

1. **Use Design Tokens**: Always use CSS custom properties for values
2. **Component Composition**: Build complex UIs from simple components
3. **Utility First**: Use utility classes before writing custom CSS
4. **Accessibility**: Ensure proper focus states and keyboard navigation
5. **Performance**: Leverage utility classes for optimal CSS reuse
6. **Documentation**: Document new components and patterns

## Support

For questions or issues with the design system:
- Check `/src/styles/README.md` for design token reference
- Check `/src/components/ui/README.md` for component usage
- Review existing components for patterns and examples

## Testing

Build the project to ensure compatibility:
```bash
npm run build
```

Start the dev server to preview changes:
```bash
npm run dev
```

Visit `http://localhost:4321` to see the site.
