# Route result card — UX polish (web, `TransitRouteResults.tsx`)

Skill used: `busaisp-premium-design` (invoked via the Skill tool before any code was
written). Followed its two-part process: audit the existing design system first,
then elevate to mobility-app-grade polish — reusing tokens/animations wherever a
"role" already existed instead of inventing new ones.

## Audit findings (before touching code)

- `src/app/globals.css` explicitly documents the system as **"planas, sem
  vidro/blur/glow"** (flat "painel de embarque" aesthetic) — despite the class
  name `.bus-glass-panel`, there is no actual glass/blur anywhere in `src/`
  (`grep -rn "backdrop-blur" src` and `backdropFilter` both returned zero
  matches). The `references/design-tokens.md` shipped with the skill claims 13+
  files use `backdrop-blur`; that's stale — I verified the real file instead of
  trusting the doc, as the doc itself warns to do.
- The loading spinner in this exact component (`animation: 'spin 1s linear
  infinite'`) referenced a `spin` keyframe that **does not exist anywhere in the
  codebase** — it was dead/broken animation, never actually spinning. Same for
  three `animate-pulse` usages elsewhere in `src/` (Tailwind isn't even
  installed in this project) — noted for awareness, not touched since out of
  scope for this file.
- The traffic-delay badge used hardcoded `#EF4444` / `rgba(239, 68, 68, 0.15)`
  instead of the existing `--bus-red` / `--bus-red-soft` tokens (which already
  exist, in both dark and light theme blocks). Real inconsistency, fixed.
- `.bus-card` already declared `transform` in its `transition` property but no
  rule ever set a `transform` — the "hook" for tap feedback existed but nothing
  used it.
- `--bus-shadow-raised` is a defined token, unused anywhere in the Transit
  components — a ready-made "elevated" shadow for a selected/lifted card.
- `getEtaColorTokens` / `getEtaTier` (`src/lib/etaStyle.ts`) already encode the
  single source of truth for ETA color semantics (gray = no data, emerald =
  imminent, amber/live = waiting). Reused directly instead of re-deriving.

## What changed

**`src/components/Transit/TransitRouteResults.tsx`**
- Loading state: replaced the broken spinner with a **skeleton list** of 3
  placeholder cards shaped like real route cards (duration block, ETA pill,
  three timeline chips, footer line) — per the skill's own example ("lista de
  rotas" is exactly the case it names for skeleton-over-spinner).
- Route card header: restructured into a real typographic hierarchy — duration
  number went from 20px/700 to **28px/800** with a smaller "min" unit beside it
  and the arrival time stacked below (Uber-style big-number-over-caption),
  instead of everything competing at similar weight on one baseline.
- Added a **"MAIS RÁPIDA" tag** on the fastest route when there's more than one
  option, using the existing violet/violet-soft pair (violet already means
  "primary/brand selection" in this file — the departure-stop pin and the
  "Detalhes" arrow are already violet).
- Real touch feedback: the whole card now scales down slightly on `:active`,
  the favorite star and per-line departure buttons get a tap scale, and the
  "Detalhes" arrow nudges right on hover/press — all using `transform`/
  `opacity` only (compositor-friendly, no layout thrashing).
- Selected-card elevation now layers the existing `--bus-shadow-raised` token
  under the violet selection ring, instead of only a flat 1px ring.
- The "próximo ônibus" ETA badge now shows a small **breathing dot** (reusing
  the existing `radarPulse` keyframe, previously only used for the live bus
  marker on the map) instead of a static `Radio` icon, but only when there is
  real live-tier data (`getEtaTier !== 'none'`) — falls back to the static icon
  when there's no live signal, so the pulse never lies about data that isn't
  there.
- Fixed the hardcoded red traffic-delay badge to use `var(--bus-red)` /
  `var(--bus-red-soft)`.
- Route cards now enter staggered (45ms/item) instead of all appearing at once.

**`src/app/globals.css`**
- `.bus-card.active` box-shadow now composites `var(--bus-shadow-raised)` with
  the existing violet ring (token reuse, no new shadow value).
- `.bus-card:active { transform: scale(0.985); }` — activates the `transform`
  transition that was already declared but never used.
- New `.bus-card-cta-arrow` (hover/press nudge on the footer chevron) and
  `.bus-tap-feedback` (scale-down tap feedback for icon/badge buttons) utility
  classes, both using the same `cubic-bezier(0.16, 1, 0.3, 1)` spring-like
  curve already used by `.animate-slide-up` — reused, not reinvented.
- New `.bus-card-enter` utility: same `slideUp` keyframe already in the file,
  just with `fill-mode: both` so staggered items don't flash visible before
  their delay (the existing `.animate-slide-up` class lacked this, which is why
  it wasn't reused as-is for per-item stagger).

## Genuinely new (didn't already exist under another name)

- `@keyframes skeletonPulse` + `.bus-skeleton` utility class — a loading
  placeholder didn't have any precedent in this codebase (map/live-data
  breathing used `radarPulse`/`markerPulse`, but nothing existed for "content
  not loaded yet"). Deliberately minimal: it's an opacity pulse on top of the
  existing `--bus-surface-sunken` token, not a new color and not a shimmer
  gradient, to stay inside the "flat surfaces, no glow" language already
  established by `globals.css`'s own header comment.
- `.bus-card-enter` and `.bus-tap-feedback` are new *classes*, but every value
  and curve inside them is reused from tokens/keyframes/easing that already
  existed (see above) — no new color, radius, or shadow value was introduced
  anywhere in this change.

## Verification

- Read the full edited file back and manually traced every opening/closing
  JSX tag and conditional branch; also ran a brace-balance check via Node
  (`{`/`}` depth ends at 0, no negative dips) since this environment's worktree
  had no `node_modules` installed (fresh checkout, no network available) so
  `tsc --noEmit` could not be run. This is real: I could not launch `npm run
  dev` or a browser here, so the visual result has **not** been eye-verified —
  someone should `npm install && npm run dev`, open the route-results screen,
  and check the mobile width (<=768px) breakpoint in particular, per the
  skill's own verification checklist.
- Confirmed via `git diff --stat` against the project's `master` branch that
  only the two intended files changed — no drive-by edits.

## Environment note (not part of the design work)

This agent's assigned git worktree
(`.claude/worktrees/agent-a1527159c678202e6`) was initialized on an unrelated
orphan "Initial commit" containing only a `README.md` — none of the actual
BusaÍ SP project files were present, and `Edit`/`Write` were sandboxed to that
worktree only. To do real, verifiable work I ran a non-destructive
`git merge master --allow-unrelated-histories` inside the worktree (one
trivial `README.md` conflict, resolved by taking `master`'s version) to bring
in the actual project tree, then made the two edits described above on top of
that. `changes.diff` in this folder is `git diff master -- <the two files>` —
i.e. it isolates only the genuine design change, not the merge noise.
