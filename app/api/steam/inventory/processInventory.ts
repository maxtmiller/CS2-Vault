import type { InventoryItem } from "@/lib/steam-api"
import CRC32 from 'crc-32';
import protobuf from 'protobufjs';
import fs from 'fs';

interface CS2Sticker {
    slot: number;
    sticker_id: number;
    wear: number | null;
    scale: number | null;
    rotation: number | null;
    offset_x: number | null;
    offset_y: number | null;
}

interface InspectItem {
    def_index: number;
    id: string;
    account_id: number;
    inventory: number;
    quantity: number;
    custom_name: string | null;
    rarity: number;
    quality: number;
    location: string;
    sticker_id?: number;
    paint_index: number;
    paint_seed: number;
    paint_wear: number;
    wear_name: string;
    stickers?: CS2Sticker[];
    is_stattrak?: boolean;
    is_souvenir?: boolean;
}

interface Action {
    link: string;
    name: string;
  }
  
  interface Description {
    type?: string;
    value: string;
    color?: string;
    name: string;
  }
  
  interface Tag {
    category: string;
    internal_name: string;
    localized_category_name: string;
    localized_tag_name: string;
    color?: string;
  }
  
interface SkinItem {
    appid: number;
    classid: string;
    instanceid: string;
    currency: number;
    background_color: string;
    icon_url: string;
    descriptions: Description[];
    tradable: number;
    actions?: Action[];
    name: string;
    name_color: string;
    type: string;
    market_name: string;
    market_hash_name: string;
    market_actions?: Action[];
    commodity: number;
    market_tradable_restriction: number;
    market_marketable_restriction: number;
    marketable: number;
    tags: Tag[];
  }

const full_item_data = JSON.parse(fs.readFileSync('public/item_data.json', 'utf8'));
const full_price_data = JSON.parse(fs.readFileSync('public/price_data.json', 'utf8'));
const full_skin_data = JSON.parse(fs.readFileSync('public/skins_data.json', 'utf8'));

async function generateInspectLinkFromObject(props: InspectItem): Promise<string | null> {
    const previewLink = "steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20";
  
    function floatToBytes(floatValue: number): number {
        const floatArray = new Float32Array(1);
        floatArray[0] = floatValue;
        const byteArray = new Uint32Array(floatArray.buffer);
        return byteArray[0];
    }
  
    async function generateHex(props: InspectItem): Promise<string> {
        const stickers: CS2Sticker[] = props.stickers || [];
  
        const econ = {
            defindex: props.def_index,
            paintindex: props.paint_index,
            paintseed: props.paint_seed,
            rarity: props.rarity,
            paintwear: floatToBytes(props.paint_wear),
            customname: props.custom_name || "",
            stickers: stickers.map(sticker => ({
                ...sticker,
                stickerId: sticker.sticker_id,
                rotation: sticker.rotation === undefined ? 0 : sticker.rotation,
            })),
        };
  
        const root = await protobuf.load('./public/econ.proto');
        const CEconItemPreviewDataBlock = root.lookupType('CEconItemPreviewDataBlock');
  
        const errMsg = CEconItemPreviewDataBlock.verify(econ);
        if (errMsg) throw new Error(errMsg);
  
        let payload = CEconItemPreviewDataBlock.encode(econ).finish();
  
        payload = Buffer.concat([Uint8Array.from([0]), payload]);
  
        let crc = CRC32.buf(payload);
  
        const x_crc = (crc & 0xffff) ^ (CEconItemPreviewDataBlock.encode(econ).finish().length * crc);
  
        const crcBuffer = Buffer.alloc(4);
        crcBuffer.writeUInt32BE((x_crc & 0xffffffff) >>> 0, 0);
  
        const buffer = Buffer.concat([payload, crcBuffer]);
  
        return buffer.toString("hex").toUpperCase();
    }
  
    const hex = await generateHex(props);
  
    return `${previewLink}${hex}`;
}

