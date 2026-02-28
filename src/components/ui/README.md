# UI Components

This directory contains reusable UI components built with the design system.

## Available Components

### Button
A flexible button component with multiple variants and sizes.

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' (default: 'primary')
- `size`: 'sm' | 'base' | 'lg' (default: 'base')
- `type`: 'button' | 'submit' | 'reset' (default: 'button')
- `href`: Optional URL for link-style buttons
- `class`: Additional CSS classes

**Usage:**
```astro
---
import Button from '@/components/ui/Button.astro';
---

<Button variant="primary">Click me</Button>
<Button variant="outline" size="lg">Large button</Button>
<Button href="/about">Link button</Button>
```

### Card
A container component for grouping content with consistent styling.

**Props:**
- `padding`: 'sm' | 'base' | 'lg' (default: 'base')
- `shadow`: 'none' | 'sm' | 'base' | 'md' | 'lg' (default: 'sm')
- `class`: Additional CSS classes

**Usage:**
```astro
---
import Card from '@/components/ui/Card.astro';
---

<Card>
  <h2>Card Title</h2>
  <p>Card content goes here.</p>
</Card>

<Card padding="lg" shadow="md">
  <p>Larger card with more shadow.</p>
</Card>
```

### Container
A responsive container for page content with max-width constraints.

**Props:**
- `size`: 'sm' | 'md' | 'lg' (default: 'lg')
- `class`: Additional CSS classes

**Usage:**
```astro
---
import Container from '@/components/ui/Container.astro';
---

<Container>
  <h1>Page content</h1>
  <p>Automatically centered and constrained to max-width.</p>
</Container>

<Container size="sm">
  <p>Narrower container for focused content.</p>
</Container>
```

### Logo
The Sound of Simone wordmark logo with distinctive parallel vertical lines.

**Props:**
- `size`: 'sm' | 'base' | 'lg' | 'xl' (default: 'base')
- `color`: CSS color value (default: '#411e25' - brand burgundy)
- `class`: Additional CSS classes
- `ariaLabel`: Accessibility label (default: 'Sound of Simone')

**Usage:**
```astro
---
import Logo from '@/components/ui/Logo.astro';
---

<Logo />
<Logo size="lg" />
<Logo color="#ffffff" />
```

### WaveAnimation
An SVG-based wave component used in demos and secondary UI contexts.

**Props:**
- `size`: 'sm' | 'base' | 'lg' | 'xl' (default: 'base')
- `color`: CSS color for wave bars (default: '#411e25')
- `ringColor`: CSS color for circle ring (default: '#411e25')
- `animationSpeed`: 'slow' | 'normal' | 'fast' (default: 'normal')
- `class`: Additional CSS classes
- `ariaLabel`: Accessibility label (default: 'Sound wave animation')

**Features:**
- Organic, energetic pulse animation
- Respects `prefers-reduced-motion` user preference
- Includes hover and focus states for future button use
- Unique clip path IDs to avoid conflicts

**Usage:**
```astro
---
import WaveAnimation from '@/components/ui/WaveAnimation.astro';
---

<WaveAnimation />
<WaveAnimation size="lg" animationSpeed="fast" />
<WaveAnimation color="#ffffff" ringColor="#ffffff" />
```

### WaveContactButton
Primary wave component for the homepage/navigation. It embeds `public/wave-simone.html` in an iframe and supports animated or static mode.

**Props:**
- `href`: URL target (default from `WAVE_CONTACT_TARGET`)
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `mode`: 'animated' | 'static' (default: 'animated')
- `label`: Accessible label text
- `class`: Additional CSS classes

**Usage:**
```astro
---
import WaveContactButton from '@/components/ui/WaveContactButton.astro';
---

<WaveContactButton mode="animated" />
<WaveContactButton size="sm" mode="static" />
```

## Creating New Components

When creating new UI components:

1. Use design system tokens from `/src/styles/design-tokens.css`
2. Accept a `class` prop for extensibility
3. Document props and usage in this README
4. Export from `index.ts` for easy imports
5. Follow the naming convention: PascalCase for component names

## Component Guidelines

- **Single Responsibility**: Each component should have one clear purpose
- **Composability**: Components should work well together
- **Accessibility**: Include proper ARIA labels and keyboard navigation
- **Responsive**: Components should work on all screen sizes
- **Design System**: Use design tokens for consistency

## Future Components

Consider adding:
- Navigation components (Header, Nav, Menu)
- Form components (Input, Textarea, Select)
- Layout components (Grid, Stack, Spacer)
- Feedback components (Alert, Toast, Modal)
- Typography components (Heading, Text, Link)
