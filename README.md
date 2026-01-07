# vinvel.github.io
lets sell cars

## Shareable car links (WhatsApp/Facebook previews)

Social apps (WhatsApp/Facebook) do not run page JavaScript when generating link previews. To support rich previews, this site uses a Netlify Function that returns Open Graph/Twitter meta tags.

- Share URL format: `/c/<sanityCarId>`
- Netlify redirect: `/c/*` -> `/.netlify/functions/car-share?id=:splat` (HTTP 200)
- Function: `netlify/functions/car-share.cjs`

The share URL redirects humans to `cars.html?car=<id>` or `auction.html?car=<id>`, but the meta tags are on the `/c/<id>` response (what scrapers read).

### Local testing

- Run Netlify dev: `npm run dev`
- Open preview (no redirect): `http://localhost:8888/c/<id>?debug=1`
- Or inspect raw function output:
	`http://localhost:8888/.netlify/functions/car-share?id=<id>&debug=1`

You can also verify meta output in the terminal:

- `npm run verify:share -- <id>`

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
