import { createClient } from 'https://esm.sh/@sanity/client'
import { createImageUrlBuilder } from 'https://esm.sh/@sanity/image-url'

// --- CONFIGURATION ---
export const client = createClient({
  projectId: 'qsql7lvj', 
  dataset: 'production',
  useCdn: true, 
  apiVersion: '2023-12-16',
})

const builder = createImageUrlBuilder(client)

// Helper: Single Image URL
export function urlFor(source) {
  if (!source) return 'https://placehold.co/800x600?text=No+Image';
  return builder.image(source)
}

// 👇👇 THIS IS THE MISSING FUNCTION CAUSING YOUR ERROR 👇👇
export function getCarImages(sanityImageArray) {
  if (!sanityImageArray || sanityImageArray.length === 0) {
    return ["https://placehold.co/800x600?text=No+Image"];
  }
  return sanityImageArray.map(img => builder.image(img).width(1200).url());
}
// 👆👆 YOU MUST HAVE THIS FOR CARS.HTML TO WORK 👆👆

// --- DATA FETCHING ---

export async function getFeaturedCars() {
  const query = `*[_type == "car" && stockType == "inventory" && status != "Sold"] | order(priority desc, _createdAt desc)[0...3]{
    _id, title, year, mileage, engine, price, hidePrice, status, images
  }`
  return await client.fetch(query)
}

export async function getInventory() {
  const query = `*[_type == "car" && stockType == "inventory"] | order(_createdAt desc)`
  return await client.fetch(query)
}

export async function getAuctionPicks() {
  const query = `*[_type == "car" && stockType == "auction"] | order(auctionDate asc)`
  return await client.fetch(query)
}