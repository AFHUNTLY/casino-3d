# Asset Attributions

This project uses free downloadable 3D assets from Sketchfab and other open sources. Assets are used according to their listed licenses.

## Integrated Assets

| Asset | Author | Source | License | Usage |
|---|---|---|---|---|
| Roulette Table | Robilben | https://sketchfab.com/3d-models/none-18a27b0e326644a0b47887d07e0d0f99 | CC Attribution | Roulette table area |
| Gameready Casino Scene | Katydid | https://sketchfab.com/3d-models/gameready-casino-scene-685736a30da846b4ad7f2ddb3b9a56fc | Free Standard | Full casino scene test/reference asset |

## Notes

- Downloaded from Sketchfab API using the model's downloadable archive endpoint.
- Converted/optimized to GLB using `@gltf-transform/cli`.
- No NonCommercial or NoDerivatives assets are intentionally used in the integrated build.
- `Gameready Casino Scene` is currently added as a test/reference asset first; it is Free Standard per Sketchfab API metadata and should be re-checked before production/commercial main-scene use.
- Additional metadata is stored under `assets_raw/sketchfab/*/meta.json` in the working tree.
