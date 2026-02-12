# Responsive Design Implementation

This document outlines the responsive design improvements for mobile, tablet, and desktop viewports.

## Breakpoints

Following Tailwind CSS defaults:
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md - lg)
- **Desktop**: > 1024px (xl)

## Implemented Improvements

### 1. Mobile Navigation

**Component**: `apps/web/src/components/layout/mobile-nav.tsx`

- Hamburger menu for mobile devices
- Slide-out navigation drawer
- Active route highlighting
- Automatic close on navigation

**Usage**:
```tsx
import { MobileNav } from '@/components/layout/mobile-nav';

<header className="flex items-center justify-between p-4">
  <MobileNav />
  <Logo />
  <UserMenu />
</header>
```

### 2. Responsive Grids

**Dashboard Stats**:
```tsx
// Before
className="grid gap-4 md:grid-cols-4"

// After
className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
```

**Application Cards**:
```tsx
className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

### 3. Tables to Cards on Mobile

For data-heavy tables, convert to cards on mobile:

```tsx
{/* Desktop: Table */}
<div className="hidden md:block overflow-x-auto">
  <table className="w-full">
    {/* table content */}
  </table>
</div>

{/* Mobile: Cards */}
<div className="md:hidden space-y-3">
  {items.map(item => (
    <Card key={item.id}>
      {/* card content */}
    </Card>
  ))}
</div>
```

### 4. Dialog Scrolling

All dialogs now support scrolling on small screens:

```tsx
<DialogContent className="max-h-[90vh] overflow-y-auto max-w-[95vw] sm:max-w-[500px]">
  {content}
</DialogContent>
```

### 5. Form Layouts

Forms stack vertically on mobile:

```tsx
<div className="grid gap-4 grid-cols-1 md:grid-cols-2">
  <FormField name="firstName" />
  <FormField name="lastName" />
</div>
```

### 6. Button Groups

Buttons stack on mobile, inline on desktop:

```tsx
<div className="flex flex-col sm:flex-row gap-2">
  <Button>Primary</Button>
  <Button variant="outline">Secondary</Button>
</div>
```

### 7. Typography

Responsive text sizes:

```tsx
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Title
</h1>

<p className="text-sm sm:text-base">
  Body text
</p>
```

### 8. Spacing

Consistent padding/margin across breakpoints:

```tsx
<div className="p-4 sm:p-6 lg:p-8">
  {content}
</div>
```

### 9. Charts

Responsive chart heights:

```tsx
<ResponsiveContainer
  width="100%"
  height={250}
  className="sm:h-[300px] lg:h-[350px]"
>
  {chart}
</ResponsiveContainer>
```

### 10. Images

Responsive images:

```tsx
<div className="relative aspect-video w-full">
  <Image
    src={src}
    alt={alt}
    fill
    className="object-cover"
  />
</div>
```

## Component-Specific Guidelines

### Dashboard

```tsx
// Stats cards: 1 column mobile, 2 tablet, 4 desktop
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

// Charts: Full width mobile, 2 columns tablet+
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
```

### Application List

```tsx
// Show table on desktop, cards on mobile
<div className="hidden md:block">
  <ApplicationTable />
</div>
<div className="md:hidden">
  <ApplicationCards />
</div>
```

### Job Search Results

```tsx
// Cards stack on mobile
<div className="space-y-3 w-full">
  {results.map(job => (
    <JobCard key={job.id} {...job} />
  ))}
</div>
```

### Settings Pages

```tsx
// Side navigation becomes tabs on mobile
<div className="flex flex-col md:flex-row gap-6">
  <aside className="w-full md:w-64">
    <SettingsNav />
  </aside>
  <main className="flex-1">
    <SettingsContent />
  </main>
</div>
```

## Testing Responsive Design

### Manual Testing

Test on these viewport sizes:

1. **Mobile Portrait**: 375x667 (iPhone SE)
2. **Mobile Landscape**: 667x375
3. **Tablet Portrait**: 768x1024 (iPad)
4. **Tablet Landscape**: 1024x768
5. **Desktop**: 1280x720
6. **Large Desktop**: 1920x1080

### Chrome DevTools

1. Open DevTools (F12)
2. Click device toolbar icon (Cmd/Ctrl + Shift + M)
3. Select device or enter custom dimensions
4. Test interactions at each breakpoint

### Responsive Design Checklist

- [ ] No horizontal scrolling on any viewport
- [ ] Touch targets >= 44x44px on mobile
- [ ] Text readable without zooming (16px minimum)
- [ ] Forms usable with on-screen keyboard
- [ ] Images load and scale properly
- [ ] Navigation accessible on all devices
- [ ] Dialogs/modals fit viewport
- [ ] Tables convert to cards on mobile
- [ ] Charts responsive and readable
- [ ] Spacing consistent across breakpoints

## Common Patterns

### Hide/Show by Breakpoint

```tsx
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>
<div className="hidden sm:block lg:hidden">Tablet only</div>
```

### Conditional Flex Direction

```tsx
<div className="flex flex-col md:flex-row gap-4">
```

### Responsive Width

```tsx
<div className="w-full md:w-2/3 lg:w-1/2">
```

### Container Queries (Future)

When container queries are fully supported:

```tsx
<div className="@container">
  <div className="@md:grid-cols-2">
```

## Accessibility Notes

1. **Touch Targets**: Minimum 44x44px for interactive elements
2. **Font Sizes**: Base 16px, never smaller than 14px
3. **Color Contrast**: Maintain WCAG AA standards
4. **Focus Visible**: Ensure keyboard navigation works on all viewports
5. **Screen Readers**: Test with mobile screen readers

## Performance

1. **Images**: Use next/image with responsive sizes
2. **Lazy Loading**: Load below-fold content lazily
3. **Code Splitting**: Split mobile/desktop specific code
4. **CSS**: Minimize unused Tailwind classes

## Resources

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Material Design Breakpoints](https://material.io/design/layout/responsive-layout-grid.html)
