# Mepamo asset kit

New SVG reconstructions based on the supplied reference board and asset instructions. These are not recovered original files.

Read ASSET_INDEX.json for file mapping and design/component-geometry.json for dimensions. All SVGs have transparent canvases. Raster fallbacks are 2x resolution; artwork PNGs are exported directly from the vector artwork.

Use nodes and icons as images inside native controls. Use callouts/callout-empty.svg with live START/RESUME text. Component SVGs are visual snapshots: buttons, answers, goal values, feedback and progress must remain real HTML/CSS. code/mepamo-components.css contains the production styles. Fonts are bundled by the app.

Rebuild from the project root with node scripts/create-assets.mjs. The generation script uses @napi-rs/canvas to rasterize the vector sources.
