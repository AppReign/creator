# Character creator — equipment from game API

Equipment is loaded exclusively via:

1. **`src/config/creatorEquipmentItemIds.ts`** — hardcoded vanity item ids (187 today)
2. **`POST /api/data/items/batch`** — hydrated `characterDisplay` on each `ItemEquipment`

There is no local equipment JSON/TS in this repo anymore.

## Pose keys (chest / gloves / base arms)

Two-handed stances use **side-specific** pose keys (aligned with dotv `EquipmentCharacterDisplayPoseCatalog` and `CharacterBasePartPoseCatalog`):

- `2h mainhand`, `2h offhand`
- `2h mainhand crossbow`, `2h offhand crossbow`

**Gloves** use stance keys only (no `all`) — same idea as base `mainHand` / `offHand` parts. **Chest** still includes `all` for the torso layer plus stance overlays.

Legacy shared keys `2h` and `2h crossbow` are **removed**. Delete any CDN assets uploaded under the old slugs (`…-2h-base-…`, `male-white-2h-under.png`, etc.) and re-upload under the new keys.

See [`characterPoseCatalog.ts`](../src/config/characterPoseCatalog.ts) and dotv `docs/equipment-character-display-upload.md`.

## Adding a new item

1. Upload sprites via `/upload`.
2. Add the item id to `creatorEquipmentItemIds.ts` (under the correct vanity set comment).
3. Optionally add `characterDisplay.meta` in `equipment_data.json` via PR bot.

## Regenerating the id list

From the dotv repo (vanity + display-capable equip slots):

```bash
python3 - <<'PY'
import json
from pathlib import Path
items = json.loads(Path("src/main/resources/json/item/equipment_data.json").read_text())
DISPLAY = {"chest","pants","helm","boots","main-hand","off-hand","gloves"}
for item in sorted(items, key=lambda i: (i.get("vanity",{}).get("vanitySet",""), i["id"])):
    v = item.get("vanity") or {}
    if v.get("isVanity") and item.get("equipSlot") in DISPLAY:
        print(f'  "{item["id"]}",  # {v.get("vanitySet")}')
PY
```
