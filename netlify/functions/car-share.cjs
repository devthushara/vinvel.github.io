// Netlify Function: Generates Open Graph/Twitter metadata for a single car ID
// so WhatsApp/Facebook link previews show the car's first photo.

const PROJECT_ID = 'qsql7lvj';
const DATASET = 'production';
const API_VERSION = '2023-12-16';

// Neutral placeholder (no Vinvel logo) for cars without images / missing ids.
const PLACEHOLDER_IMAGE = 'https://placehold.co/1200x630?text=Vehicle';

function escapeHtml(input) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function firstNonEmpty(list) {
  const arr = Array.isArray(list) ? list : [];
  for (const v of arr) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function extractImageDims(url) {
  const u = String(url || '');
  // Sanity CDN URLs commonly end with -{w}x{h}.ext
  const m = u.match(/-(\d+)x(\d+)\.[a-z0-9]+(?:\?|#|$)/i);
  if (!m) return null;
  const width = parseInt(m[1], 10);
  const height = parseInt(m[2], 10);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { width, height };
}

function getOrigin(headers) {
  const h = headers || {};
  const host = h.host || h.Host;
  if (!host) return '';

  const hostLower = String(host).toLowerCase();
  const isLocalhost =
    hostLower.startsWith('localhost') ||
    hostLower.startsWith('127.0.0.1') ||
    hostLower.startsWith('0.0.0.0');

  const protoHeader = h['x-forwarded-proto'] || h['X-Forwarded-Proto'] || '';
  const forwardedProto = String(protoHeader).split(',')[0].trim();

  // Netlify dev can sometimes report https for localhost. Force http locally.
  const proto = isLocalhost ? 'http' : (forwardedProto || 'https');
  return `${proto}://${host}`;
}

async function fetchCarById(carId) {
  const query = `*[_type == "car" && _id == $id][0]{
    _id,
    title,
    year,
    grade,
    status,
    stockType,
    "images": images[].asset->url
  }`;

  const url = new URL(`https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`);
  url.searchParams.set('query', query);
  url.searchParams.set('$id', JSON.stringify(String(carId)));

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data && data.result ? data.result : null;
}

exports.handler = async (event) => {
  try {
    const qs = event.queryStringParameters || {};
    const idFromQuery = String(qs.id || '').trim();
    const debug = !!qs.debug;

    let carId = idFromQuery;
    if (!carId) {
      const path = String(event.path || event.rawPath || '');
      const m = path.match(/\/c\/([^/?#]+)/);
      if (m && m[1]) {
        try {
          carId = decodeURIComponent(m[1]);
        } catch {
          carId = m[1];
        }
      }
    }
    carId = String(carId || '').trim();

    const origin = getOrigin(event.headers);

    const shareUrl = origin ? `${origin}/c/${encodeURIComponent(carId)}` : '';

    // If no id, return a generic preview that routes to inventory.
    if (!carId) {
      const fallbackUrl = origin ? `${origin}/cars.html` : '/cars.html';
      const redirectMeta = debug
        ? ''
        : `\n  <meta http-equiv="refresh" content="0; url=${escapeHtml(fallbackUrl)}" />`;
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
        body: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vinvel Motor Trading</title>
  <meta property="og:title" content="Vinvel Motor Trading" />
  <meta property="og:description" content="Vinvel Certified™ vehicles. Browse live inventory and auction picks." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(fallbackUrl)}" />
  <meta property="og:image" content="${escapeHtml(PLACEHOLDER_IMAGE)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Vinvel Motor Trading" />
  <meta name="twitter:description" content="Vinvel Certified™ vehicles. Browse live inventory and auction picks." />
  <meta name="twitter:image" content="${escapeHtml(PLACEHOLDER_IMAGE)}" />
${redirectMeta}
</head>
<body>
  <a href="${escapeHtml(fallbackUrl)}">Continue to Vinvel</a>
</body>
</html>`,
      };
    }

    const car = await fetchCarById(carId);

    const titleBase = car && car.title ? String(car.title) : 'Vinvel Vehicle';
    const year = car && car.year ? String(car.year) : '';
    const grade = car && car.grade ? String(car.grade) : '';
    const status = car && car.status ? String(car.status) : '';
    const stockType = car && car.stockType ? String(car.stockType) : '';

    const title = [titleBase, year].filter(Boolean).join(' ') + ' | Vinvel';
    const descParts = ['Vinvel Certified™ vehicle.'];
    if (grade) descParts.push(`Auction Grade: ${grade}.`);
    if (status) descParts.push(`Status: ${status}.`);
    descParts.push('Tap to view photos and details.');
    const description = descParts.join(' ');

    const images = (car && Array.isArray(car.images)) ? car.images.filter(Boolean) : [];
    const carImg1 = firstNonEmpty(images);

    // Social scrapers usually pick the FIRST og:image. Use ONLY the first car photo.
    // If a car has no images, fall back to a neutral placeholder (no Vinvel logo).
    const ogImages = [carImg1 || PLACEHOLDER_IMAGE];

    // Use relative redirects so localhost doesn't get forced into https.
    const redirectPath = stockType === 'auction'
      ? `/auction.html?car=${encodeURIComponent(carId)}`
      : `/cars.html?car=${encodeURIComponent(carId)}`;
    const redirectUrl = origin ? `${origin}${redirectPath}` : redirectPath;

    const ogUrl = shareUrl || redirectUrl;

    const primaryDims = extractImageDims(ogImages[0]);
    const ogImageTags = [
      `  <meta property="og:image" content="${escapeHtml(ogImages[0])}" />`,
      primaryDims ? `  <meta property="og:image:width" content="${escapeHtml(primaryDims.width)}" />` : '',
      primaryDims ? `  <meta property="og:image:height" content="${escapeHtml(primaryDims.height)}" />` : '',
      `  <meta property="og:image:alt" content="${escapeHtml(title)}" />`,
    ].filter(Boolean).join('\n');
    const twitterImage = ogImages[0];

    const redirectMeta = debug
      ? ''
      : `\n  <meta http-equiv="refresh" content="0; url=${escapeHtml(redirectUrl)}" />`;

    const debugBody = debug
      ? `\n<body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 16px;">\n  <h1 style="margin: 0 0 10px; font-size: 18px;">OG Preview Debug</h1>\n  <p style="margin: 0 0 10px;">This page is what WhatsApp/Facebook scrapers read. Normal shares redirect instantly.</p>\n  <p style="margin: 0 0 10px;"><a href="${escapeHtml(redirectPath)}">Continue to car page</a></p>\n  <h2 style="margin: 16px 0 8px; font-size: 14px;">Images</h2>\n  <div style="display: flex; gap: 10px; flex-wrap: wrap;">${ogImages
        .slice(0, 6)
        .map((u) => `<img src="${escapeHtml(u)}" alt="" style="width: 140px; height: 90px; object-fit: cover; border-radius: 10px; border: 1px solid rgba(0,0,0,0.12);" />`)
        .join('')}\n  </div>\n</body>`
      : `\n<body>\n  <a href="${escapeHtml(redirectPath)}">Continue to Vinvel</a>\n</body>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Keep it short so new cars/images propagate quickly.
        'Cache-Control': 'public, max-age=300',
      },
      body: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:site_name" content="Vinvel" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(ogUrl)}" />
${ogImageTags}

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(twitterImage)}" />
${redirectMeta}
</head>
${debugBody}
</html>`,
    };
  } catch {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      body: '<!doctype html><html><head><meta charset="utf-8" /><meta http-equiv="refresh" content="0; url=/cars.html" /></head><body><a href="/cars.html">Continue</a></body></html>',
    };
  }
};
