# Asset Attributions

This project uses free downloadable 3D assets from Sketchfab and other open sources. Assets are used according to their listed licenses.

## Integrated Assets

| Asset | Author | Source | License | Usage |
|---|---|---|---|---|
| Roulette Table | Robilben | https://sketchfab.com/3d-models/none-18a27b0e326644a0b47887d07e0d0f99 | CC Attribution | Roulette table area |
| Low Poly Spinning Wheel | Burak Özcan | https://sketchfab.com/3d-models/low-poly-spinning-wheel-0798373d98b8424886d50bebda9a0dd0 | CC-BY-4.0 | Lucky Wheel / prize wheel |
| Simple Low Poly Casino Chips and Dices | lupas | https://sketchfab.com/3d-models/simple-low-poly-casino-chips-and-dices-f7ac7a2de860408596d989c213ea8ce6 | CC Attribution | Dice Roll mini-game prop |
| Low-Poly Gold Coin | BillieBones | https://sketchfab.com/3d-models/low-poly-gold-coin-7a40d686492545d1a6f6bd0c487f1cb9 | CC Attribution | Coin Flip mini-game prop |
| Blackjack Table | Ravi Jangid | https://sketchfab.com/3d-models/blackjack-table-baf7e3cbd14140ca81ea1a79d28fb635 | CC Attribution | Downloaded/staged for Blackjack table integration |
| Gameready Casino Scene | Katydid | https://sketchfab.com/3d-models/gameready-casino-scene-685736a30da846b4ad7f2ddb3b9a56fc | Free Standard | Full casino scene test/reference asset |

## Notes

- Downloaded from Sketchfab API using the model's downloadable archive endpoint.
- Converted/optimized to GLB using `@gltf-transform/cli`.
- No NonCommercial or NoDerivatives assets are intentionally used in the integrated build.
- `Gameready Casino Scene` is currently added as a test/reference asset first; it is Free Standard per Sketchfab API metadata and should be re-checked before production/commercial main-scene use.
- Additional metadata is stored under `assets_raw/sketchfab/*/meta.json` in the working tree.
