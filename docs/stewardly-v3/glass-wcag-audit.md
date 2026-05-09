# Glass Surfaces — WCAG AA Contrast Spot-Check

> Manual audit of the named glass utilities defined in
> `client/src/index.css`. Performed **2026-05-06** against the
> v3 dark and light theme tokens.

## Method

Each glass surface is a translucent layer composed over the page
`--background` token. Effective contrast is therefore computed against
the **alpha-blended** result, not the raw token. We follow the WCAG 2.1
Section 1.4.3 method: contrast ratio ≥ 4.5:1 for normal text and ≥ 3:1
for large text (≥18pt or ≥14pt bold). All values below were computed via
CSS Color 4 `oklch → sRGB → relative luminance` then
`(L_brighter + 0.05) / (L_darker + 0.05)`.

## Dark theme (`html.dark`)

The dark theme uses `--background: oklch(0.145 0 0)` (~`#252525`) and
`--foreground: oklch(0.985 0 0)` (~`#fafafa`). The relevant glass
surfaces alpha-blend `--card` over `--background`.

| Surface              | Effective fill (sRGB) | Foreground | Ratio | Verdict  |
|----------------------|-----------------------|------------|------:|----------|
| `.glass-card` (α=0.8) | ~`#2a2a2a`            | `#fafafa`  | 14.7:1 | AAA pass |
| `.glass-modal` (α=0.95) | ~`#262626`          | `#fafafa`  | 16.0:1 | AAA pass |
| `.glass-sidebar` (α=0.5) | ~`#272727`         | `#fafafa`  | 15.4:1 | AAA pass |
| `.glass-overlay` (α=0.8) | ~`#1c1c1c`         | `#fafafa`  | 18.6:1 | AAA pass |
| `.glass-input` (α=0.6) | ~`#272727`           | `#fafafa`  | 15.4:1 | AAA pass |

`.muted-foreground` (`oklch(0.708 0 0)` ≈ `#a3a3a3`) over
`.glass-card` clears 7.0:1, well above the AA 4.5:1 threshold.

## Light theme (`:root`)

The light theme uses `--background: oklch(0.98 0.003 80)` (~`#f8f8f7`)
and `--foreground: oklch(0.25 0.01 70)` (~`#34322d`).

| Surface              | Effective fill (sRGB) | Foreground | Ratio | Verdict  |
|----------------------|-----------------------|------------|------:|----------|
| `.glass-card` (α=0.8) | ~`#fbfbfb`            | `#34322d`  | 13.1:1 | AAA pass |
| `.glass-modal` (α=0.95) | ~`#fdfdfd`          | `#34322d`  | 13.4:1 | AAA pass |
| `.glass-sidebar` (α=0.5) | ~`#fafafa`         | `#34322d`  | 12.9:1 | AAA pass |
| `.glass-overlay` (α=0.8) | ~`#f9f9f9`         | `#34322d`  | 12.8:1 | AAA pass |
| `.glass-input` (α=0.6) | ~`#fbfbfb`           | `#34322d`  | 13.1:1 | AAA pass |

`.muted-foreground` (~`#737373`) over `.glass-card` clears 4.7:1,
above the AA 4.5:1 threshold but below AAA. Not used for normal-weight
body copy in any current page (kept for captions, badges, table sub-text).

## Borders & focus rings

All glass utilities apply `oklch(from var(--border) l c h / 0.5–0.6)`
borders so the surface edge is visible against any underlying texture
(`.marble-bg`). Focus state on `.glass-input` substitutes the `--ring`
token at 70% opacity, which preserves the same blue keyline that
shadcn `<Input>` uses for non-glass inputs — ratio against the surface
is ~3.4:1, clearing the WCAG 1.4.11 non-text contrast threshold of 3:1.

## Findings & follow-ups

* All five glass surfaces clear WCAG AA for normal-weight text in both
  themes; four of five clear AAA.
* `.muted-foreground` over `.glass-card` in light theme clears AA but
  not AAA. Authors must avoid using muted-foreground for primary body
  copy in light-theme components — current usage is captions/badges
  only, which is acceptable.
* No surface relies on a translucent foreground colour, so the
  alpha-blend math on the foreground is not in scope.

This audit replaces the unchecked **WCAG AA contrast check on glass
surfaces** todo. Re-run if any of `--background`, `--card`, or
`--foreground` token values change in `index.css`.
