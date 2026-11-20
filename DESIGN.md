# Character Playground — Architecture Design

## 1. Goals

1. **Artist-first**: an artist can add a new item or vanity option **without touching code**, by dropping PNGs and editing one structured data file. The system should make it **hard to break things** and **fail loudly when broken**.
2. **Scale to thousands of items** without code changes per item.
3. **Two parallel systems**:
   - **Vanity** (base body customization: hair, facial hair, scars). Mutually exclusive per category. Locked at character creation, mutable later via a restricted UI.
   - **Equipment** (gear the player wears). Slot-based, swappable freely.
4. **Sex variants** (male / female today, extensible). Each item is the **single source of truth** for its own visuals across sex / pose / layer.
5. **Layer system extensible** (e.g. orb poses, future **color masks** — see §11 / Phase 5) without code changes per layer addition. **Color masks are not implemented in the playground yet** (no `tintGroup` in data, types, or renderer until Phase 5).
6. **Playground is a proof-of-concept prototype** of what prod will use. We commit to a **schema** here that ports cleanly into the prod equipment JSON via an automated script.
7. **Static layered PNGs only** (no animation in scope).

## 2. Glossary

- **Slot**: a named place gear can occupy. Equipment slots: `mainHand`, `offHand`, `helm`, `chest`, `pants`, `boots`. Vanity slots: `hair`, `facialHair`, `scar`, …
- **Pose**: a body posture (e.g. `1h mainhand`, `2h mainhand`, `2h offhand crossbow`). Determined by main-hand + off-hand items.
- **Layer**: a named z-order slot (e.g. `EQUIPMENT.HELM`, `BODY.CHEST.UNDER`). Resolves to a numeric `zIndex`.
- **Item**: one inventory entity (one helmet, one hairstyle). Carries all its sprite data.
- **Image row**: one drawable PNG entry (filename + layer). Many image rows compose one item per (sex, pose).
- **Display block**: the substructure of an item that holds image data — `characterDisplay` (the thing this playground is the source of truth for).

## 3. Source-of-truth layout

```
schemas/
  equipment-set.schema.json   # JSON Schema: shape + pose rules for equipment set JSON
  zIndexLayerKeys.schema.json # generated enum of valid `layer` strings (npm run sync:layers)
src/
  data/
    equipment/
      <setId>.json            # one file per item set — { $schema?, equipSet?, items[] }
data/
  layers.json                 # layer registry (name → numeric zIndex)
  poses.json                  # pose registry (id, label, kind)
  slots.json                  # slot registry (equipment + vanity)
public/
  character_parts/
    base/                     # base body PNGs (M01, F01, …)
    equipment/<setId>/...     # gear PNGs
    vanity/<category>/...     # vanity PNGs (future)
```

**Rules**
- **Editor validation**: `schemas/equipment-set.schema.json` + generated `schemas/zIndexLayerKeys.schema.json` (from `npm run sync:layers`) — missing chest pose buckets, extra keys, misspelled **pose** ids, and invalid **`layer`** strings vs `zIndex` all surface in VS Code/Cursor while editing JSON.
- One equipment JSON = one **item set** (artist delivery unit): `{ "items": [ … ] }`, optional top-level `equipSet` (must match `<setId>` in the filename). Each array entry is one item with its own `characterDisplay`.
- PNG paths in JSON are **relative to `public/character_parts/`**, no `..` allowed.
- Layer ids and pose ids are **strings** (designer-friendly), looked up in registries.

## 4. Item schema (single source of truth)

Playground **equipment** rows in `src/data/equipment/*.json` are intentionally minimal: only the fields needed to render and to match how prod identifies a piece (`id`, `name`, slot, weapon flags). Full prod rows (stats, drops, 3D paths) live in the game DB / exports; a future sync script can merge **`characterDisplay`** from this repo into those records by `id`.

### 4.1 Equipment item

**Allowed keys on each `items[]` object** (nothing else — `validate:data` uses `.strict()`):

| Key | Required | Notes |
|-----|----------|--------|
| `id` | yes | Stable id (e.g. matches prod inventory id). |
| `name` | yes | Display name for the selector. |
| `equipSlot` | yes | Production-style strings: `main-hand`, `off-hand`, `helm`, `chest`, `pants`, `boots` (normalized at load). |
| `characterDisplay` | yes | 2D sprite source of truth (poses, sexes, `layer` keys from `layers.json` / `zIndex`). |
| `equipType` | no | e.g. `sword`, `crossbow` — gameplay / UI hint. |
| `twoHanded` | no | Weapons only. |

