import SteamUser from 'steam-user';
import GlobalOffensive from 'globaloffensive';
import fs from 'fs';
import CRC32 from 'crc-32';
import protobuf from 'protobufjs';
import path from 'path';
import { getItemData, getPriceData, getSkinData } from '@/lib/data-loader'


function findFloatRange(float) {

    const floatRanges = [
        { min: 0.00, max: 0.01 },
        { min: 0.01, max: 0.02 },
        { min: 0.02, max: 0.03 },
        { min: 0.03, max: 0.04 },
        { min: 0.04, max: 0.07 },
        { min: 0.07, max: 0.08 },
        { min: 0.08, max: 0.09 },
        { min: 0.09, max: 0.10 },
        { min: 0.10, max: 0.15 },
        { min: 0.15, max: 0.18 },
        { min: 0.18, max: 0.21 },
        { min: 0.21, max: 0.24 },
        { min: 0.24, max: 0.27 },
        { min: 0.27, max: 0.38 },
        { min: 0.38, max: 0.39 },
        { min: 0.39, max: 0.40 },
        { min: 0.40, max: 0.41 },
        { min: 0.41, max: 0.42 },
        { min: 0.42, max: 0.45 },
        { min: 0.45, max: 0.50 },
        { min: 0.50, max: 0.60 },
        { min: 0.60, max: 0.70 },
        { min: 0.70, max: 0.80 },
        { min: 0.80, max: 0.90 },
        { min: 0.90, max: 1.00 }
    ];

    for (const range of floatRanges) {
        if (float >= range.min && float < range.max) {
            return range;
        }
    }
    return null;
}

const rootFolder = process.cwd();
const full_item_data_filePath = path.join(rootFolder, 'public/item_data.json');
const full_price_data_filePath = path.join(rootFolder, 'public/price_data.json');
const full_skin_data_filePath = path.join(rootFolder, 'public/skins_data.json');
const full_item_data = JSON.parse(fs.readFileSync(full_item_data_filePath, 'utf8'));
const full_price_data = JSON.parse(fs.readFileSync(full_price_data_filePath, 'utf8'));
const full_skin_data = JSON.parse(fs.readFileSync(full_skin_data_filePath, 'utf8'));


// let full_item_data;
// let full_price_data;
// let full_skin_data;

// async function fetchDataOnce() {
//     [full_item_data, full_price_data, full_skin_data] = await Promise.all([
//         getItemData(),
//         getPriceData(),
//         getSkinData(),
//     ]);
// }
  
