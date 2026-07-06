# Diamond Casino Environment Design Plan

Target: GTA Online Diamond Casino inspired, but original. Production goal: believable WebGL casino, not primitive demo.

## Player Spawn / First Read

- Spawn just inside the grand entrance, facing into the casino.
- First focal point: Lucky Wheel / prize podium in the central axis.
- Secondary reads from spawn:
  - slot machine rows left/right
  - table-games pit further back
  - Inside Track lounge visible as a glowing screen zone
  - bar/lounge as social/multiplayer area

## Zones

### 1. Grand Entrance
Purpose: wow moment, orientation, social entry.
Elements:
- gold arch / doorway
- red carpet centerline
- marble floor
- velvet rope lanes
- signs pointing to Slots / Tables / Inside Track / Bar
- plants / wall panels / warm lights

### 2. Lucky Wheel Podium
Purpose: central landmark and discoverability.
Elements:
- circular podium
- proper wheel model or custom authored wheel GLB
- spotlight halo
- prize/plinth display
- visible interaction space around it

### 3. Slot Floor
Purpose: high visual density and easy interaction.
Elements:
- rows with aisles, not random machines
- real GLB slot models
- alternating variants/colors
- neon topper signs
- stool/chair per machine where performance allows
- interaction radius remains on each machine

### 4. Table Games Pit
Purpose: social gambling area.
Elements:
- real blackjack/poker table GLBs
- chairs around tables
- overhead warm lamps
- chip/card props where possible
- grouped arrangement, not isolated tables

### 5. Inside Track Lounge
Purpose: horse racing minigame / signature feature.
Elements:
- big odds/race screen
- betting terminals/counters
- horse GLB display models or animated race lane
- lounge seating
- clear separation from slot/table noise

### 6. Bar / Lounge
Purpose: multiplayer/chat social area.
Elements:
- real bar model / bottles
- stools
- ambient colored backbar lighting
- open area for players to stand/chat

## Scale Metrics

- Player eye height: 1.7m
- Slot machine: ~2.0m high
- Card table: ~0.8–1.0m high
- Main aisle: 4m wide
- Side aisle between slot rows: 2.5–3m wide
- Ceiling: 10–14m high
- Door/arch height: 4–8m for luxury scale

## Composition Rules

- Central axis: Entrance -> Carpet -> Lucky Wheel -> Table Pit
- Left/right symmetry for slots, but variants break repetition.
- Every zone needs a landmark: wheel, screen, bar, overhead lights.
- Empty walking paths are intentional; no clutter in travel lanes.
- Props cluster around activity: stools at slots, chairs at tables, bottles at bar.

## Lighting Rules

- One main shadow-casting directional light max.
- Zone lights are non-shadow emissive/point/spot lights.
- Warm gold for entrance/table pit.
- Neon colors for slots.
- Green/blue glow for Inside Track screens.
- Bar backlight uses colored bottle glow.

## Technical Rules

- Visible major props should be GLB models, not primitives.
- Primitives are acceptable for floor/walls/colliders/trim only.
- Load each GLB once; instantiate clones.
- Keep GLB budget mobile-conscious.
- Avoid raw Sketchfab archives in deployment.
- Maintain ATTRIBUTIONS.md for CC-BY assets.
