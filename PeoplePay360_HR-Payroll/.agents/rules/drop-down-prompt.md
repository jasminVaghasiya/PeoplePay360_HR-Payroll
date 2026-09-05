🎨 PRODUCTION-READY DROPDOWN UI RULE

Whenever you create, modify, or improve a dropdown/select component in this project, make it feel modern, premium, responsive, accessible, and production-ready.

1. GENERAL DESIGN

Every dropdown should have:

- Clean modern appearance
- Consistent spacing
- Proper typography
- Rounded corners matching the project's design system
- Clear hover states
- Clear selected state
- Clear focus state
- Smooth open/close animation
- Proper alignment with the trigger
- No visual overflow outside the viewport
- Responsive behavior on desktop, tablet, and mobile

Do NOT introduce a completely different visual language from the existing application.

Reuse the project's existing:

- Colors
- Typography
- Border radius
- Shadows
- Spacing
- Design tokens
- Components
- Theme/dark mode

---

2. 📋 OPTION COUNT RULE

If the dropdown contains only a small number of options:

1–8 options

show them normally without unnecessary search.

If the dropdown contains many options:

9+ options

automatically provide a search/filter field at the top of the dropdown.

Example:

┌─────────────────────────────┐
│ 🔍 Search options...        │
├─────────────────────────────┤
│ Option 1                    │
│ Option 2                    │
│ Option 3                    │
│ Option 4                    │
│ Option 5                    │
│ Option 6                    │
│ Option 7                    │
│ Option 8                    │
│ Option 9                    │
└─────────────────────────────┘

The search should filter options instantly as the user types.

---

3. 🔎 SEARCH BEHAVIOR

Search must:

- Be fast
- Be case-insensitive
- Ignore unnecessary whitespace
- Filter by meaningful option text
- Preserve keyboard navigation
- Show a clear "No results found" state
- Provide a clear/reset action when appropriate

Example:

🔍 Search department...

If there are no matches:

No departments found
Try a different search term.

Do not show an empty dropdown.

---

4. 📜 SCROLLBAR

When there are many options, the dropdown must have a controlled maximum height.

Do NOT allow a huge dropdown to cover the entire screen.

Use a reasonable max height based on the viewport.

Example:

max-height:
min(400px, calc(100vh - available-space))

The options area should scroll independently.

The search field should remain visible while scrolling.

Example:

┌──────────────────────────────┐
│ 🔍 Search...                 │ ← fixed
├──────────────────────────────┤
│ Option                       │
│ Option                       │
│ Option                       │
│ Option                       │
│ Option                       │
│ Option                       │
│                         ▌    │ ← scrollbar
│                         ▌    │
└──────────────────────────────┘

Do not use an unnecessarily thick scrollbar.

The scrollbar should visually match the application's design.

---

5. ✨ PREMIUM BORDER EFFECT

Add a subtle premium border glow/shining effect around the dropdown when the user's cursor approaches or interacts with the dropdown.

The effect must be:

- Subtle
- Smooth
- Professional
- Not distracting
- GPU-friendly
- Consistent with the application's theme

Do NOT create an excessive neon/gaming effect.

Preferred behavior:

Normal:
──────────────
   dropdown

Hover/focus:
╔══════════════╗
║   dropdown   ║
╚══════════════╝
     subtle glow

The animation should be short and subtle (150–200ms) to provide immediate feedback without causing UI lag.