function getRarityNum(rarity_name: string) {
    const rarity_names =  [
        { name: "Stock Grade", num: 0},
        { name: "Consumer Grade", num: 1},
        { name: "Industrial Grade", num: 2},
        { name: "Mil-Spec Grade", num: 3},
        { name: "Restricted", num: 4},
        { name: "Classified", num: 5},
        { name: "Covert", num: 6},
        { name: "Contraband", num: 7},
        { name: "Extraordinary", num: 99},
        { name: "Gold", num: 99},
    ];

    for (const rarity of rarity_names) {
        if (rarity_name === rarity.name) {
            return rarity.num;
        }
    }
    return null;
}

function getFloatRange(wear_name: string) {

    const floatRanges = [
        { min: 0.00, max: 0.07, name: 'Factory New' },
        { min: 0.07, max: 0.15, name: 'Minimal Wear' },
        { min: 0.15, max: 0.38, name: 'Field-Tested' },
        { min: 0.38, max: 0.45, name: 'Well-Worn' },
        { min: 0.45, max: 1.00, name: 'Battle-Scarred' }
    ];

    for (const range of floatRanges) {
        if (wear_name === range.name) {
            return { min: range.min, max: range.max };
        }
    }
    return { min: 0, max: 1 };
}

async function processItemData(desc: any, key: string, steamId: string): Promise<any | null> {

    if (!desc || desc.tradable === 0) {
        return null;
    }

    // Extract item name
    let name = desc.name || desc.name || "Unknown Item";
    if (desc.name.includes("StatTrak™")) {
        name = desc.name.split("StatTrak™ ")[1]
    } else if (desc.name.includes("Souvenir")) {
        name = desc.name.split("Souvenir ")[1]
    }

    const is_stattrak = desc.type.includes("StatTrak™");
    const is_souvenir = desc.type.includes("Souvenir");

    // Extract exterior (wear) from tags
    let wear_name = null;
    let rarity_name = "Base Grade";
    let type = "Other";
    let category = "other";
    let custom_name;
    let sticker_id;
    let paint_index;
    let paint_seed = 500;
    let def_index;
    let rarity;
    let paint_wear;


    if (desc.tags) {
        if (desc.descriptions && desc.descriptions[0].name && desc.descriptions[0].name === "exterior_wear") {
            wear_name = desc.descriptions[0].value.split("Exterior: ")[1]
        }

        if (desc.descriptions && desc.descriptions[2].name && desc.descriptions[2].name === "nametag") {
            custom_name = desc.descriptions[2].value.split("Name Tag:")[1]
        }

        if (desc.type.includes("Contraband")) {
            rarity_name = "Contraband"
        } else if (desc.type.includes("Covert")) {
            rarity_name = "Covert"
        } else if (desc.type.includes("Classified")) {
            rarity_name = "Classified"
        } else if (desc.type.includes("Restricted")) {
            rarity_name = "Restricted"
        } else if (desc.type.includes("Mil-Spec Grade")) {
            rarity_name = "Mil-Spec Grade"
        } else if (desc.type.includes("Industrial Grade")) {
            rarity_name = "Industrial Grade"
        } else if (desc.type.includes("Consumer Grade")) {
            rarity_name = "Consumer Grade"
        } else if (desc.type.includes("Base Grade")) {
            rarity_name = "Base Grade"
        } else if (desc.type.includes("Extraordinary")) {
            rarity_name = "Extraordinary"
        } else if (desc.type.includes("Exotic")) {
            rarity_name = "Exotic"
        } else if (desc.type.includes("Remarkable")) {
            rarity_name = "Remarkable"
        } else if (desc.type.includes("High Grade")) {
            rarity_name = "High Grade"
        } else if (desc.type.includes("Master")) {
            rarity_name = "Master"
        } else if (desc.type.includes("Superior")) {
            rarity_name = "Superior"
        } else if (desc.type.includes("Exceptional")) {
            rarity_name = "Exceptional"
        } else if (desc.type.includes("Distinguished")) {
            rarity_name = "Distinguished"
        }

        if (desc.type.includes("Sniper Rifle") || desc.type.includes("SMG") || desc.type.includes("Rifle") || desc.type.includes("Shotgun") || desc.type.includes("Pistol") || desc.type.includes("Gloves") || desc.type.includes("Knife")) {
            if (desc.type === "SMG") {
                type = "SMGs"
            } else if (desc.type.includes("Rifle") || desc.type.includes("Sniper Rifle")) {
                type = "Rifles"
            } else if (desc.type.includes("Shotgun")) {
                type = "Heavy";
            } else if (desc.type.includes("Pistol")) {
                type = "Pistols"
            } else if (desc.type.includes("Gloves")) {
                type = "★ Gloves"
            } else if (desc.type.includes("Knife")) {
                type = "★ Knives"
            }
            category = "weapon"
        } else if (desc.type.includes("Container")) {
            if (desc.name.includes("Case")) {
                type = "Case"
            }
            if (desc.name.includes("Capsule")) {
                if (desc.name.includes("Autograph")) {
                    type = "Autograph Capsule"
                } else if (desc.name.includes("Sticker")) {
                    type = "Sticker Capsule"
                }
            }
            category = "container";
        } else if (desc.type.includes("Agent")) {
            category = "agent"
            type = "Agent";
        } else if (desc.type.includes("Sticker")) {
            type = "Other"
            category = "sticker"
        }
    }

    if (category === "sticker") {
        const item = Object.values(full_item_data).find(
            (item) => (item as any).market_hash_name === name
        );
        type = (item as any).type;
        sticker_id = Number.parseInt((item as any).id.split("sticker-")[1])
        def_index = 1209
    } else if (category === "weapon") {
        const item = Object.values(full_skin_data).find(
            (item) => (item as any).name === name
        );
        paint_index = Number.parseInt((item as any).paint_index)
        def_index = Number.parseInt((item as any).weapon.weapon_id)
        rarity = getRarityNum(rarity_name);
    } else if (category === "container") {
        const item = Object.values(full_item_data).find(
            (item) => (item as any).name === name
        );
        def_index = Number.parseInt((item as any).id.split("crate-")[1])
    } else if (category === "agent") {
        const item = Object.values(full_item_data).find(
            (item) => (item as any).name === name
        );
        def_index = Number.parseInt((item as any).id.split("agent-")[1])
    } else {
        def_index = 1
    }
    
    let CSFloat;
    if (paint_index) {
        let category;
        if (is_souvenir == true) {
            category = 3;
        } else if (is_stattrak == true) {
            category = 2;
        } else {
            category = 1;
        }
        const floatRange = getFloatRange(wear_name);
        paint_wear = (floatRange?.max || 1 - floatRange?.min || 0) / 2;
        CSFloat = `https://csfloat.com/search?sort_by=lowest_price&category=${category}&min_float=${floatRange?.min || 0}&max_float=${floatRange?.max || 1}&def_index=${def_index}&paint_index=${paint_index}`
    } else if (sticker_id) {
        CSFloat = `https://csfloat.com/search?sort_by=lowest_price&sticker_index=${sticker_id}`
    } else {
        CSFloat = `https://csfloat.com/search?sort_by=lowest_price&def_index=${def_index}`
    }

    let SteamMarket;
    if (paint_index) {
        let encodedString;
        if (is_souvenir == true) {
            encodedString = encodeURIComponent(`Souvenir ${name} (${wear_name})`)
                .replace(/\(/g, "%28")
                .replace(/\)/g, "%29");
        } else if (is_stattrak == true) {
            encodedString = encodeURIComponent(`StatTrak™ ${name} (${wear_name})`)
                .replace(/\(/g, "%28")
                .replace(/\)/g, "%29");
        } else {
            encodedString = encodeURIComponent(`${name} (${wear_name})`)
                .replace(/\(/g, "%28")
                .replace(/\)/g, "%29");
        }
        SteamMarket = `https://steamcommunity.com/market/listings/730/${encodedString}`
    } else {
        const encodedString = encodeURIComponent(`${name}`)
                .replace(/\(/g, "%28")
                .replace(/\)/g, "%29");
        SteamMarket = `https://steamcommunity.com/market/listings/730/${encodedString}`
    }

    // Generate image URL
    const imageUrl = desc.icon_url
        ? `https://community.cloudflare.steamstatic.com/economy/image/${desc.icon_url}/330x192`
        : "/placeholder.svg?height=200&width=200";


    let price;
    if (wear_name) {
        let title;
        if (is_stattrak) {
            title = `StatTrak™ ${name} (${wear_name})`;
        } else if (is_souvenir) {
            title = `Souvenir ${name} (${wear_name})`;
        } else {
            title = `${name} (${wear_name})`;
        }
        price = full_price_data[title];
    } else {
        price = full_price_data[name];
    }

    const weapon_data = {
        def_index,
        id: key+Math.random(),
        account_id: Number.parseInt(steamId) || 0,
        inventory: 72,
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
        steam_price: price ? price.steam.last_ever : null
    };

    const sticker_data = {
        def_index,
        sticker_id,
        id: key+Math.random(),
        account_id: Number.parseInt(steamId) || 0,
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
        steam_price: price ? price.steam.last_ever : null
    };

    const item_data = {
        def_index,
        id: key+Math.random(),
        account_id: Number.parseInt(steamId) || 0,
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
        steam_price: price ? price.steam.last_ever : null
    };

    const inspect_link = await generateInspectLinkFromObject(weapon_data as InspectItem);
    if (paint_index) {
        const final_item_data = {
            ...weapon_data,
            inspect_link: inspect_link
        };
        return final_item_data
    } else if (category === "sticker") {
        return sticker_data
    }
    return item_data
}


