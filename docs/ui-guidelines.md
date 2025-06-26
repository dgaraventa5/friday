# Friday App – Consumer‑Grade UI/UX Guidelines

> **Goal:** Give Cursor (and any AI pair‑programmer) a clear, opinionated
> playbook for turning functional screens into a polished, Airbnb‑level consumer
> experience while retaining the Superhuman ethos of blinding speed and focus.

---

## 1. Design Principles

1. **Fast‐First** – every visible action should respond (<100 ms) or show
   instant feedback (skeleton, shimmer).
   ([uxdesign.cc](https://uxdesign.cc/so-youre-building-a-superhuman-of-x-b39015f3d7a6))
2. **Clarity Over Clutter** – single, obvious next action on each screen;
   progressive disclosure hides complexity until needed.
3. **Consistency** – one design system, one set of tokens (color, type, spacing)
   applied everywhere for instant "brand recall."
   ([addictaco.com](https://addictaco.com/case-study-how-airbnbs-design-system-improved-their-ux/))
4. **Accessibility by Default** – WCAG AA contrast, min 44 pt × 44 pt touch
   targets, focus rings, and semantic HTML.
   ([developer.apple.com](https://developer.apple.com/design/tips/))
5. **Delight in Micro‑moments** – subtle motion (150‑300 ms ease‑out) that
   guides, not distracts. (Apple HIG Motion)

---

## 2. Visual Language

| Token           | Example   | Usage                        |
| --------------- | --------- | ---------------------------- |
| **Primary 500** | `#2563EB` | Main CTAs, active icons      |
| **Primary 100** | `#E0ECFF` | Backgrounds, selected states |
| **Neutral 900** | `#0F172A` | Headlines                    |
| **Neutral 600** | `#475569` | Body text                    |
| **Success**     | `#16A34A` | Completed tasks              |
| **Warning**     | `#D97706` | Deadlines & errors           |

- **Typography:** Aleo (or system UI fallback) –

  - Display xl 32/40 px ‑ headline pages
  - Heading md 20/28 px
  - Body base 16/24 px

- **Grid & Spacing:** 4‑pt base (4, 8, 12, 16 …). Cards: 16 px inner padding, 8
  px corner radius, `shadow-sm`.

---

## 3. Layout & Navigation

- **Mobile‑first single column**, max‑width 600 px then progressive enhancement
  to two‑pane (list / detail) on ≥1024 px.
- **Sticky bottom nav** with 3 core destinations (Today, Schedule, Add). Use FAB
  only when a one‑hand reach study shows advantage.
- **Safe‑area insets** accounted for iOS & Android.
- **Viewport Height Optimization**: All pages should fit within the viewport
  without scrolling (except SchedulePage). Use the `PageLayout` component for
  consistent implementation.

### PageLayout Component

For all new pages, use the `PageLayout` component to ensure they fit within the
viewport:

```tsx
import { PageLayout } from '../components/PageLayout';

export function YourNewPage() {
  return (
    <PageLayout title="Your Page Title">
      {/* Your page content here */}
    </PageLayout>
  );
}
```

For pages that need scrolling (like SchedulePage), use:

```tsx
<PageLayout allowScroll={true} title="Page With Scrolling">
  {/* Scrollable content */}
</PageLayout>
```

---

## 4. Core Components _(adapt with shadcn/ui wrappers)_

| Component                | States & Notes                                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Button (Primary)**     | default, hover (`bg-primary‑600`), active (`scale‑95`), disabled (25 % opacity)                                                                    |
| **Card**                 | Elevation 1; hover shadow 2 on desktop. Contains headline, meta, actions row.                                                                      |
| **Checkbox Row**         | Label left‑aligned, 16 px gap, whole row hit area 44 pt.                                                                                           |
| **Modal / Sheet**        | 90 % viewport height max, scroll‑lock body, close on ESC & swipe‑down.                                                                             |
| **Command Palette (⌘K)** | Global fuzzy search, appears in 150 ms with backdrop blur 8. ([uxdesign.cc](https://uxdesign.cc/so-youre-building-a-superhuman-of-x-b39015f3d7a6)) |

---

## 5. Interaction & Motion

| Gesture / Event   | Feedback                                                        | Duration     |
| ----------------- | --------------------------------------------------------------- | ------------ |
| Task ✓ (checkbox) | Checkmark animates, card fades to 60 % opacity then slides down | 600 ms total |
| Add Task          | Floating card expands from FAB                                  | 240 ms       |
| Page switch       | Slide in (`translate‑x‑full → 0`) with `ease‑out‑cubic`         | 300 ms       |

Performance budget: <2.5 s LCP; <0.1 CLS; <100 ms TTI for repeated actions.

---

## 6. Accessibility Checklist

- **Color contrast ≥ 4.5:1** for text < 24 px.
- **Keyboard nav**: all interactive elements `tabindex=0`, visible focus
  outline.
- **Screen‑reader labels**: `aria‑label` or `aria‑-labelledby` on all form
  inputs & icons.
- **Motion preference**: respect `prefers‑reduced‑motion`, reduce duration to 1
  ms + opacity fade.

---

## 7. Implementation Notes for Cursor

1. **Install Tailwind & shadcn/ui**

   ```bash
   npx shadcn-ui@latest init
   npm install tailwindcss postcss autoprefixer lucide-react framer-motion
   ```

2. **`tailwind.config.ts`** snippet

   ```ts
   export default {
     theme: {
       extend: {
         colors: {
           primary: { 100: '#E0ECFF', 500: '#2563EB', 600: '#1E4ED8' },
           neutral: { 50: '#F8FAFC', 600: '#475569', 900: '#0F172A' },
         },
         borderRadius: { lg: '8px' },
         transitionTimingFunction: {
           'out-cubic': 'cubic-bezier(0.22,0.61,0.36,1)',
         },
       },
     },
   };
   ```

3. **Component example – Task Card (React + Tailwind)**

   ```tsx
   import { CheckCircle } from 'lucide-react';
   export default function TaskCard({ task }) {
     return (
       <div className="card flex items-start gap-3 py-4 px-5 bg-white shadow-sm rounded-lg">
         <input type="checkbox" className="h-5 w-5 mt-1 accent-primary-500" />
         <div className="flex-1">
           <h3 className="text-neutral-900 font-semibold leading-tight">
             {task.name}
           </h3>
           <p className="text-neutral-600 text-sm">{task.category}</p>
         </div>
       </div>
     );
   }
   ```

4. **Command Palette** – integrate `cmdk` or `kbar`, mount at `#root` to avoid
   portal z‑index conflicts.
5. **Global Styles** – import
   `@tailwind base; @tailwind components; @tailwind utilities;`, then apply CSS
   variables for color tokens to enable future theming.

---

## 8. Copy & Tone

- **Friendly, concise, encouraging.** Eg: "Nice work – you've cleared today's
  list!"
- Avoid jargon; write in plain language, use verbs: _Add_, _Edit_, _Done_.

---

## 9. References & Further Reading

- **Airbnb Design Language System case study** – scalability, tokens,
  accessibility.
  ([addictaco.com](https://addictaco.com/case-study-how-airbnbs-design-system-improved-their-ux/))
- **Superhuman UX principles** – speed <100 ms, command palette, minimalist
  aesthetic.
  ([uxdesign.cc](https://uxdesign.cc/so-youre-building-a-superhuman-of-x-b39015f3d7a6))
- **Apple Hit Target & UI Tips** – 44 pt tap areas, clear touch controls.
  ([developer.apple.com](https://developer.apple.com/design/tips/))
- **Material 3 Layout** – responsive grid & canonical layout approach.
- **Apple HIG Motion** – subtle, purpose‑driven animations.

> _Follow this doc as the source of truth; update tokens or motion specs only
> through the design‑system repository._
