# Implement Skeleton Loading UI

Implement a polished **Skeleton Loading System** throughout the application. The goal is to replace unnecessary full-page spinners and generic `"Loading..."` text with skeleton placeholders that closely match the final content layout.

## Requirements

### 1. Skeleton-first loading

* Replace full-page spinners wherever content is being fetched.
* Do **not** display `"Loading..."` for normal content loading.
* Use skeleton placeholders that preserve the page structure while data is loading.
* The skeleton should visually resemble the actual component it represents.

### 2. Skeleton components

Create reusable skeleton components such as:

* `CardSkeleton`
* `ListSkeleton`
* `TableSkeleton`
* `ProfileSkeleton`
* `DashboardSkeleton`
* `TextSkeleton`
* `ImageSkeleton`
* `ButtonSkeleton`

Make the components configurable so they can be reused across the application.

### 3. Layout matching

For example, if the final UI contains:

* A heading
* A paragraph
* Three cards
* An image
* Multiple lines of text

The loading state should preserve approximately the same spacing, dimensions, and layout.

Example:

```text
┌─────────────────────────────┐
│ ▓▓▓▓▓▓▓▓                   │
│ ▓▓▓▓▓▓▓▓▓▓▓                │
│                             │
│ ▓▓▓▓▓▓  ▓▓▓▓▓▓  ▓▓▓▓▓▓     │
│                             │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓           │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓           │
└─────────────────────────────┘
```

### 4. Animation

Use a subtle shimmer/pulse animation:

* Smooth and lightweight
* Not distracting
* Respect `prefers-reduced-motion`
* Avoid excessive animation that causes performance issues

### 5. UX behavior

* Preserve the page layout while loading to minimize layout shift.
* Show skeletons only for the content that is actually loading.
* Avoid blocking the entire page when only a small component is loading.
* For small actions such as submitting a form or clicking a button, use an appropriate inline loading state instead of replacing the whole page with a spinner.
* Existing loaded content should remain visible while unrelated content loads.

### 6. Responsive design

Skeletons must work correctly on:

* Mobile
* Tablet
* Desktop

They should automatically adapt to the same responsive breakpoints as the real components.

### 7. Accessibility

* Do not make skeleton placeholders appear as meaningful content to screen readers.
* Use appropriate `aria-busy` / accessibility semantics where necessary.
* Ensure reduced-motion users do not receive animated shimmer effects.

### 8. Visual design

Match the application's existing:

* Colors
* Border radius
* Spacing
* Typography dimensions
* Card styles
* Shadows
* Responsive behavior

The skeleton should feel like the same UI in an unfinished/loading state—not a separate design.

### 9. Implementation

First inspect the existing application and identify all places where:

* Full-page loading spinners are used
* `"Loading..."` text is displayed
* Async data is fetched
* Content appears after API calls
* Components cause layout shifts

Then implement the skeleton system consistently across those areas.

Do not unnecessarily rewrite unrelated code.

## Acceptance Criteria

The implementation is complete when:

* No unnecessary full-page spinner is used for normal data fetching.
* Generic `"Loading..."` messages are replaced with contextual skeletons.
* Skeletons closely match the final content layout.
* Loading does not cause significant layout shifts.
* Skeletons are responsive.
* Animations are subtle and accessible.
* Components are reusable and maintainable.
* Existing application functionality remains unchanged.

## Hackathon-quality requirement

Make the implementation feel **production-ready**, not like a basic demo. Prioritize perceived performance, visual consistency, accessibility, and a polished user experience.

After implementation, provide a concise summary of:

1. Files/components changed
2. Skeleton components created
3. Loading states replaced
4. Any architectural decisions made
5. How to test the loading states
