# vinvel.github.io
lets sell cars

## Customer photo handover strip

GitHub Pages is static hosting, so the browser cannot list files inside `img/customer_photos/` at runtime.

This site loads images/logos from build-generated manifest files:

- `img/customer_photos/manifest.json`
- `img/partners/manifest.json`

### Netlify deploy (auto)

If you deploy on Netlify, `img/customer_photos/manifest.json` is regenerated automatically on every deploy via:

It also regenerates `img/partners/manifest.json` the same way.

- `package.json` build script: `npm run build`
- Netlify config: `netlify.toml`

To regenerate locally (same as Netlify):

- `npm run build`
