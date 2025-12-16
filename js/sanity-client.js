import { createClient } from 'https://esm.sh/@sanity/client'
import imageUrlBuilder from 'https://esm.sh/@sanity/image-url'

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

const builder = imageUrlBuilder(client)

export function urlFor(source) {
  if (!source) return 'https://via.placeholder.com/800x600?text=No+Image';
  return builder.image(source)
}

// --- DATA FETCHING ---

// Fetch Top 3 Featured Cars (Ready to Ship)
export async function getFeaturedCars() {
  // Query: Type is car, Stock Type is Inventory, Status is 'Ready', Limit 3
  const query = `*[_type == "car" && stockType == "inventory" && status == "Ready to Ship"][0...3]{
    _id, title, year, mileage, engine, fuel, status, price, hidePrice, images
  }`
  return await client.fetch(query)
}

// Fetch Full Inventory (All Live Cars)
export async function getInventory() {
  const query = `*[_type == "car" && stockType == "inventory"] | order(_createdAt desc) {
    _id, title, make, model, year, mileage, engine, fuel, transmission, 
    grade, status, price, hidePrice, images
  }`
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