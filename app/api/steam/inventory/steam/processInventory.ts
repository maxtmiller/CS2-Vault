import type { InventoryItem } from "@/lib/steam-api"
import CRC32 from 'crc-32'
import protobuf from 'protobufjs'
import path from 'path'
import { ItemData, SkinData, PriceData } from "@/lib/data-loader"
import { fetchData, getFullItemData, getFullPriceData, getFullSkinData } from "@/lib/data-loader"
import fs from "fs"
import { Item } from "@radix-ui/react-accordion"


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


let full_item_data: ItemData;
let full_price_data: PriceData;
let full_skin_data: SkinData;


async function generateInspectLinkFromObject(props: any): Promise<string | null> {
    const previewLink = "steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20";
  
    function floatToBytes(floatValue: number): number {
        const floatArray = new Float32Array(1);
        floatArray[0] = floatValue;
        const byteArray = new Uint32Array(floatArray.buffer);
        return byteArray[0];
    }

    async function generateHex(props: any): Promise<string> {
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
  
        const filePath = path.join(process.cwd(), 'public/econ.proto');
        const root = await protobuf.load(filePath);
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


function appendStickers(data: any) {
    if (!data.asset_accessories) return data;

    const item_type = data.tags.find((t: any) => t.category === "Type");
    if (item_type == "Agent") return data;

    // Find the sticker_info entry
    const stickerInfoEntry = data.descriptions.find((d: any) => d.name === "sticker_info");


    // let stickerNames = [];
    // if (stickerInfoEntry) {
    // // The names are after "Sticker: " and separated by commas in the HTML content
    // const value = stickerInfoEntry.value;

    // // Extract the last line inside the <center>...</center>
    // const match = value.match(/<center>.*?Sticker:\s*(.*?)<\/center>/s);
    //     if (match && match[1]) {
    //         // Split by commas and trim spaces
    //         stickerNames = match[1].split(',').map((s: any) => s.trim());
    //     }
    // }

    // console.log(stickerNames)
    
    let stickerNames = [];
    if (stickerInfoEntry) {
    const value = stickerInfoEntry.value;

    // Find the substring between ">Sticker:" and "</center></div>"
    const start = value.indexOf('>Sticker:');
    const end = value.indexOf('\u003C/center\u003E\u003C/div\u003E');

    if (start !== -1 && end !== -1 && end > start) {
        const stickerListStr = value.slice(start + '>Sticker:'.length, end).trim();
        // Split by commas and trim each name
        stickerNames = stickerListStr.split(',').map(s => s.trim());
    }
    }

    console.log(stickerNames);

    let stickers: any[] = [];
    stickerNames.forEach((sticker: string, index: number) => {
        const sticker_name = "Sticker | " + sticker;

        const item = Object.values(full_item_data).find(
            (item: any) => item.market_hash_name === sticker_name
        );

        if (!item) return; // skip if not found

        const sticker_data = {
            name: sticker_name,
            slot: index,
            offset_x: null,
            offset_y: null,
            rotation: null,
            scale: null,
            image: (item as any).image,
            steam_price: full_price_data[sticker_name]?.steam?.last_ever ?? null,
            sticker_id: (item as any)?.id.split("sticker-")[1]
        };

        stickers.push(sticker_data);
    });


    return { ...data, stickers };
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


function findFloatRange(float: any) {

    const floatRanges = [
        { min: 0.00, max: 0.01 },
        { min: 0.00, max: 0.02 },
        { min: 0.00, max: 0.03 },
        { min: 0.00, max: 0.04 },
        { min: 0.00, max: 0.07 },
        { min: 0.07, max: 0.08 },
        { min: 0.07, max: 0.09 },
        { min: 0.07, max: 0.10 },
        { min: 0.07, max: 0.15 },
        { min: 0.15, max: 0.18 },
        { min: 0.15, max: 0.21 },
        { min: 0.15, max: 0.24 },
        { min: 0.15, max: 0.27 },
        { min: 0.15, max: 0.38 },
        { min: 0.38, max: 0.39 },
        { min: 0.38, max: 0.40 },
        { min: 0.38, max: 0.41 },
        { min: 0.38, max: 0.42 },
        { min: 0.38, max: 0.45 },
        { min: 0.45, max: 0.50 },
        { min: 0.45, max: 0.60 },
        { min: 0.45, max: 0.70 },
        { min: 0.45, max: 0.80 },
        { min: 0.45, max: 0.90 },
        { min: 0.45, max: 1.00 }
    ];

    for (const range of floatRanges) {
        if (float >= range.min && float < range.max) {
            return range;
        }
    }
    return null;
}


async function processItemData2(data: any, steamid: string): Promise<any | null> {

    if (!data) {
        return null;
    }

    // Extract item name
    let name = data.name || "Unknown Item";
    if (data.name.includes("StatTrak™")) {
        name = data.name.split("StatTrak™ ")[1]
    } else if (data.name.includes("Souvenir")) {
        name = data.name.split("Souvenir ")[1]
    }

    const is_stattrak = data.type.includes("StatTrak™");
    const is_souvenir = data.type.includes("Souvenir");

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

    custom_name = data.asset_properties[0]?.find((p: any) => p.propertyid === 5)?.string_value || null;
    paint_wear = parseFloat(data.asset_properties?.[0]?.find((p: any) => p.propertyid === 2)?.float_value ?? null);
    paint_seed = Number(data.asset_properties[0]?.find((p: any) => p.propertyid === 1)?.int_value ?? null);

    let wearMatch = data.market_hash_name.match(/\(([^)]+)\)$/)
    wear_name = wearMatch ? wearMatch[1] : null;

    if (data.tags) {

        if (data.type.includes("Contraband")) {
            rarity_name = "Contraband"
        } else if (data.type.includes("Covert")) {
            rarity_name = "Covert"
        } else if (data.type.includes("Classified")) {
            rarity_name = "Classified"
        } else if (data.type.includes("Restricted")) {
            rarity_name = "Restricted"
        } else if (data.type.includes("Mil-Spec Grade")) {
            rarity_name = "Mil-Spec Grade"
        } else if (data.type.includes("Industrial Grade")) {
            rarity_name = "Industrial Grade"
        } else if (data.type.includes("Consumer Grade")) {
            rarity_name = "Consumer Grade"
        } else if (data.type.includes("Base Grade")) {
            rarity_name = "Base Grade"
        } else if (data.type.includes("Extraordinary")) {
            rarity_name = "Extraordinary"
        } else if (data.type.includes("Exotic")) {
            rarity_name = "Exotic"
        } else if (data.type.includes("Remarkable")) {
            rarity_name = "Remarkable"
        } else if (data.type.includes("High Grade")) {
            rarity_name = "High Grade"
        } else if (data.type.includes("Master")) {
            rarity_name = "Master"
        } else if (data.type.includes("Superior")) {
            rarity_name = "Superior"
        } else if (data.type.includes("Exceptional")) {
            rarity_name = "Exceptional"
        } else if (data.type.includes("Distinguished")) {
            rarity_name = "Distinguished"
        }

        if (data.type.includes("Sniper Rifle") || data.type.includes("SMG") || data.type.includes("Rifle") || data.type.includes("Shotgun") || data.type.includes("Pistol") || (data.type.includes("Equipment") && data.name.includes("Zeus")) || data.type.includes("Gloves") || data.type.includes("Knife")) {
            if (data.type.includes("SMG")) {
                type = "SMGs"
            } else if (data.type.includes("Rifle") || data.type.includes("Sniper Rifle")) {
                type = "Rifles"
            } else if (data.type.includes("Shotgun")) {
                type = "Heavy";
            } else if (data.type.includes("Pistol")) {
                type = "Pistols"
            } else if (data.type.includes("Gloves")) {
                type = "★ Gloves"
            } else if (data.type.includes("Knife")) {
                type = "★ Knives"
                if (data.tags?.[5]?.localized_tag_name === "Not Painted") {
                    paint_index = 0;
                    wear_name = "Not Painted";
                }
            } else if (data.type.includes("Equipment") && data.name.includes("Zeus")) {
                type = "Equipment";
            }
            category = "weapon"
        } else if (data.type.includes("Container")) {
            if (data.name.includes("Case")) {
                type = "Case"
            }
            if (data.name.includes("Capsule")) {
                if (data.name.includes("Autograph")) {
                    type = "Autograph Capsule"
                } else if (data.name.includes("Sticker")) {
                    type = "Sticker Capsule"
                }
            }
            category = "container";
        } else if (data.type.includes("Agent")) {
            category = "agent"
            type = "Agent";
        } else if (data.type.includes("Sticker")) {
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
        paint_index = item?.paint_index ? Number.parseInt((item as any).paint_index) : 0;
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
        const floatRange = findFloatRange(wear_name);
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
        } else if (paint_index == 0) {
            encodedString = encodeURIComponent(`${name}`)
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
    const imageUrl = data.icon_url
        ? `https://community.cloudflare.steamstatic.com/economy/image/${data.icon_url}/330x192`
        : "/placeholder.svg?height=200&width=200";

    const inspect_link = await generateInspectLinkFromObject(data as InspectItem);

    let price;
    if (wear_name) {
        let title;
        if (is_stattrak) {
            title = `StatTrak™ ${name} (${wear_name})`;
        } else if (is_souvenir) {
            title = `Souvenir ${name} (${wear_name})`;
        } else if (paint_index == 0) {
            title = `${name}`;
            name += " | Vanilla"
        } else {
            title = `${name} (${wear_name})`;
        }
        price = title in full_price_data ? full_price_data[title] : 0;
    } else {
        price = name in full_price_data ? full_price_data[name] : 0;
    }

    const item_data = {
        id: data.classid+data.instanceid,
        accountid: steamid,
        name,
        rarity_name,
        type,
        category,
        csfloat: CSFloat,
        quantity: data.quantity,
        steam: SteamMarket,
        icon_url: imageUrl || "",
        inspect_link,
        steam_price: price ? price.steam.last_ever : null,
        is_tradable: true,
        def_index,
        custom_name: null,
        rarity,
        inventory: 1,
        location: "Inventory",
    };

    const weapon_data = {
        stickers: data?.stickers || [],
        wear_name,
        is_souvenir,
        is_stattrak,
        paint_index,
        paint_seed,
        paint_wear,
    };

    const sticker_data = {
        sticker_id,
    }

    return category == "weapon" ? {...item_data, ...weapon_data} : category == "sticker" ? {...item_data, ...sticker_data} : item_data;
}


async function appendInfo(mergedData: string, steamId: string) {

    try {
        const jsonData = mergedData;
        const items = JSON.parse(jsonData);

        for (let i = 0; i < items.length; i++) {
            let item = items[i];

            item = appendStickers(item);
            const new_data = await processItemData2(item, steamId);

            if (new_data) {
                items[i] = new_data;
            } else {
                items.splice(i, 1);
                i--;
            }
        }

        return JSON.stringify(items, null, 2);
    } catch (error) {
        console.error('Error processing items: ', error);
    }
}


function appendProperties(assets: any, descriptions: any, asset_properties: any) {
    // remove untradable items
    descriptions = descriptions.filter((item: any) => item.tradable !== 0);

    // group assets by classid+instanceid
    const assetGroups = new Map();

    for (const asset of assets) {
        const key = `${asset.classid}-${asset.instanceid}`;
        if (!assetGroups.has(key)) assetGroups.set(key, []);
        assetGroups.get(key).push(asset);
    }

    // map assetid → property object
    const propertyMap = new Map();
    for (const prop of asset_properties) {
        propertyMap.set(prop.assetid, prop);
    }

    // process descriptions
    return descriptions.map((desc: any) => {
        const key = `${desc.classid}-${desc.instanceid}`;
        const matchingAssets = assetGroups.get(key) || [];

        // quantity is number of duplicates (default 1)
        const quantity = matchingAssets.length || 1;

        // collect merged accessories + props
        const mergedAccessories = [];
        const mergedProperties = [];

        for (const asset of matchingAssets) {
            const props = propertyMap.get(asset.assetid);
            if (!props) continue;

            if (props.asset_accessories) {
                mergedAccessories.push(props.asset_accessories);
            }
            if (props.asset_properties) {
                mergedProperties.push(props.asset_properties);
            }
        }

        return {
            ...desc,
            quantity,
            asset_accessories: mergedAccessories,
            asset_properties: mergedProperties,
        };
    });
}


export async function processInventoryData(data: any, steamId: string): Promise<any> {
    const { assets, descriptions, asset_properties } = data;

    if (!assets || !descriptions) {
        return [];
    }

    await fetchData();

    full_item_data = getFullItemData()
    full_price_data = getFullPriceData()
    full_skin_data = getFullSkinData()

    const raw_data = appendProperties(assets, descriptions, asset_properties);
    
    const processed_data = await appendInfo(JSON.stringify(raw_data), steamId);

    function writePrettyJsonFile(jsonString: any, filePath: string) {
        const obj = JSON.parse(jsonString);
        const pretty = JSON.stringify(obj, null, 2);

        fs.writeFileSync(filePath, pretty, "utf-8");
    }
    writePrettyJsonFile(processed_data, "./output.json");

    return { success: true, item_data: processed_data, steamID: steamId, storage_units: [] };
}