**`equipSet`** is not stored on the row: the loader sets it from the set file name (`<setId>.json`).

```jsonc
{
  "id": "e.training-sword-two",
  "name": "Training Sword",
  "equipSlot": "main-hand",
  "equipType": "sword",
  "twoHanded": false,
  "characterDisplay": {
    "default": "all",
    "perSex": {
      "male": {
        "all": [
          { "filename": "equipment/conqueror/M05_CHESTOVER", "layer": "CHESTOVER" }
        ],
        "1h mainhand": [
          { "filename": "equipment/conqueror/M05_ONEHLARM", "layer": "ONEHLARM" }
        ]
      }
    }
  }
}
```

### 4.2 Vanity item

Identical shape, but `equipSlot` comes from the **vanity slot registry** (`hair`, `facialHair`, `scar`, …). No `equipType`, no stats.

```jsonc
{
  "id": "v.hair.long-blonde",
  "name": "Long Blonde",
  "vanitySlot": "hair",
  "characterDisplay": {
    "default": "all",
    "perSex": {
      "male":   { "all": [ { "filename": "vanity/hair/M01_HAIR_LONG_BLONDE", "layer": "BODY.HAIR.LONG" } ] },
      "female": { "all": [ { "filename": "vanity/hair/F01_HAIR_LONG_BLONDE", "layer": "BODY.HAIR.LONG" } ] }
    }
  }
}
```

### 4.3 Image row

```ts
type ImageRow = {
  filename: string;     // path under public/character_parts/, no extension
  layer: LayerId;       // string id from layers.json / zIndex
};
```

**Color masks / `tintGroup`:** reserved for **Phase 5** (see §11). The image row type and JSON schema intentionally include **only** `filename` and `layer` until that work ships — no mask fields in the playground codebase yet.

## 5. Registries (the “extension points”)

These are JSON so adding capability ≠ code change.

### 5.1 `data/layers.json`

```jsonc
{
  "BODY.HEAD.DEFAULT":             { "z": 475, "kind": "body" },
  "BODY.HAIR.LONG":                { "z": 482, "kind": "body" },
  "EQUIPMENT.HELM":                { "z": 500, "kind": "equipment" },
  "EQUIPMENT.MAINHAND.ONE_HANDED.CROSSBOW.UNDER": { "z": 270, "kind": "equipment" }
  // … one row per layer
}
```

- **One flat map**. Hierarchy is encoded in the **dotted name**, not in nesting (much easier to reason about with thousands of layers).
- New layer = add a row. Done.
- Convention: prefix `BODY.*`, `EQUIPMENT.*`, `VANITY.*`. Keep numeric ranges loose (50-step gaps) so insertions don’t require renumbering.

### 5.2 `data/poses.json`

```jsonc
[
  { "id": "all",               "label": "Any pose",        "kind": "wildcard" },
  { "id": "1h mainhand",           "label": "1H main hand",   "kind": "single", "hand": "mainhand" },
  { "id": "1h offhand",            "label": "1H off hand",    "kind": "single", "hand": "offhand" },
  { "id": "2h mainhand",           "label": "2H main hand",   "kind": "single", "hand": "mainhand" },
  { "id": "2h offhand",            "label": "2H off hand",    "kind": "single", "hand": "offhand" },
  { "id": "2h mainhand crossbow",  "label": "2H crossbow MH", "kind": "single", "hand": "mainhand" },
  { "id": "2h offhand crossbow",   "label": "2H crossbow OH", "kind": "single", "hand": "offhand" },
  { "id": "1h mainhand crossbow",  "label": "1H crossbow MH", "kind": "single", "hand": "mainhand" },
  { "id": "1h offhand crossbow",   "label": "1H crossbow OH", "kind": "single", "hand": "offhand" },
  { "id": "throwing mainhand",     "label": "Throw MH",       "kind": "single", "hand": "mainhand" },
  { "id": "throwing offhand",      "label": "Throw OH",       "kind": "single", "hand": "offhand" },
  { "id": "orb",                   "label": "Orb cast",       "kind": "single", "hand": "offhand" }
]
```

- New pose (e.g. `orb`) = add a row + add image rows on items that need it.
- The pose-derivation logic stays the same: it looks at main/off hand item poses and resolves.

### 5.3 `data/slots.json`

```jsonc
{
  "equipment": ["mainHand", "offHand", "helm", "chest", "pants", "boots"],
  "vanity":    ["hair", "facialHair", "scar"]
}
```

## 6. Sex modeling

