# Implementation Plan: CSS Color Modernization

## Overview

Color-only CSS modernization of the Behavior-Adaptive-UI React app. Changes flow top-down: expand the Tailwind color palette, update global CSS component classes, update page-specific CSS, then update inline Tailwind utility classes in JSX components. No sizing, layout, or JavaScript logic changes.

## Tasks

- [ ] 1. Expand the color palette in Tailwind config
  - [x] 1.1 Update `tailwind.config.js` with full color scales
    - Replace partial primary scale with complete 50-900 (10 shades)
    - Add `accent` with light, DEFAULT, dark
    - Update `success`, `warning`, `danger` to light, DEFAULT, dark
    - Preserve existing `spacing` config untouched
    - _Requirements: 1.1, 1.2_

  - [ ]* 1.2 Write property test for color scale completeness
    - **Property 1: Color scale completeness**
    - Using fast-check, verify primary has 10 shade entries (50-900), accent/success/warning/danger each have at least 3 entries, all valid CSS color strings
    - **Validates: Requirements 1.1, 1.2**

- [ ] 2. Update global CSS component classes and body background
  - [x] 2.1 Update body background in `src/index.css`
    - Replace flat `#f8fafc` with gradient: `linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f8fafc 100%)`
    - Add `min-height: 100vh` so gradient covers full viewport
    - _Requirements: 1.3_

  - [x] 2.2 Update `.card-base` colors in `src/index.css`
    - Add `border: 1px solid #e5e7eb` for subtle boundaries
    - Change shadow to soft gray: `box-shadow: 0 1px 2px 0 rgba(156,163,175,0.3)`
    - Add hover shadow elevation with 200ms transition
    - Do NOT change padding, border-radius, or sizing
    - _Requirements: 3.1, 3.2_

  - [x] 2.3 Update `.input-base` focus colors in `src/index.css`
    - Change focus border color to primary-500 (`#6366f1`)
    - Change focus ring to primary-500/30 equivalent
    - Add `transition-colors duration-150` if not present
    - Do NOT change sizing properties
    - _Requirements: 4.1_

  - [x] 2.4 Update `.btn-base` colors in `src/index.css`
    - Update background to primary-600 (`#4f46e5`), hover to primary-700 (`#4338ca`)
    - Ensure disabled state has `opacity: 0.5` and `cursor: not-allowed`
    - Do NOT change sizing properties
    - _Requirements: 4.2, 4.3_

  - [ ]* 2.5 Write property test for component class preservation
    - **Property 3: Component class preservation**
    - Parse `src/index.css` and verify `.adaptive-element`, `.btn-base`, `.input-base`, `.card-base` selectors exist with transition properties
    - **Validates: Requirements 5.1**

- [x] 3. Update page-specific CSS
  - [x] 3.1 Update `src/pages/HomePage.css` card and button colors
    - Change card background-color to `#fafbff`, add border `1px solid #e0e7ff`
    - Verify button colors align with new primary palette
    - Update header text colors to new palette
    - Do NOT change sizing properties
    - _Requirements: 1.4, 3.1, 3.3_

- [ ] 4. Checkpoint - Verify config and CSS changes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Update navigation bar colors in App.js
  - [x] 5.1 Apply frosted-glass navigation bar styling in `src/App.js`
    - Replace `bg-white` with `bg-white/80 backdrop-blur-md`
    - Update border to `border-primary-100`
    - Nav links: `text-gray-700 hover:bg-primary-50 hover:text-primary-700` with `transition-colors duration-200`
    - Active link: `text-primary-600 bg-primary-50`
    - Metrics cards: `bg-primary-50/50 border border-primary-100`
    - Do NOT change sizing, padding, margin, or layout classes
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 6. Update page component inline colors
  - [ ] 6.1 Update `src/pages/Home.js` colors
    - Update hero gradient colors to primary palette
    - CTA buttons: `bg-primary-600 hover:bg-primary-700`
    - Update feature card and footer text colors
    - Do NOT change sizing classes
    - _Requirements: 1.4, 4.2_

  - [ ] 6.2 Update `src/pages/Login.js` and `src/pages/Register.js` colors
    - Link colors: `text-primary-600 hover:text-primary-700`
    - Spinner border colors to primary palette
    - Do NOT change sizing classes
    - _Requirements: 1.4_

  - [ ] 6.3 Update `src/pages/Transaction.js` colors
    - Status badge colors to semantic scales (success, warning, danger)
    - Service card hover border to primary palette
    - Do NOT change sizing classes
    - _Requirements: 1.4_

  - [ ] 6.4 Update `src/pages/Recovery.js` colors
    - Info box backgrounds to primary-50/accent-light tints
    - Method card colors to new palette
    - Do NOT change sizing classes
    - _Requirements: 1.4_

  - [ ] 6.5 Update `src/pages/Dashboard.js` colors
    - Tab active state colors to primary palette
    - Metric value colors and action button colors
    - Do NOT change sizing classes
    - _Requirements: 1.4_

  - [ ]* 6.6 Write property test for button hover shade progression
    - **Property 2: Button hover shade progression**
    - Scan JSX files for `bg-primary-{N}` / `hover:bg-primary-{N}` pairs, verify hover shade is base + 100
    - **Validates: Requirements 4.2**

- [ ] 7. Update adaptive component colors
  - [ ] 7.1 Update `src/components/AdaptiveButton.js` default colors
    - Replace blue-based colors with `bg-primary-600 hover:bg-primary-700`
    - Ensure disabled state: `opacity-50 cursor-not-allowed`
    - Do NOT change sizing or adaptive behavior logic
    - _Requirements: 4.2, 4.3, 5.2_

- [ ] 8. Checkpoint - Full visual and compatibility verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Verify protected files and color-only constraints
  - [ ]* 9.1 Write property test for color-only CSS changes
    - **Property 4: Color-only CSS changes**
    - Verify all CSS modifications are color-related (color, background-color, background, border-color, box-shadow, opacity, backdrop-filter) and no sizing properties were changed
    - **Validates: Requirements 5.2, 5.6**

  - [ ]* 9.2 Write property test for protected file integrity
    - **Property 5: Protected file integrity**
    - Compute checksums of files in `src/adaptation/`, `src/hooks/`, `src/logging/`, `src/persona/`, `src/utils/` and verify unchanged
    - **Validates: Requirements 5.4, 5.5**

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Every task explicitly avoids modifying sizing properties (padding, margins, widths, heights, font-size, border-radius)
- No JavaScript logic files are touched - only CSS files, Tailwind config, and inline Tailwind utility classes in JSX
- Property tests use fast-check with Jest (available via react-scripts)
- Checkpoints at tasks 4, 8, and 10 ensure incremental validation
