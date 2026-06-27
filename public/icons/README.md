# Equipment Icons

Download SVGs from https://game-icons.net and drop them in the folders below.
The filenames here are what `getItemIcon()` in `EquipmentPaperdoll.tsx` will look for.

## /icons/weapons/
| Filename              | Weapon type                          | Suggested search on game-icons.net |
|-----------------------|--------------------------------------|-------------------------------------|
| great-axe.svg         | Greataxe                             | "great axe"                         |
| hand-axe.svg          | Handaxe, Battleaxe                   | "hand axe" / "axe"                  |
| war-hammer.svg        | Warhammer, Maul                      | "war hammer"                        |
| mace.svg              | Mace, Morningstar, Flail             | "mace"                              |
| club.svg              | Club, Greatclub                      | "club"                              |
| halberd.svg           | Halberd, Glaive, Polearm             | "halberd"                           |
| spear.svg             | Spear, Pike, Lance, Javelin          | "spear"                             |
| trident.svg           | Trident                              | "trident"                           |
| longbow.svg           | Longbow, Shortbow                    | "bow"                               |
| crossbow.svg          | Crossbow (any)                       | "crossbow"                          |
| dagger.svg            | Dagger, Knife, Stiletto, Dirk        | "dagger"                            |
| rapier.svg            | Rapier, Estoc                        | "rapier"                            |
| greatsword.svg        | Greatsword, Claymore, Flamberge      | "great sword"                       |
| longsword.svg         | Longsword, Broadsword, Scimitar      | "sword"                             |
| shortsword.svg        | Shortsword                           | "short sword"                       |
| whip.svg              | Whip, Chain                          | "whip"                              |
| net.svg               | Net                                  | "net"                               |
| pistol.svg            | Pistol, Revolver                     | "pistol"                            |
| musket.svg            | Musket, Arquebus, Rifle              | "musket"                            |
| dart.svg              | Dart, Sling, Chakram                 | "dart" / "throwing star"            |

## /icons/armor/
| Filename              | Armor type                           | Suggested search                    |
|-----------------------|--------------------------------------|-------------------------------------|
| shield.svg            | Shield (any)                         | "shield"                            |
| heavy-armor.svg       | Heavy armor (plate, chain)           | "armor"                             |
| medium-armor.svg      | Medium armor (scale, chain shirt)    | "chain mail"                        |
| light-armor.svg       | Light armor (leather, studded)       | "leather armor"                     |
| helmet.svg            | Helmet                               | "helmet"                            |
| crown.svg             | Crown, Circlet                       | "crown"                             |

## /icons/accessories/
| Filename              | Slot                                 | Suggested search                    |
|-----------------------|--------------------------------------|-------------------------------------|
| ring.svg              | ring, ring_2                         | "ring"                              |
| amulet.svg            | amulet                               | "amulet" / "pendant"                |
| cloak.svg             | cloak                                | "cloak" / "cape"                    |
| gloves.svg            | gloves                               | "gauntlet" / "glove"                |
| boots.svg             | boots                                | "boots"                             |
| goggles.svg           | eyes                                 | "goggles"                           |

## Styling notes
- game-icons.net exports icons as black SVGs on transparent background
- The `GameIcon` component in `EquipmentPaperdoll.tsx` applies `invert` to flip them white
- All icons should be the same style from the same pack for visual consistency
- Recommended size to download: SVG (vector — scales perfectly)