- **`perSex`** keyed by `"male" | "female"` today; the schema treats it as an **open string union** so we can add `"androgynous"` later without a breaking change.
- Each item declares **which sexes it supports**. Validator fails if the player picks a sex not supported by an equipped item (or we hide it in the UI — whichever you want).
- **Equipment is sex-specific by default** (helmets often differ; chest definitely does). For truly unisex art, the artist can author `perSex.male` and copy filenames into `perSex.female` (or we can support a `"unisex": true` shortcut later).

## 7. Validation (“impossible to color outside the lines”)

This is the part that pays off when we have thousands of items.

### Tooling
- **Zod** (or similar) schema for each registry + item file.
- A single **`npm run validate`** command runs all checks. CI fails on any error. Pre-commit hook runs it locally.

### What it checks
1. **Schema**: all JSON conforms (field names, types, enums).
2. **Layer references**: every `layer` exists in `layers.json`.
3. **Pose references**: every pose key exists in `poses.json`.
4. **Slot references**: `equipSlot`/`vanitySlot` exists in `slots.json`.
5. **File existence**: every `filename` resolves to an actual PNG in `public/character_parts/`.
6. **Required poses per slot**: if `equipSlot === "chest"`, items must define **at least** `[all, 1h mainhand, 1h offhand, 2h mainhand, 2h offhand, 2h mainhand crossbow, 2h offhand crossbow, 1h mainhand crossbow, 1h offhand crossbow, throwing mainhand, throwing offhand]` for each declared sex (rules per slot live in `slots.json`; see `FULL_POSE_KEYS` in `characterPoseCatalog.ts`).
7. **Default pose fallback**: items without pose-specific art default to `all`. Validator allows that explicitly so missing poses **only** fail loudly when the slot requires them.
8. **No duplicate ids** across the equipment + vanity pools.
9. **No layer collisions** within a single item (two image rows on the same `(sex, pose, layer)`).

### Authoring helpers
- **`npm run new:item`** scaffolds a new item JSON for a given slot, with placeholders + the required pose buckets pre-stubbed.
- **`npm run check:item <id>`** runs validation + prints a sprite preview path so the artist can quickly verify.
- **`npm run lint:fix`** sorts JSON keys, normalizes filenames.

## 8. Runtime architecture

- **Boot (today)**: the React app loads equipment set JSON via `equipmentCatalog.ts` and resolves draw order with **`src/layers/zIndex.ts`** (`zIndexValue` / `EQUIPMENT` / `BODY` keys). It does **not** load `data/layers.json`, `poses.json`, or `slots.json` at runtime — those files exist for **validators**, **editor tooling** (generated JSON Schema enums), and **designer-facing registries** aligned with the TypeScript source of truth.
- **Boot (target)**: optionally load the same registries at runtime once the app is fully data-driven.
- **Catalog**: a map keyed by `id`.
- **Pose pipeline** (unchanged in shape): main-hand + off-hand poses → derived pose → for each equipped/vanity item, pick `images.perSex[sex][derivedPose] || images.perSex[sex][default]`.
- **Render**: flatten image rows + numeric z. **(Phase 5)** tinted / mask rows and per-group player colors — not implemented yet; see §11.
- **Pose derivation, slot exclusivity, off-hand muting on 2H weapons**: same rules as today, ported to the new schema.

The TS layer (`src/layers/equipmentLayer.ts`, `baseLayer.ts`, `zIndex.ts`) becomes a **thin adapter** that reads the JSON registries at startup. Most domain logic stays.

## 9. Prod migration script

- The playground JSON for an item *is* the prod item, plus an extra `characterDisplay` block.
- **`scripts/sync-to-prod.ts`** walks `src/data/equipment/*.json`, validates, and merges only the **`characterDisplay`** key into the matching prod item by `id`. Stats / rarity / drop tables in prod are untouched.
- An AI prompt template (a separate doc) wraps this for one-shot ports of partial sets.
- We treat **`id`** as the contract: if a playground id has no prod counterpart, the script reports it; if a prod id has no playground counterpart, the script reports it.

## 10. Vanity system

- **Catalog**: `data/vanity/<category>/*.json`.
- **Player state**: at character create, we capture `{ sex, vanity: { hair: "v.hair.long-blonde", facialHair: null, scar: null } }`.
- **Slot rules** (`data/slots.json` extended): each vanity slot declares `mutuallyExclusive: true` (today: all of them).
- **UI separation**: vanity has its own selector (separate from `EquipmentSelector`). Equipment screen never shows vanity.
- **Mutability later**: a separate, restricted “Appearance” UI; this is enforcement at the UI layer, not data — the data model already supports edits.

## 11. Color masks (for weapon tinting, etc.) — **deferred (Phase 5)**