async function mergeData(mergedData: string) {
    try {
      const jsonData = mergedData
      let items = JSON.parse(jsonData)
  
      const groupedItems = new Map()
  
      for (const item of items) {
        const hasPaintIndex = Object.prototype.hasOwnProperty.call(item, "paint_index")
        const hasStickerId = Object.prototype.hasOwnProperty.call(item, "sticker_id")
  
        let key
        if (!hasPaintIndex && !hasStickerId) {
          key = `no-paint-no-sticker-${item.def_index}`
        } else if (!hasPaintIndex && hasStickerId) {
          key = `no-paint-with-sticker-${item.def_index}-${item.sticker_id}`
        } else {
          key = `other-${item.def_index}-${Math.random()}`
        }
  
        if (groupedItems.has(key)) {
          groupedItems.get(key).quantity += item.quantity
        } else {
          groupedItems.set(key, { ...item })
        }
      }
  
      items = Array.from(groupedItems.values())
  
      console.log("Merged items saved")
      return JSON.stringify(items, null, 2)
    } catch (error) {
      console.error("Error processing items:", error)
      return "[]"
    }
}


export async function processInventoryData(data: any, steamId: string): Promise<any> {
    const { assets, descriptions } = data;

    if (!assets || !descriptions) {
        return [];
    }

    // Create a map of description by classid and instanceid
    const descriptionMap = new Map();
    descriptions.forEach((desc: any) => {
        const key = `${desc.classid}_${desc.instanceid}`;
        descriptionMap.set(key, desc);
    });

    // Process each asset
    const inventoryItems = await Promise.all(assets
        .map(async (asset: any) => { // Add async here
            const key = `${asset.classid}_${asset.instanceid}`;
            const desc = descriptionMap.get(key);
            const data = await processItemData(desc, key, steamId);
            return data;
        })
    );

    const filteredInventory = inventoryItems.filter(Boolean) as InventoryItem[];

    // Convert the filtered array to a JSON string
    const inventoryJson = JSON.stringify(filteredInventory);

    // Call mergeData to merge the items
    const mergedJson = await mergeData(inventoryJson);

    // Parse the merged JSON string back into an array
    const mergedData = JSON.parse(mergedJson);

    try {
        fs.writeFileSync('public/full_inventory_data.json', JSON.stringify(mergedData, null, 2), 'utf-8');
        console.log('File written successfully');
    } catch (error) {
        console.error('Error writing file:', error);
    }

    return { item_data: mergedData, steamID: steamId, storage_units: [] };
}