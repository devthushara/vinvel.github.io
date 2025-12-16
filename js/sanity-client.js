import { createClient } from 'https://esm.sh/@sanity/client'
import { createImageUrlBuilder } from 'https://esm.sh/@sanity/image-url'

// --- CONFIGURATION ---
// 1. Log into https://sanity.io/manage
// 2. Create a project named "Vinvel"
// 3. Copy your Project ID and paste it below
export const client = createClient({
  projectId: 'qsql7lvj', 
  dataset: 'production',
  useCdn: true, // true = fast & cheap (cached), false = instant updates
  apiVersion: '2023-12-16',
})

const builder = createImageUrlBuilder(client)

export function urlFor(source) {
  if (!source) return 'https://placehold.co/800x600?text=No+Image';
  return builder.image(source)
}

// --- DATA FETCHING ---

export async function getFeaturedCars() {
  // CHANGED: Sort by priority (descending), then by date. 
  // We fetch 3 items.
  const query = `*[_type == "car" && stockType == "inventory" && status != "Sold"] | order(priority desc, _createdAt desc)[0...3]{
    _id, title, year, mileage, engine, price, hidePrice, status, images
  }`
  return await client.fetch(query)
}

export async function getInventory() {
  // CHANGED: Fetch ALL inventory items sorted by newest first
  const query = `*[_type == "car" && stockType == "inventory"] | order(_createdAt desc)`
  return await client.fetch(query)
}

// Fetch Auction Picks (Future Dates)
export async function getAuctionPicks() {
  const query = `*[_type == "car" && stockType == "auction"] | order(auctionDate asc) {
    _id, title, make, model, year, mileage, engine, fuel, transmission, 
    grade, status, auctionDate, price, hidePrice, images
  }`
  return await client.fetch(query)
}