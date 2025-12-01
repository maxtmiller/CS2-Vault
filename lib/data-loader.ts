import fs from "fs"
import path from "path"


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


let itemDataCache: ItemData | null = null
let priceDataCache: PriceData | null = null
let skinDataCache: SkinData | null = null


export function loadDataFromBackup<T>(filename: string): T {
  try {
    const filePath = path.join(process.cwd(), "public", "backup", filename)
    const fileContents = fs.readFileSync(filePath, "utf8")
    return JSON.parse(fileContents) as T
  } catch (error) {
    console.error(`Error loading ${filename}:`, error)
    return {} as T
  }
}



export function getItemDataBackup(): ItemData {
  if (!itemDataCache) {
    itemDataCache = loadDataFromBackup<ItemData>("item_data.json")
  }
  return itemDataCache
}

export function getPriceDataBackup(): PriceData {
  if (!priceDataCache) {
    priceDataCache = loadDataFromBackup<PriceData>("price_data.json")
  }
  return priceDataCache
}

export function getSkinDataBackup(): SkinData {
  if (!skinDataCache) {
    skinDataCache = loadDataFromBackup<SkinData>("skins_data.json")
  }
  return skinDataCache
}

async function loadDataFromURL<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch data from ${url}: ${response.statusText}`);
  }
  return response.json();
}


export async function getItemDataURL(): Promise<ItemData> {
  if (!itemDataCache) {
    itemDataCache = await loadDataFromURL<ItemData>("https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/all.json");
  }
  return itemDataCache;
}

export async function getPriceDataURL(): Promise<PriceData> {
  if (!priceDataCache) {
    priceDataCache = await loadDataFromURL<PriceData>("https://raw.githubusercontent.com/ByMykel/counter-strike-price-tracker/main/static/prices/latest.json");
  }
  return priceDataCache;
}

export async function getSkinDataURL(): Promise<SkinData> {
  if (!skinDataCache) {
    skinDataCache = await loadDataFromURL<SkinData>("https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json");
  }
  return skinDataCache;
}


let full_item_data: ItemData;
let full_price_data: PriceData;
let full_skin_data: SkinData;


async function fetchURLData() {
  [full_item_data, full_price_data, full_skin_data] = await Promise.all([
      getItemDataURL(),
      // getPriceDataURL(),
      getPriceDataBackup(),
      getSkinDataURL(),
  ]);
}  

async function fetchBackupData() {
  [full_item_data, full_price_data, full_skin_data] = await Promise.all([
      getItemDataBackup(),
      getPriceDataBackup(),
      getSkinDataBackup(),
  ]);
}

export function getFullItemData() {
  return full_item_data;
}

export function getFullPriceData() {
  return full_price_data;
}

export function getFullSkinData() {
  return full_skin_data;
}


export async function fetchData() {
  try {
    await fetchURLData();
    console.log("Fetched main data json successfully.");
  } catch (error) {
      console.error("Error fetching main data, attempting backup...", error);
      try {
        await fetchBackupData();
        console.log("Fetched backup data successfully.");
      } catch (backupError) {
        console.error("Error fetching backup data as well.", backupError);
        return [];
      }
  }
}