// fetchDataOnce();


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
    
            let key;
            if (!hasPaintIndex && !hasStickerId) {
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


async function getItemInfoByDefIndex(old_data) {

    if (old_data.def_index ===  1201 || (old_data.def_index === 36 && old_data.paint_index === 125)) return null;

    let item;
    if (old_data.paint_wear) {
        item = Object.values(full_skin_data).find(item => item.paint_index === old_data.paint_index.toString() && item.weapon.weapon_id === old_data.def_index);
    } else if (old_data.sticker_id) {
        item = Object.entries(full_item_data).find(([key]) => key.endsWith(`sticker-${old_data.sticker_id}`))?.[1];
    } else {
        item = Object.entries(full_item_data).find(([key]) => !key.startsWith("sticker") && key.endsWith(`-${old_data.def_index}`))?.[1];
    }

    if (!item || (item.hasOwnProperty('genuine') && !item.market_hash_name)) {
        return null;
    }

    let price;
    if (old_data.paint_wear) {
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
    } else {
        const customType = item.id.split("-")[0].replace(/^./, (c) => c);
        category = customType;
    }

    const customType = item.id.split("-")[0].replace(/^./, (c) => c.toUpperCase());
    
    let inspect_link;
    if (old_data.paint_wear) {
        inspect_link = await generateInspectLinkFromObject(old_data);
    } else {
        inspect_link = null;
    }

    let CSFloat;
    if (old_data.paint_wear) {
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
    } else {
        CSFloat = `https://csfloat.com/search?sort_by=lowest_price&def_index=${old_data.def_index}`
    }

    let SteamMarket;
    if (old_data.paint_wear) {
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
        steam: SteamMarket,
        icon_url: item.image,
        inspect_link: inspect_link,
        steam_price: price ? price.steam.last_ever : null,
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
            const item = items[i];

            if (item.def_index === 4001 && item.quantity === 1) {
                items.splice(i, 1);
                i--;
            }

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
        let steamID;

        if (loginType === 1) {
            console.log('QR Code Flow');

            client.logOn({
                refreshToken: authData.refreshToken
            });
    
            client.on('loggedOn', () => {
                console.log('Logged into Steam.');
                client.setPersona(SteamUser.EPersonaState.Online);
                client.gamesPlayed([730]);
                steamID = client.steamID.getSteamID64();
            });

        } else {
            console.log('JWT Flow');

            client.logOn({
                accountName: authData.account_name,
                webLogonToken: authData.token,
                steamID: authData.steamid
            });
    
            client.on('loggedOn', () => {
                console.log('Logged into Steam.');
                client.setPersona(SteamUser.EPersonaState.Online);
                client.gamesPlayed([730]);
                steamID = client.steamID.getSteamID64();
                console.log('Get SteamID.');
            });
        }    

        csgo.on('connectedToGC', async () => {
            console.log('Connected to CS2 Game Coordinator.');

            if (csgo.inventory) {
                console.log('Inside Inventory.');
                try {
                    const cleanedInventory = csgo.inventory
                        .filter(item => !item.casket_id)
                        .map(({ 
                            def_index, stickers, paint_wear, attribute, position, level, custom_desc, flags, quality,
                            original_id, origin, interior_item, style, in_use, equipped_state, kill_eater_score_type, kill_eater_value, ...rest 
                        }) => {
                            const location = "Inventory";
                            if (def_index === 1209 && Array.isArray(stickers) && stickers.length > 0) {
                                return { def_index, sticker_id: stickers[0].sticker_id, ...rest, quality, location };
                            }
                            if (paint_wear) {
                                const wear_name = getWearName(paint_wear);
                                if (kill_eater_score_type === 0) {
                                    return { def_index, ...rest, quality, paint_wear, wear_name, sttattrak_count: kill_eater_value, stickers, is_stattrak: true, is_souvenir: false, location };
                                }
                                if (quality === 12) {
                                    return { def_index, ...rest, quality, paint_wear, wear_name, sttattrak_count: kill_eater_value, stickers, is_stattrak: false, is_souvenir: true, location };
                                }
                                return { def_index, ...rest, quality, paint_wear, wear_name, stickers, is_stattrak: false, is_souvenir: false, location };
                            }
                            return { def_index, ...rest, quality, location };
                        });
                    for (const item of cleanedInventory) {
                        if (item.casket_contained_item_count) {
                            try {
                                const items = await new Promise((resolve, reject) => {
                                    csgo.getCasketContents(item.id, (err, items) => {
                                        if (err) {
                                            reject(new Error('Error fetching casket contents: ' + err));
                                        } else {
                                            const mappedCasketItems = items
                                                .map(({ 
                                                    def_index, stickers, paint_wear, attribute, position, level, custom_desc, flags, quality,
                                                    original_id, origin, interior_item, style, in_use, equipped_state, kill_eater_score_type, kill_eater_value, ...rest 
                                                }) => {
                                                    const location = item.custom_name;
                                                    if (def_index === 1209 && Array.isArray(stickers) && stickers.length > 0) {
                                                        return { def_index, sticker_id: stickers[0].sticker_id, ...rest, quality, location };
                                                    }
                                                    if (paint_wear) {
                                                        const wear_name = getWearName(paint_wear);
                                                        if (kill_eater_score_type === 0) {
                                                            return { def_index, ...rest, quality, paint_wear, wear_name, sttattrak_count: kill_eater_value, stickers, is_stattrak: true, is_souvenir: false, location };
                                                        }
                                                        if (quality === 12) {
                                                            return { def_index, ...rest, quality, paint_wear, wear_name, sttattrak_count: kill_eater_value, stickers, is_stattrak: false, is_souvenir: true, location };
                                                        }
                                                        return { def_index, ...rest, quality, paint_wear, wear_name, stickers, is_stattrak: false, is_souvenir: false, location };
                                                    }
                                                    return { def_index, ...rest, quality, location };
                                                });
                                    
                                            resolve(mappedCasketItems);
                                        }
                                    });
                                });
                                console.log(`Casket contents for ${item.custom_name} saved.`);
                                items_data.push(items);
                                storage_units.push({ name: item.custom_name, count: item.casket_contained_item_count});
                            } catch (err) {
                                console.error(err.message);
                            }
                        }
                    }
                    console.log('Inventory data saved.');
                    items_data.push(cleanedInventory);

                    client.logOff();
                    let mergedData = await mergeJsonFiles(items_data);
                    mergedData = await mergeData(mergedData);
                    mergedData = await appendInfo(mergedData);

                    // const rootFolder = process.cwd();
                    // const filePath = path.join(rootFolder, `temp/full_inventory_data-${steamID}.json`);
                    // fs.writeFileSync(filePath, mergedData, 'utf-8');

                    resolve({ item_data: mergedData, steamID: steamID, storage_units: storage_units });
                } catch (err) {
                    console.error('Error processing inventory:', err);
                    reject(err);
                }
            } else {
                console.log('Inventory not available.');
                client.logOff();
                reject(new Error('Inventory not available.'));
            }
        });

        client.on('error', (err) => {
            console.error('Steam login error:', err);
            reject(err);
        });
    });
}