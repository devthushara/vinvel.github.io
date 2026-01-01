import {readdir, stat, writeFile} from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg'])

function sortKeyCustomerPhotos(name) {
  const m = /vinvel_cus_(\d+)/i.exec(name)
  if (m) return [0, Number(m[1])]
  return [1, name.toLowerCase()]
}

function sortKeyAlpha(name) {
  return [0, name.toLowerCase()]
}

async function buildManifest({dir, basePath, sortKeyFn}) {
  const entries = await readdir(dir)
  const files = []

  for (const name of entries) {
    if (name.startsWith('.')) continue
    const full = path.join(dir, name)
    const info = await stat(full)
    if (!info.isFile()) continue

    const ext = path.extname(name).toLowerCase()
    if (!ALLOWED_EXT.has(ext)) continue

    files.push(name)
  }

  files.sort((a, b) => {
    const [ka0, ka1] = sortKeyFn(a)
    const [kb0, kb1] = sortKeyFn(b)
    if (ka0 !== kb0) return ka0 - kb0
    if (typeof ka1 === 'number' && typeof kb1 === 'number') return ka1 - kb1
    return String(ka1).localeCompare(String(kb1))
  })

  return {
    basePath,
    files,
  }
}

async function writeManifest({dir, manifest}) {
  const out = path.join(dir, 'manifest.json')
  await writeFile(out, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  return out
}

async function main() {
  const customerDir = path.join(ROOT, 'img', 'customer_photos')
  const partnersDir = path.join(ROOT, 'img', 'partners')

  const customerManifest = await buildManifest({
    dir: customerDir,
    basePath: 'img/customer_photos/',
    sortKeyFn: sortKeyCustomerPhotos,
  })
  await writeManifest({dir: customerDir, manifest: customerManifest})
  console.log(`Wrote img/customer_photos/manifest.json with ${customerManifest.files.length} files`)

  const partnersManifest = await buildManifest({
    dir: partnersDir,
    basePath: 'img/partners/',
    sortKeyFn: sortKeyAlpha,
  })
  await writeManifest({dir: partnersDir, manifest: partnersManifest})
  console.log(`Wrote img/partners/manifest.json with ${partnersManifest.files.length} files`)
}

await main()
