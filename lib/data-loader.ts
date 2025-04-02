import fs from "fs"
import path from "path"

// Define types for your data structures

interface Weapon {
  id: string;
  weapon_id: number;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface Pattern {
  id: string;
  name: string;
}

interface Wear {
  id: string;
  name: string;
}

interface Style {
  id: number;
  name: string;
  url: string;
}

interface Crate {
  id: string;
  name: string;
  image: string;
}

interface Collection {
  id: string;
  name: string;
  image: string;
}
interface Rarity {
  id: string;
  name: string;
  color: string;
}

interface Team {
  id: string;
  name: string;
}

interface Skin {
  [key: string]: {
    id: string;
    skin_id: string;
    name: string;
    description: string;
    weapon: Weapon;
    category: Category;
    pattern: Pattern;
    min_float: number;
    max_float: number;
    wear: Wear;
    stattrak: boolean;
    souvenir: boolean;
    paint_index: string;
    rarity: Rarity;
    market_hash_name: string;
    team: Team;
    style: Style;
    legacy_model: boolean;
    image: string;
  }
}

interface Sticker {
  [key: string]: {
    id: string;
    name: string;
    description: string;
    rarity: Rarity;
    crates: Crate[];
    tournament_event: string;
    tournament_team: string;
    type: string;
    market_hash_name: string;
    effect: string;
    image: string;
  }
}

export interface Agent {
  [key: string]: {
    id: string;
    name: string;
    description: string;
    rarity: Rarity;
    collections: Collection[];
    team: Team;
    market_hash_name: string;
    image: string;
    model_player: string;
  }
}

export type ItemData = Skin | Sticker | Agent;


export interface SkinData {
  [key: string]: {
    id: string;
    skin_id: string;
    name: string;
    description: string;
    weapon: Weapon;
    category: Category;
    pattern: Pattern;
    min_float: number;
    max_float: number;
    rarity: Rarity;
    stattrak: boolean;
    souvenir: boolean;
    paint_index: string;
    wears: Wear[];
    collections: Collection[],
    crates: Crate[],
    team: Team;
    style: Style;
    legacy_model: boolean;
    image: string;
  }
}

export interface PriceData {
  [key: string]: {
    steam: {
      last_24h: number
      last_7d: number
      last_30d: number
      last_90d: number
      last_ever: number
    }
  }
}

// Function to load data with proper error handling
// export function loadData<T>(filename: string): T {
//   try {
//     const filePath = path.join(process.cwd(), "public", filename)
//     const fileContents = fs.readFileSync(filePath, "utf8")
//     return JSON.parse(fileContents) as T
//   } catch (error) {
//     console.error(`Error loading ${filename}:`, error)
//     return {} as T
//   }
// }

// // Cache the data to avoid reading from disk on every request
// let itemDataCache: ItemData | null = null
// let priceDataCache: PriceData | null = null
// let skinDataCache: SkinData | null = null

// export function getItemData(): ItemData {
//   if (!itemDataCache) {
//     itemDataCache = loadData<ItemData>("item_data.json")
//   }
//   return itemDataCache
// }

// export function getPriceData(): PriceData {
//   if (!priceDataCache) {
//     priceDataCache = loadData<PriceData>("price_data.json")
//   }
//   return priceDataCache
// }

// export function getSkinData(): SkinData {
//   if (!skinDataCache) {
//     skinDataCache = loadData<SkinData>("skins_data.json")
//   }
//   return skinDataCache
// }

async function loadData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch data from ${url}: ${response.statusText}`);
  }
  return response.json();
}

let itemDataCache: ItemData | null = null;
let priceDataCache: PriceData | null = null;
let skinDataCache: SkinData | null = null;

export async function getItemData(): Promise<ItemData> {
  if (!itemDataCache) {
    itemDataCache = await loadData<ItemData>("https://bymykel.github.io/CSGO-API/api/en/all.json");
  }
  return itemDataCache;
}

export async function getPriceData(): Promise<PriceData> {
  if (!priceDataCache) {
    priceDataCache = await loadData<PriceData>("https://raw.githubusercontent.com/ByMykel/counter-strike-price-tracker/main/static/prices/latest.json");
  }
  return priceDataCache;
}

export async function getSkinData(): Promise<SkinData> {
  if (!skinDataCache) {
    skinDataCache = await loadData<SkinData>("https://bymykel.github.io/CSGO-API/api/en/skins.json");
  }
  return skinDataCache;
}
