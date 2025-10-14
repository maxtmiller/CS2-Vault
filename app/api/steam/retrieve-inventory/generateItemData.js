import SteamUser from 'steam-user';
import GlobalOffensive from 'globaloffensive';
import fs from 'fs';
import CRC32 from 'crc-32';
import protobuf from 'protobufjs';
import path from 'path';
import { fetchData, getFullItemData, getFullPriceData, getFullSkinData } from "@/lib/data-loader"
import { Console } from 'console';


function findFloatRange(float) {

    // const floatRanges = [
    //     { min: 0.00, max: 0.01 },
    //     { min: 0.01, max: 0.02 },
    //     { min: 0.02, max: 0.03 },
    //     { min: 0.03, max: 0.04 },
    //     { min: 0.04, max: 0.07 },
    //     { min: 0.07, max: 0.08 },
    //     { min: 0.08, max: 0.09 },
    //     { min: 0.09, max: 0.10 },
    //     { min: 0.10, max: 0.15 },
    //     { min: 0.15, max: 0.18 },
    //     { min: 0.18, max: 0.21 },
    //     { min: 0.21, max: 0.24 },
    //     { min: 0.24, max: 0.27 },
    //     { min: 0.27, max: 0.38 },
    //     { min: 0.38, max: 0.39 },
    //     { min: 0.39, max: 0.40 },
    //     { min: 0.40, max: 0.41 },
    //     { min: 0.41, max: 0.42 },
    //     { min: 0.42, max: 0.45 },
    //     { min: 0.45, max: 0.50 },
    //     { min: 0.50, max: 0.60 },
    //     { min: 0.60, max: 0.70 },
    //     { min: 0.70, max: 0.80 },
    //     { min: 0.80, max: 0.90 },
    //     { min: 0.90, max: 1.00 }
    // ];

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


let full_item_data;
let full_price_data;
let full_skin_data;


async function generateInspectLinkFromObject(props) {
    const previewLink = "steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20";

    function floatToBytes(floatValue) {
        const floatArray = new Float32Array(1);
        floatArray[0] = floatValue;
        const byteArray = new Uint32Array(floatArray.buffer);
        return byteArray[0];
    }

    async function generateHex(props) {
        const stickers = props.stickers || [];

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
                offsetX: sticker.offset_x === undefined ? 0 : sticker.offsetX,
                offsetY: sticker.offset_y === undefined ? 0 : sticker.offsetY,
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

async function mergeJsonFiles(allFiles) {
    let mergedData = [];

    for (const file of allFiles) {
        try {
            const jsonData = file;

            mergedData = [ ...jsonData, ...mergedData ];

        } catch (err) {
            console.error(`Error reading file ${file}:`, err.message);
        }
    }

    return JSON.stringify(mergedData, null, 2);
}


async function mergeData(mergedData) {

    try {
        const jsonData = mergedData;
        let items = JSON.parse(jsonData);
    
        const groupedItems = new Map();
    
        for (const item of items) {
            const hasPaintIndex = Object.prototype.hasOwnProperty.call(item, 'paint_index');
            const hasStickerId = Object.prototype.hasOwnProperty.call(item, 'sticker_id');
            const isCharm = item.def_index === 1355;
            
            let key;
            if (isCharm) {
                key = `no-paint-no-sticker-charm-${item.def_index}-${item.keychain_index}`;
            } else if (!hasPaintIndex && !hasStickerId) {
                key = `no-paint-no-sticker-${item.def_index}`;
            } else if (!hasPaintIndex && hasStickerId) {
                key = `no-paint-with-sticker-${item.def_index}-${item.sticker_id}`;
            } else {
                key = `other-${item.def_index}-${Math.random()}`;
            }
    
            if (groupedItems.has(key)) {
                groupedItems.get(key).quantity += item.quantity;
            } else {
                groupedItems.set(key, { ...item });
            }
        }
    
        items = Array.from(groupedItems.values());

        console.log('Merged items saved');
        return JSON.stringify(items, null, 2);
    } catch (error) {
        console.error('Error processing items:', error);
    }
}


async function getStickers(old_data) {
    if (old_data.stickers?.length > 0) {
        const sticker_info = [];
        old_data.stickers.map(item => {
            const sticker = Object.entries(full_item_data).find(([key]) => key.endsWith(`sticker-${item.sticker_id}`))?.[1];
            if (sticker) {
                const new_data =  {
                    sticker_id: item.sticker_id,
                    name: sticker.name,
                    image: sticker.image,
                    steam_price: full_price_data[sticker.name] ? full_price_data[sticker.name].steam.last_ever : null,
                };
                Object.assign(item, new_data);
                sticker_info.push(item);
            }
        });
        old_data.stickers = sticker_info
        return old_data;
    }
    return old_data;
}


async function getItemInfoByDefIndex(old_data) {

    if (old_data.def_index ===  1201 || (old_data.def_index === 36 && old_data.paint_index === 125)) return null;

    let item;
    if (old_data.hasOwnProperty('paint_wear') && !old_data.hasOwnProperty('paint_index')) {
        old_data.paint_index = 0;

        item = Object.values(full_skin_data).find(item => item.paint_index === null && item.weapon.weapon_id === old_data.def_index);
        if (!item) {
            return null;
        }
        let title;
        if (old_data.is_stattrak) {
            title = `StatTrak™ ${item.name}`;
        } else {
            title = `${item.name}`;
        }
        const price = full_price_data[title];
        const category = 'weapon';
        const inspect_link = await generateInspectLinkFromObject(old_data);
        let item_category;
        if (old_data.is_stattrak == true) {
            item_category = 2;
        } else {
            item_category = 1;
        }
        const CSFloat = `https://csfloat.com/search?sort_by=lowest_price&category=${item_category}&def_index=${old_data.def_index}&paint_index=0`
        let encodedString;
        if (old_data.is_stattrak == true) {
            encodedString = encodeURIComponent(`StatTrak™ ${item.name}`)
        } else {
            encodedString = encodeURIComponent(`${item.name}`)
        }
        const SteamMarket = `https://steamcommunity.com/market/listings/730/${encodedString}`
        const item_data = {
            name: item.name+' Vanilla',
            rarity_name: "Covert",
            type: "Knives",
            category: category,
            csfloat: CSFloat,
            steam: SteamMarket,
            icon_url: item.image,
            inspect_link: inspect_link,
            steam_price: price ? price.steam.last_ever : null,
        }
        return item_data;
    }

    if (old_data.hasOwnProperty('paint_wear')) {
        item = Object.values(full_skin_data).find(item => item.paint_index === old_data.paint_index.toString() && item.weapon.weapon_id === old_data.def_index);
    } else if (old_data.sticker_id) {
        item = Object.entries(full_item_data).find(([key]) => key.endsWith(`sticker-${old_data.sticker_id}`))?.[1];
    } else if (old_data.hasOwnProperty('keychain_index')) {
        item = Object.entries(full_item_data).find(([key]) => key.endsWith(`keychain-${old_data.keychain_index}`))?.[1];
    } else {
        item = Object.entries(full_item_data).find(([key]) => !key.startsWith("sticker") && key.endsWith(`-${old_data.def_index}`))?.[1];
    }

    if (!item || (item.hasOwnProperty('genuine') && !item.market_hash_name)) {
        return null;
    }

    let price;
    if (old_data.hasOwnProperty('paint_wear')) {
        let title;
        if (old_data.is_stattrak) {
            title = `StatTrak™ ${item.name} (${old_data.wear_name})`;
        } else if (old_data.is_souvenir) {
            title = `Souvenir ${item.name} (${old_data.wear_name})`;
        } else {
            title = `${item.name} (${old_data.wear_name})`;
        }
        price = full_price_data[title];
    } else {
        price = full_price_data[item.name];
    }

    let category;
    if (item.type) {
        category = item.type;
        if (item.name.split(' ')[0] === 'Sticker') {
            category = 'sticker';
        } else if (item.type === 'Sticker Capsule' || item.type === 'Autograph Capsule') {
            category = 'container';
        } 
        if (item.type === 'Case') {
            category = 'container';
        }
    } else if (item.category) {
        category = 'weapon';
    } else if (item.name.split(' ')[0] === 'Charm') {
        category = 'charm';
        item.type = 'Keychain';
    } else {
        const customType = item.id.split("-")[0].replace(/^./, (c) => c);
        category = customType;
    }

    const customType = item.id.split("-")[0].replace(/^./, (c) => c.toUpperCase());
    
    let inspect_link;
    if (old_data.hasOwnProperty('paint_wear')) {
        inspect_link = await generateInspectLinkFromObject(old_data);
    } else {
        inspect_link = null;
    }

    let CSFloat;
    if (old_data.hasOwnProperty('paint_wear')) {
        let category;
        if (old_data.is_souvenir == true) {
            category = 3;
        } else if (old_data.is_stattrak == true) {
            category = 2;
        } else {
            category = 1;
        }
        const floatRange = findFloatRange(old_data.paint_wear);
        CSFloat = `https://csfloat.com/search?sort_by=lowest_price&category=${category}&min_float=${floatRange.min}&max_float=${floatRange.max}&def_index=${old_data.def_index}&paint_index=${old_data.paint_index}`
    } else if (old_data.sticker_id) {
        CSFloat = `https://csfloat.com/search?sort_by=lowest_price&sticker_index=${old_data.sticker_id}`
    } else if (old_data.keychain_index) {
        CSFloat = `https://csfloat.com/search?sort_by=lowest_price&keychain_index=${old_data.keychain_index}`
    } else {
        CSFloat = `https://csfloat.com/search?sort_by=lowest_price&def_index=${old_data.def_index}`
    }

    let SteamMarket;
    if (old_data.hasOwnProperty('paint_wear')) {
        let encodedString;
        if (old_data.is_souvenir == true) {
            encodedString = encodeURIComponent(`Souvenir ${item.name} (${old_data.wear_name})`)
                .replace(/\(/g, "%28")
                .replace(/\)/g, "%29");
        } else if (old_data.is_stattrak == true) {
            encodedString = encodeURIComponent(`StatTrak™ ${item.name} (${old_data.wear_name})`)
                .replace(/\(/g, "%28")
                .replace(/\)/g, "%29");
        } else {
            encodedString = encodeURIComponent(`${item.name} (${old_data.wear_name})`)
                .replace(/\(/g, "%28")
                .replace(/\)/g, "%29");
        }
        SteamMarket = `https://steamcommunity.com/market/listings/730/${encodedString}`
    } else {
        const encodedString = encodeURIComponent(`${item.name}`)
            .replace(/\(/g, "%28")
            .replace(/\)/g, "%29");
        SteamMarket = `https://steamcommunity.com/market/listings/730/${encodedString}`
    }

    const item_data = {
        name: item.name,
        rarity_name: item.hasOwnProperty('rarity') ? item.rarity.name : 'Base Grade',
        type: item.type ?? item.category?.name ?? customType,
        category: category,
        csfloat: CSFloat,
        quantity: old_data.quantity || 1,
        steam: SteamMarket,
        icon_url: item.image,
        inspect_link: inspect_link,
        steam_price: price ? price.steam.last_ever : null,
        is_tradable: old_data.is_tradable,
    }

    return item ? item_data : null;
}


function getWearName(float) {

    const floatRanges = [
        { min: 0.00, max: 0.07, name: 'Factory New' },
        { min: 0.07, max: 0.15, name: 'Minimal Wear' },
        { min: 0.15, max: 0.38, name: 'Field-Tested' },
        { min: 0.38, max: 0.45, name: 'Well-Worn' },
        { min: 0.45, max: 1.00, name: 'Battle-Scarred' }
    ];

    for (const range of floatRanges) {
        if (float >= range.min && float < range.max) {
            return range.name;
        }
    }
    return null;
}


async function appendInfo(mergedData) {

    try {
        const jsonData = mergedData;
        const items = JSON.parse(jsonData);

        for (let i = 0; i < items.length; i++) {
            let item = items[i];

            if (item.def_index === 4001 && item.quantity === 1) {
                items.splice(i, 1);
                i--;
            }

            item = await getStickers(item);
            const new_data = await getItemInfoByDefIndex(item);

            if (new_data) {
                Object.assign(item, new_data);
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

export async function initializeCSGOInventory(authData, loginType) {
    return new Promise((resolve, reject) => {
        const items_data = [];
        const storage_units = [];
        const client = new SteamUser();
        const csgo = new GlobalOffensive(client);

        client.setMaxListeners(30);
        csgo.setMaxListeners(30);

        // Cleanup old listeners before adding new ones
        // client.removeAllListeners();
        // csgo.removeAllListeners();

        let steamID;

        function handleLoggedOn() {
            console.log('Logged into Steam.');
            client.gamesPlayed([730]);
            steamID = client.steamID.getSteamID64();
        }

        if (loginType === 1) {
            console.log('QR Code Flow');
            client.logOn({ refreshToken: authData.refreshToken });
            client.once('loggedOn', handleLoggedOn);
        } else {
            console.log('JWT Flow');
            client.logOn({
                accountName: authData.account_name,
                webLogonToken: authData.token,
                steamID: authData.steamid
            });
            client.once('loggedOn', () => {
                handleLoggedOn();
                client.setPersona(SteamUser.EPersonaState.Online);
            });
        }

        csgo.once('connectedToGC', async () => {
            console.log('Connected to CS2 Game Coordinator.');
            try {
                await fetchData();

                full_item_data = getFullItemData();
                full_price_data = getFullPriceData();
                full_skin_data = getFullSkinData();

                if (!csgo.inventory) throw new Error('Inventory not available.');

                const cleanedInventory = csgo.inventory
                    .filter(item => !item.casket_id)
                    .map(item => mapInventoryItem(item, "Inventory"));

                // Separate normal items and storage units
                const normalItems = [];
                const casketItemsPromises = [];

                for (const item of cleanedInventory) {
                    if (item.casket_contained_item_count) {
                        // Create a promise to fetch the casket contents
                        const casketPromise = getCasketItems(csgo, item)
                            .then(casketContents => {
                                items_data.push(casketContents);
                                storage_units.push({ name: item.custom_name, count: item.casket_contained_item_count });
                            })
                            .catch(err => {
                                console.log('Error fetching casket contents:', err.message);
                            });
                        casketItemsPromises.push(casketPromise);
                    } else {
                        normalItems.push(item);
                    }
                }

                // Wait for ALL casket promises at once
                await Promise.all(casketItemsPromises);

                console.log('Casket items loaded.');

                // Push normal inventory items
                items_data.push(normalItems);

                console.log('Inventory data saved.');

                client.logOff();
                let mergedData = await mergeJsonFiles(items_data);
                mergedData = await mergeData(mergedData);
                mergedData = await appendInfo(mergedData);

                // Cleanup listeners
                client.removeAllListeners();
                csgo.removeAllListeners();

                resolve({ success: true, item_data: mergedData, steamID, storage_units });

            } catch (err) {
                console.error('Error processing inventory:', err);
                client.logOff();

                // Cleanup listeners
                client.removeAllListeners();
                csgo.removeAllListeners();

                reject(err);
            }
        });

        client.once('error', (err) => {
            console.error('Steam login error:', err);

            let error_details = '';
            if (err.message === "AccessDenied") {
                error_details = 'Invalid JWT token. Please try generating a new one.';
            } else if (err.message === "InvalidPassword") {
                error_details = 'Too many API requests. Please try again later.';
            } else if (err.message === "LoggedInElsewhere") {
                error_details = 'Your Steam account is logged in elsewhere. Please log out from other devices and try again.';
            }

            // Cleanup listeners
            client.removeAllListeners();
            csgo.removeAllListeners();

            reject({ success: false, details: `${error_details}`, item_data: [], steamID: null, storage_units: [] });
        });
    });
}

// Helper to clean item
function mapInventoryItem(item, location) {

    const {
        def_index, stickers, paint_wear, attribute, position, level, custom_desc, flags, quality,
        original_id, origin, interior_item, style, in_use, equipped_state, kill_eater_score_type, kill_eater_value,
        ...rest
    } = item;

    const givenDate = new Date(item.tradable_after);
    const now = new Date();
    let is_tradable = true;
    if (givenDate > now) is_tradable = false;

    if (def_index === 1355) {
        const buffer = Buffer.from(attribute.find(attr => attr.def_index === 299).value_bytes);
        const value = buffer.readUInt32LE(0);
        return { def_index, ...rest, quantity: 1, keychain_index: value, location, is_tradable };
    }

    if (def_index === 1209 && Array.isArray(stickers) && stickers.length > 0) {
        return { def_index, quantity: 1, sticker_id: stickers[0].sticker_id, ...rest, quality, location, is_tradable };
    }
    if (paint_wear) {
        const wear_name = getWearName(paint_wear);
        if (kill_eater_score_type === 0) {
            return { def_index, ...rest, quantity: 1, quality, paint_wear, wear_name, sttattrak_count: kill_eater_value, stickers, is_stattrak: true, is_souvenir: false, location, is_tradable };
        }
        if (quality === 12) {
            return { def_index, ...rest, quantity: 1, quality, paint_wear, wear_name, sttattrak_count: kill_eater_value, stickers, is_stattrak: false, is_souvenir: true, location, is_tradable };
        }
        return { def_index, ...rest, quantity: 1, quality, paint_wear, wear_name, stickers, is_stattrak: false, is_souvenir: false, location, is_tradable };
    }
    return { def_index, ...rest, quantity: 1, quality, location, is_tradable };
}

// Helper to fetch casket items
async function getCasketItems(csgo, item) {
    return new Promise((resolve, reject) => {
        csgo.getCasketContents(item.id, (err, items) => {
            if (err) {
                reject(new Error('Error fetching casket contents: ' + err));
            } else {
                const mapped = items.map(i => mapInventoryItem(i, item.custom_name));
                resolve(mapped);
            }
        });
    });
}


async function fetchCasketContentsWithRetry(csgo, casketId, retries = 3, delay = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const casketContents = await Promise.race([
        new Promise((resolve, reject) => {
          csgo.getCasketContents(casketId, (err, contents) => {
            if (err) return reject(err);
            resolve(contents);
          });
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 30000)), // custom 30s timeout
      ]);

      return casketContents;
    } catch (err) {
      console.warn(`Attempt ${attempt} failed: ${err.message}`);
      if (attempt < retries) {
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw new Error(`Failed to load casket after ${retries} retries: ${err.message}`);
      }
    }
  }
}

