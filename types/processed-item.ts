export interface InventoryItem {
  // Common fields for all items
  id: string
  def_index: number
  account_id: number
  inventory?: number | null
  quantity: number
  quality: number
  custom_name: string | null
  rarity: number
  rarity_name: string
  location: string
  name: string
  icon_url: string
  steam_price: number | null
  steam: string | null
  csfloat: string | null

  // Fields for skins
  paint_index?: number
  paint_seed?: number
  paint_wear?: number
  wear_name?: string
  is_stattrak?: boolean
  is_souvenir?: boolean

  // Fields for stickers
  sticker_id?: number
  type?: string

  // Computed fields for UI
  imageUrl?: string
  float_price?: number | null

  // Legacy fields for compatibility (can be removed later)
  category?: string
  tradable_after?: string | null
  stickers?: Object | null
  sttattrak_count?: number | null
  storageUnit?: string | null
  casket_id?: string | null
  inspect_link?: string | null
  reason?: string | null
  is_tradable?: boolean
}

export interface Sticker {
  name: string;
  image: string;
  steam_price?: number;
  sticker_id?: number;
}

export interface InventoryItem2 {
    name: string,
    rarity_name: string,
    type: string,
    category: string,
    csfloat: string,
    quantity: number,
    steam: string,
    icon_url: string,
    inspect_link: string,
    steam_price: number,
    is_tradable: boolean,
}

const weapon_data = {
    id: key+Math.random(),
    quantity: 1,
    custom_name: null,
    rarity: 4,
    paint_index,
    paint_seed,
    quality: 4,
    paint_wear,
    stickers: [],
    wear_name,
    is_stattrak,
    is_souvenir,
    location: "Inventory",
    name,
    rarity_name,
    type,
    category,
    csfloat: CSFloat,
    steam: SteamMarket,
    icon_url: imageUrl || "",
    inspect_link: string,
    steam_price: price ? price.steam.last_ever : null,
    is_tradable: true
};

const sticker_data = {
    sticker_id,
    id: key+Math.random(),
    inventory: 72,
    quantity: 1,
    custom_name: null,
    rarity: 4,
    quality: 4,
    location: "Inventory",
    name,
    rarity_name,
    type,
    category,
    csfloat: CSFloat,
    steam: SteamMarket,
    icon_url: imageUrl || "",
    steam_price: price ? price.steam.last_ever : null,
    is_tradable: true
};

const item_data = {
    id: key+Math.random(),
    inventory: 72,
    quantity: 1,
    custom_name: null,
    rarity: 4,
    quality: 4,
    location: "Inventory",
    name,
    rarity_name,
    type,
    category,
    csfloat: CSFloat,
    steam: SteamMarket,
    icon_url: imageUrl || "",
    steam_price: price ? price.steam.last_ever : null,
    is_tradable: true
};