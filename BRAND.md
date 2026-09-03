# DF Together brand and design guide

DF Together is an independent community planning companion. It follows Apple's
Human Interface Guidelines first and carries the brand through a single tint,
the original mark, and the words on screen. It must remain visibly distinct
from Salesforce and its products.

## Design system

- **Semantic colors.** Text, backgrounds, separators, and fills use the UIKit
  semantic colors (`label`, `secondarySystemGroupedBackground`, `separator`,
  and friends) through `src/theme.ts`, so Dark Mode, Increase Contrast, and
  other accessibility settings work without app-specific code. Brand blue
  (`#0176D3`, `#5AB0FF` in dark) is used only as the tint for actions,
  selection, and links. Green means success or an explicitly enabled share.
  Orange and red are reserved for warnings, tight walks, overlaps, and
  destructive actions. Never rely on color alone to convey state.
- **Type.** Apple's Dynamic Type ramp (Large Title 34, Title 1 28, Title 2 22,
  Title 3 20, Headline 17 semibold, Body 17, Subheadline 15, Footnote 13,
  Caption 12/11) via the `text` styles. Weights top out at semibold except for
  titles. No letter-spaced all-caps eyebrows; grouped section headers use the
  standard uppercase footnote style.
- **Surfaces.** Inset grouped lists on a grouped background, 12pt continuous
  corners, hairline separators, no borders, no drop shadows. Sheets use native
  form-sheet detents. Navigation uses native large titles, the integrated
  search field, SF Symbols, and the system tab bar (Liquid Glass on iOS 26).
- **Icons.** SF Symbols on iOS with Ionicons fallbacks, mapped once in
  `src/components/icons.ts`.
- **Motion and feedback.** System transitions only, light haptics on agenda
  changes, swipe-to-remove on agenda rows, native action sheets for choices.

## Identity boundaries

- Use the original DF Together mark from [`assets/brand-icon.svg`](./assets/brand-icon.svg)
  in onboarding, sign-in, and the app icon. Do not put it in navigation bars.
- Do not use or redraw the Salesforce cloud, Salesforce wordmark, stylized “f”,
  product icons, Trailhead characters, or other proprietary Salesforce artwork.
- Do not put “DF Together” inside a Salesforce-like cloud or create a mark that
  could imply the app is an official Salesforce product.
- Keep the independence and planning-only disclaimer visible on public pages
  and as a footnote in the agenda, session detail, profile, and sign-in screens.
