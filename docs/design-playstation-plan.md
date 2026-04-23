# PlayStation-inspired UI Redesign Plan

> Source: [getdesign.md/playstation](https://getdesign.md/playstation/design-md) (via `npx getdesign@latest add playstation`)
> Style: **Scope B** — tokens + hover signature + surface rhythm
> Applied to: Arena UGC Prediction Markets (Next.js 16)

## Design Tokens (PS)

### Colors

| Token | Hex | Use |
|---|---|---|
| `--ps-blue` | `#0070cc` | Brand anchor · primary CTAs · footer · focus ring |
| `--ps-cyan` | `#1eaedb` | **Hover/focus ONLY** — never static background |
| `--ps-black` | `#000000` | Masthead / hero |
| `--ps-shadow` | `#121314` | Dark gradient start |
| `--ps-paper` | `#ffffff` | Content canvas |
| `--ps-ice` | `#f5f7fa` | Light gradient end |
| `--ps-orange` | `#d53b00` | Commerce/redeem CTAs only |
| `--ps-charcoal` | `#1f1f1f` | Body headings |
| `--ps-body-gray` | `#6b6b6b` | Secondary text |
| `--ps-warning` | `#c81b3a` | Errors |

### Typography

- Hero 54px / SST weight 300 / line-height 1.25 / letter-spacing -0.1px
- UI heading 18px / weight 600
- Button 18px / weight 500 / tracking 0.4px
- Body 18px / weight 400 / line-height 1.5
- **No all-caps. No gradient text. No serif.**

### Radii

- 3px — inputs (compact)
- 12px — cards / images
- 24px — feature cards / hero cards
- 999px — primary buttons (full pill)

### Shadows (only 4 tiers)

```
0.06 → panel feather
0.08 → grid tile
0.16 → emphasized card / hover
0.80 → hero drop over photography
```
Offset always `0 5px 9px 0`.

### Button signature hover (mandatory)

```
background: #1eaedb (cyan)
border: 2px solid #ffffff
box-shadow: 0 0 0 2px #0070cc   (outer ring)
transform: scale(1.2)
transition: 180ms ease
```

---

## Components Changed

| Component | Before | After |
|---|---|---|
| Hero bg | radial purple/pink gradient | `--ps-black` + subtle `--ps-shadow` gradient |
| Hero title | `font-semibold` + gradient clip text | `font-light` (300) + solid white |
| Primary buttons | `rounded-xl bg-zinc-900` | `.btn-ps-primary` pill w/ hover signature |
| Commerce buttons (Redeem) | same as primary | `.btn-ps-commerce` `--ps-orange` fill |
| MarketList section | no wrapper | `surface-ps-light` (white → ice gradient) |
| Header "devnet" badge | `uppercase tracking-wider` | title case |
| MarketCard StateBadge | `uppercase tracking-wider` | title case, colors preserved |
| Copilot panel | violet→pink gradient bg | white + left 4px blue accent strip |
| Toast | `rounded-xl` + backdrop-blur | `rounded-[6px]` + 1px border |
| Footer | **missing** | **new** `--ps-blue` anchor block |

## Preserved (intentionally broken PS rule)

- **Toast semantic colors** (emerald success / rose error) — business usability
- **StateBadge colors** (emerald Resolved / blue Open / amber Resolving / zinc Closed) — data affordance
- **OrderBook bid/ask coloring** — financial convention
- **Resolved banner gradient** — emotional peak, PS yields to product emotion

## Do's

- Every display headline ≥22px uses weight 300
- Every primary CTA uses `.btn-ps-primary` (includes hover signature)
- Every surface transition alternates: black → white → blue
- Every radius lands on 3 / 6 / 12 / 24 / 999

## Don'ts

- Don't bring back purple/pink gradients
- Don't use all-caps labels
- Don't skip `scale(1.2)` on button hover
- Don't let cyan `#1eaedb` appear as a resting color

## Verification

1. `pnpm build` passes (6 routes)
2. `next-server` RSS stays ≤ 150 MB post-rebuild
3. Visual check:
   - Home: black hero → white markets grid → blue footer (3 surfaces)
   - Click any primary button: see 1.2× scale + cyan fill + blue ring
   - `/create` Copilot: no purple/pink, white with blue accent
4. `pnpm exec tsc --noEmit` clean
