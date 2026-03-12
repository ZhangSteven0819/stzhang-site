# Design System Quick Reference

Quick reference for the most commonly used design tokens and utility classes.

## Colors

### CSS Variables
```css
/* Primary */
var(--color-primary)       /* #0284c7 */
var(--color-primary-700)   /* Darker */
var(--color-primary-400)   /* Lighter */

/* Text */
var(--color-text-primary)    /* #171717 */
var(--color-text-secondary)  /* #525252 */
var(--color-text-muted)      /* #737373 */

/* Background */
var(--color-bg-primary)      /* #ffffff */
var(--color-bg-secondary)    /* #f5f5f5 */

/* Semantic */
var(--color-success)  /* #22c55e */
var(--color-warning)  /* #f59e0b */
var(--color-error)    /* #ef4444 */
var(--color-info)     /* #3b82f6 */
```

## Typography

### Font Sizes
```css
var(--font-size-sm)    /* 14px */
var(--font-size-base)  /* 16px */
var(--font-size-lg)    /* 18px */
var(--font-size-xl)    /* 20px */
var(--font-size-2xl)   /* 24px */
var(--font-size-3xl)   /* 30px */
var(--font-size-4xl)   /* 36px */
```

### Utility Classes
```html
<h1 class="text-4xl font-bold">Large Heading</h1>
<p class="text-lg text-secondary">Body text</p>
<span class="text-sm text-muted">Small text</span>
```

## Spacing

### Common Spacing Values
```css
var(--space-2)   /* 8px */
var(--space-4)   /* 16px */
var(--space-6)   /* 24px */
var(--space-8)   /* 32px */
var(--space-12)  /* 48px */
```

### Utility Classes
```html
<!-- Padding -->
<div class="p-4">Padding all sides</div>
<div class="px-4 py-8">Horizontal and vertical padding</div>

<!-- Margin -->
<div class="mt-8 mb-4">Top and bottom margin</div>
<div class="mx-auto">Centered</div>

<!-- Gap (for flex/grid) -->
<div class="flex gap-4">Items with gap</div>
```

## Layout

### Container
```html
<div class="container">
  <!-- Max-width content, centered, with padding -->
</div>

<div class="container-sm">
  <!-- Narrower container -->
</div>
```

### Flexbox
```html
<div class="flex items-center justify-between gap-4">
  <div>Left</div>
  <div>Right</div>
</div>

<div class="flex flex-col items-center gap-6">
  <!-- Vertical stack -->
</div>
```

## Components

### Buttons
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-outline">Outline</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary btn-lg">Large</button>
```

### Cards
```html
<div class="card">
  <h3 class="text-xl font-bold mb-2">Title</h3>
  <p class="text-secondary">Content</p>
</div>
```

## Borders & Shadows

### Border Radius
```html
<div class="rounded">Base radius</div>
<div class="rounded-lg">Large radius</div>
<div class="rounded-full">Fully rounded</div>
```

### Shadows
```html
<div class="shadow">Base shadow</div>
<div class="shadow-md">Medium shadow</div>
<div class="shadow-lg">Large shadow</div>
```

## Common Patterns

### Hero Section
```html
<section class="container py-16">
  <div class="flex flex-col items-center gap-6 text-center">
    <h1 class="text-4xl font-bold">Hero Title</h1>
    <p class="text-xl text-secondary">Subtitle text</p>
    <button class="btn btn-primary btn-lg">Call to Action</button>
  </div>
</section>
```

### Content Card
```html
<div class="card">
  <h2 class="text-2xl font-bold mb-4">Card Title</h2>
  <p class="text-secondary mb-6">
    Card description goes here.
  </p>
  <button class="btn btn-primary">Learn More</button>
</div>
```

### Two-Column Layout
```html
<div class="container">
  <div class="flex gap-8">
    <div class="flex-1">
      <h3 class="text-xl font-bold mb-4">Column 1</h3>
      <p class="text-secondary">Content</p>
    </div>
    <div class="flex-1">
      <h3 class="text-xl font-bold mb-4">Column 2</h3>
      <p class="text-secondary">Content</p>
    </div>
  </div>
</div>
```

### Form Field
```html
<div class="mb-4">
  <label class="block font-medium mb-2">Label</label>
  <input 
    type="text"
    class="w-full p-3 border rounded-lg"
    style="border-color: var(--color-border-medium)"
  />
</div>
```

## Responsive Design

### Breakpoints
- **sm**: 640px
- **md**: 768px  
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Media Queries
```css
@media (min-width: 768px) {
  /* md and up */
}

@media (min-width: 1024px) {
  /* lg and up */
}
```

## Tips

1. **Start with utilities**: Use utility classes first, custom CSS second
2. **Be consistent**: Use design tokens, not random values
3. **Mobile first**: Design for mobile, enhance for desktop
4. **Semantic HTML**: Use proper HTML elements for accessibility
5. **Component thinking**: Build reusable components for repeated patterns