**Status:** Design only. **Not implemented** in this playground yet: no `tintGroup` on image rows, no tint state on the character, no mask-aware renderer, and no JSON schema fields for tinting until Phase 5. That keeps authoring and validation focused on static PNG layers.

When implemented, the intended shape is:

- An image row may be marked `"tintGroup": "weapon-primary"`.
- The character record stores a tint per group: `{ "weapon-primary": "#ff0066" }`.
- Renderer applies tint to that PNG (preferable: pre-multiplied alpha PNG used as a mask, blended with the chosen color).
- Adding tintability to a weapon = mark the existing mask row with a `tintGroup`. **No new layer needed**.

## 12. Phased rollout

A pragmatic order of operations for getting from where we are to where we want to be.

### Phase 1 — Schema + registries (no UX change) — **in progress**
- **Done**: `data/layers.json` (generated from current `zIndex.ts` via `npm run sync:layers`), `data/poses.json`, `data/slots.json`; `npm run validate:data` (Zod + strict match of `layers.json` ↔ `zIndex.ts`); `npm run build` runs validation first. Dev deps: `zod`, `tsx`; `tsconfig.scripts.json` for script typecheck.
- **Not done yet**: generating `zIndex.ts` from `layers.json` (today JSON follows code); pre-commit hook; CI workflow wiring.

### Phase 2 — Equipment data as JSON — **done (playground)**
- All equipment definitions live under `src/data/equipment/<equipSet>.json` (one file per set). Each `items[]` entry has `characterDisplay` (`default` + `perSex.male` pose buckets, `layer` as `zIndex` keys).
- `src/data/equipmentCatalog.ts` loads them via webpack `require.context`; `src/config/equipmentDisplay.ts` builds the selector catalog from `allEquipmentItems.ts` (legacy `src/equipment/*` TS modules were removed).
- `validate:data` checks every equipment JSON (schema, pose keys, layer keys vs `zIndex`).

### Phase 3 — Sex toggle + per-sex resolution — **done (baseline)**
- Playground UI: **male / female** buttons (see `CharacterActions`).
- `resolveEquipmentImagesForHandPose` takes `CharacterSex`; female art missing → **warn once** and fall back to male layers until `perSex.female` is authored in JSON.
- **Next**: add `perSex.female` blocks per item in JSON as art becomes available.

### Phase 4 — Vanity system
- New catalog (`data/vanity/...`), new selector UI.
- Hook vanity layers into render pipeline (they ride on the same layer registry).

### Phase 5 — Color masks (**not started — design in §11**)
- **`tintGroup`** on image rows + tinting renderer + sample swords with masks.
- Until this phase: do **not** add mask/tint fields to `Config.ts`, equipment JSON, or JSON Schema; the doc above describes the target only.

### Phase 6 — Prod sync script
- `scripts/sync-to-prod.ts` + AI prompt doc.

## 13. Recommended “add an item” flow

I’d use **JSON catalog with strict schema + scaffolding command** — best balance of safety and speed.

```bash
npm run new:item -- --slot chest --setId conqueror --id e.conqueror-chest --sex male,female
# scaffolds src/data/equipment/conqueror.json items[] entry with required pose stubs
# prints the exact PNG paths to drop into public/character_parts/equipment/conqueror/
```

Then the artist:
1. Drops the PNGs at the printed paths.
2. Saves the JSON (pre-commit + IDE schema autocomplete keep them honest).
3. Runs `npm run validate` (or just commits — pre-commit runs it).
4. Sees the result in the playground.

The artist **never** edits TS, **never** touches the layer registry without seeing the validator yell first, and **cannot** ship an item with a missing pose.

## 14. Open questions

These don’t block the design but are decisions to make before Phase 2-3:

1. **Sex storage shape**: confirm `perSex.male/female` (sex-first) over pose-first nesting. Recommendation: sex-first.
2. **Default sex** when art is unisex: do we want a `"unisex": true` shortcut, or always require `perSex.male`/`perSex.female` (even if duplicated)?
3. **Layer ranges**: do we want to renumber the existing `zIndex` values into round, evenly-spaced bands (e.g. 100s of room between groups) before we move them to JSON? Cheap to do once, painful to do later.
4. **Vanity layers vs body layers**: are vanity layers (hair, scar) a sub-prefix of `BODY.*`, or do they get their own prefix `VANITY.*`? Default: **`BODY.*`** stays for the bare body, **`VANITY.*`** for player-customizable additions.
5. **Where does “character record” live?** (sex + vanity choices) — same playground state as equipped items, or a separate file we persist? For Phase 4 it’s easy to start in-memory.
