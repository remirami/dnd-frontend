# 2.5D Tactical Battle Tokens

Place miniature images and tokens in the subfolders below.

## Directory Structure
- `public/tokens/characters/human/`: Human class standees (`barbarian.png`, `bard.png`, `cleric.png`, `druid.png`, `fighter.png`, `monk.png`, `paladin.png`, `ranger.png`, `rogue.png`, `sorcerer.png`, `warlock.png`, `wizard.png`)
- `public/tokens/characters/{race}/`: Other races (elf, dwarf, halfling, etc.)
- `public/tokens/monsters/`: Monster tokens named by slug (e.g. `adult-red-dragon.png`, `ogre.png`, `goblin.png`, `skeleton.png`)

## Non-Transparent Images
If your images have white or light-grey backgrounds (e.g. standard HeroForge free exports):
The 2.5D token component automatically supports:
1. **Standee Vignette Mode**: Arched fantasy standee cutout with golden/crimson metallic beveled rim.
2. **Auto-Background Blend (`mix-blend-mode: multiply`)**: Naturally removes white/light-grey backgrounds on dark battlemats.
3. **Circular Pog Mode**: Round portrait cutouts with 3D beveled bases.
